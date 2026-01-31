"""
OCR (Optical Character Recognition) Model Service

Extracts text from ID document images using EasyOCR (primary) or Tesseract (fallback).
Attempts to parse structured data based on ID type.

EasyOCR uses deep learning and performs much better on ID cards with
complex backgrounds like Philippine government IDs.
"""
import re
import logging
from typing import Dict, Any, Optional, List
from pathlib import Path

from PIL import Image
import numpy as np

logger = logging.getLogger(__name__)

# Try to import EasyOCR (primary)
_easyocr_available = False
_easyocr_reader = None
try:
    import easyocr
    _easyocr_available = True
    logger.info("EasyOCR is available - will initialize on first use")
except ImportError:
    logger.warning("easyocr not installed")

# Try to import pytesseract (fallback)
_tesseract_available = False
try:
    import pytesseract
    _tesseract_available = True
    logger.info("Tesseract OCR is available as fallback")
except ImportError:
    logger.warning("pytesseract not installed")


def is_available() -> bool:
    """Check if OCR is available."""
    return _easyocr_available or _tesseract_available


def get_easyocr_reader():
    """Get or create EasyOCR reader (lazy initialization)."""
    global _easyocr_reader
    if _easyocr_reader is None and _easyocr_available:
        logger.info("Initializing EasyOCR reader (this may take a moment)...")
        import easyocr
        _easyocr_reader = easyocr.Reader(['en'], gpu=False)
        logger.info("EasyOCR reader initialized")
    return _easyocr_reader

def warmup_easyocr_reader(timeout_secs: int = 0):
    """
    Force initialization (and model download) during startup to avoid the first request stalling.
    """
    if not _easyocr_available:
        return False

    try:
        reader = get_easyocr_reader()
        if reader:
            # Optionally wait for cache to be populated (timeout not used for now)
            logger.info("EasyOCR warmup completed")
            return True
    except Exception as exc:
        logger.warning("EasyOCR warmup failed: %s", exc)

    return False


def preprocess_image_for_easyocr(image: Image.Image) -> np.ndarray:
    """
    Light preprocessing for EasyOCR - preserves color information.
    
    EasyOCR's deep learning models work best on color images with
    minimal preprocessing. Heavy thresholding destroys text on
    holographic ID cards.
    """
    # Resize image to optimal range for OCR
    # For CPU-based processing, smaller is faster
    # 1000-1200px is a good balance for ID cards
    min_width = 1000
    max_width = 1200  # Reduced from 1600 for faster CPU processing
    
    original_width = image.width
    if image.width > max_width:
        # Resize large images DOWN for faster processing
        ratio = max_width / image.width
        new_size = (int(image.width * ratio), int(image.height * ratio))
        image = image.resize(new_size, Image.Resampling.LANCZOS)
        logger.info(f"Resized large image from {original_width}px to {new_size[0]}px width")
    elif image.width < min_width:
        # Resize small images UP for better text recognition
        ratio = min_width / image.width
        new_size = (int(image.width * ratio), int(image.height * ratio))
        image = image.resize(new_size, Image.Resampling.LANCZOS)
        logger.info(f"Resized small image from {original_width}px to {new_size[0]}px width")
    
    # Convert to RGB if needed (EasyOCR works best on RGB)
    if image.mode == 'RGBA':
        # Create white background and paste image
        background = Image.new('RGB', image.size, (255, 255, 255))
        background.paste(image, mask=image.split()[3])
        image = background
    elif image.mode != 'RGB':
        image = image.convert('RGB')
    
    img_array = np.array(image)
    
    # Light contrast enhancement using CLAHE (Contrast Limited Adaptive Histogram Equalization)
    # This helps with ID cards that have holographic/security features
    try:
        import cv2
        # Convert to LAB color space for better contrast enhancement
        lab = cv2.cvtColor(img_array, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        
        # Apply CLAHE to L channel only (preserves color)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        
        # Merge back
        lab = cv2.merge([l, a, b])
        img_array = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
        
        # Optional: light sharpening to improve text edges
        kernel = np.array([[-0.5, -0.5, -0.5],
                          [-0.5,  5.0, -0.5],
                          [-0.5, -0.5, -0.5]])
        img_array = cv2.filter2D(img_array, -1, kernel)
        img_array = np.clip(img_array, 0, 255).astype(np.uint8)
        
    except ImportError:
        # Fallback: simple contrast stretching per channel
        for i in range(3):
            channel = img_array[:, :, i]
            p2, p98 = np.percentile(channel, (2, 98))
            channel = np.clip(channel, p2, p98)
            img_array[:, :, i] = ((channel - p2) / (p98 - p2 + 1e-6) * 255).astype(np.uint8)
    
    return img_array


def preprocess_image_for_tesseract(image: Image.Image) -> Image.Image:
    """
    Heavier preprocessing for Tesseract OCR (fallback).
    
    Tesseract works better on high-contrast grayscale/binary images.
    """
    # Resize if image is too small
    min_width = 1000
    if image.width < min_width:
        ratio = min_width / image.width
        new_size = (int(image.width * ratio), int(image.height * ratio))
        image = image.resize(new_size, Image.Resampling.LANCZOS)
    
    # Convert to grayscale
    if image.mode != 'L':
        image = image.convert('L')
    
    img_array = np.array(image)
    
    # Contrast enhancement using histogram stretching
    p2, p98 = np.percentile(img_array, (2, 98))
    img_array = np.clip(img_array, p2, p98)
    img_array = ((img_array - p2) / (p98 - p2 + 1e-6) * 255).astype(np.uint8)
    
    # Apply adaptive thresholding
    try:
        import cv2
        img_array = cv2.adaptiveThreshold(
            img_array, 255, 
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 
            blockSize=31,
            C=10
        )
    except ImportError:
        threshold = np.mean(img_array)
        img_array = ((img_array > threshold) * 255).astype(np.uint8)
    
    return Image.fromarray(img_array)


def extract_text(image: Image.Image) -> str:
    """
    Extract raw text from an image using EasyOCR (primary) or Tesseract (fallback).
    
    Args:
        image: PIL Image object
        
    Returns:
        Extracted text as string
    """
    # Try EasyOCR first (much better for ID cards)
    if _easyocr_available:
        try:
            reader = get_easyocr_reader()
            if reader:
                # Apply light preprocessing optimized for EasyOCR
                img_array = preprocess_image_for_easyocr(image)
                
                logger.info(f"Running EasyOCR on image {img_array.shape}")
                
                # Run EasyOCR with optimized parameters for ID cards
                # - paragraph=False: Keep text boxes separate for better field extraction
                # - detail=1: Return bounding boxes for potential spatial analysis
                # - low_text=0.3: Lower threshold for detecting faint text on IDs
                # - text_threshold=0.5: Balance between detecting text and filtering noise
                results = reader.readtext(
                    img_array,
                    paragraph=False,
                    detail=1,
                    low_text=0.3,
                    text_threshold=0.5,
                )
                
                # Sort results by vertical position (top to bottom) for better parsing
                # Each result is (bbox, text, confidence) where bbox is [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
                results_sorted = sorted(results, key=lambda x: (x[0][0][1], x[0][0][0]))
                
                # Combine all detected text with confidence filtering
                text_parts = []
                for (bbox, text, confidence) in results_sorted:
                    if confidence > 0.2:  # Lower threshold to catch more text
                        # Clean up common OCR errors
                        cleaned_text = text.strip()
                        if cleaned_text:
                            text_parts.append(cleaned_text)
                            logger.debug(f"  Detected: '{cleaned_text}' (conf: {confidence:.2f})")
                
                text = '\n'.join(text_parts)
                logger.info(f"EasyOCR extracted {len(text)} characters ({len(results)} text regions)")
                
                # Log the full raw text for debugging
                logger.info(f"Raw OCR text:\n{text}")
                
                if text.strip():
                    return text
                    
        except Exception as e:
            logger.warning(f"EasyOCR failed, falling back to Tesseract: {e}", exc_info=True)
    
    # Fallback to Tesseract
    if _tesseract_available:
        try:
            import pytesseract
            
            # Apply heavier preprocessing for Tesseract
            processed = preprocess_image_for_tesseract(image)
            
            # Use PSM 6 (uniform block of text) which works well for ID cards
            text = pytesseract.image_to_string(processed, config=r'--oem 3 --psm 6')
            
            logger.info(f"Tesseract extracted {len(text)} characters")
            return text
            
        except Exception as e:
            logger.error(f"Tesseract OCR failed: {e}")
    
    logger.warning("No OCR engine available - returning empty text")
    return ""


def parse_date(text: str) -> Optional[str]:
    """Try to parse a date from text and return in YYYY-MM-DD format."""
    # Common date patterns
    patterns = [
        r'(\d{4}[-/]\d{2}[-/]\d{2})',  # YYYY-MM-DD or YYYY/MM/DD
        r'(\d{2}[-/]\d{2}[-/]\d{4})',  # DD-MM-YYYY or DD/MM/YYYY
        r'(\d{2}[-/]\d{2}[-/]\d{2})',  # DD-MM-YY
        r'([A-Z]{3}\s+\d{1,2},?\s+\d{4})',  # JAN 01, 2000
        r'(\d{1,2}\s+[A-Z]{3}\s+\d{4})',  # 01 JAN 2000
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1)
    return None


def parse_id_number(text: str, id_type: str) -> Optional[str]:
    """Extract ID number based on ID type patterns."""
    
    logger.debug(f"Parsing ID number for type: {id_type}")
    
    # For driver's license, use special extraction logic
    if id_type == 'drivers_license':
        return extract_drivers_license_number(text)
    
    patterns = {
        # PhilSys Card Number (PCN) is 12 digits: XXXX-XXXX-XXXX
        'philsys_id': r'(\d{4}[-\s]?\d{4}[-\s]?\d{4})(?!\d)',
        'sss_id': r'(\d{2}[-\s]?\d{7}[-\s]?\d{1})',  # XX-XXXXXXX-X
        'umid': r'(\d{4}[-\s]?\d{7}[-\s]?\d{1})',  # XXXX-XXXXXXX-X
        'passport': r'([A-Z][A-Z0-9]{7,8})',  # P1234567A or P12345678
        'prc_id': r'(\d{6,7})',  # 0123456 or 123456
        'tin_id': r'(\d{3}[-\s]?\d{3}[-\s]?\d{3}(?:[-\s]?\d{3})?)',  # XXX-XXX-XXX or XXX-XXX-XXX-XXX
        'voters_id': r'(\d{4}[-\s]?\d{4}[A-Z]?[-\s]?[A-Z]?\d{3,4}[A-Z]*\d*)',  # Variable format
        'postal_id': r'(\d{8,12})',  # Variable length
    }
    
    pattern = patterns.get(id_type)
    if pattern:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            logger.debug(f"Found ID number: {match.group(1)}")
            return match.group(1)
    
    # General labeled patterns for other ID types
    labeled_patterns = [
        r'id\s*(?:no\.?|number|#)[:\s]*([A-Z0-9][-\s\dA-Z]+)',
        r'registration\s*(?:no\.?|number|#)[:\s]*(\d{6,7})',
        r'(?:crn|pcn|psn)[:\s]*([A-Z0-9][-\s\dA-Z]+)',
    ]
    
    for lp in labeled_patterns:
        match = re.search(lp, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    
    # Fallback: look for any substantial number sequence
    match = re.search(r'(\d{6,})', text)
    if match:
        return match.group(1)
    
    return None


def extract_drivers_license_number(text: str) -> Optional[str]:
    """
    Extract Philippine Driver's License number.
    
    Format: X00-00-000000 (e.g., A12-23-003519)
    - 1 letter (agency code prefix)
    - 2 digits
    - 2 digits  
    - 5-6 digits
    """
    logger.debug(f"Searching for license number in text:\n{text[:500]}...")
    
    # First, try to find the full license number pattern anywhere in text
    # Pattern: Letter + 2 digits + separator + 2 digits + separator + 5-6 digits
    # Also handle OCR errors like "Ai2" instead of "A12" (lowercase i instead of 1)
    full_patterns = [
        r'([A-Z]\d{2}[-\s]?\d{2}[-\s]?\d{5,6})',  # A12-23-003519 or A12 23 003519
        r'([A-Z][iIl1]\d[-\s]?\d{2}[-\s]?\d{5,6})',  # Ai2-23-003519 (OCR error: i instead of 1)
        r'([A-Z]\d{2}\d{2}\d{5,6})',  # A1223003519 (no separators)
        r'([A-Z]\d{2}[-\s]?\d{2}[-\s]?\d{4,6})',  # Allow 4-6 digits at end
    ]
    
    for pattern in full_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result = match.group(1).upper()
            # Keep the first character as-is (it's the agency code letter A-Z)
            first_char = result[0] if result[0].isalpha() else 'A'
            rest = result[1:]
            # Fix common OCR errors in the numeric part: i/l -> 1, O -> 0
            rest = rest.replace('I', '1').replace('L', '1').replace('O', '0')
            result = first_char + rest
            # Normalize format to X00-00-000000
            result = re.sub(r'\s+', '-', result)  # Replace spaces with dashes
            logger.info(f"Found driver's license number: {result}")
            return result
    
    # Try labeled patterns (near "License No" text)
    labeled_patterns = [
        r'license\s*(?:no\.?|number|#)?[:\.\s]*([A-Z]\d{2}[-\s]?\d{2}[-\s]?\d{4,6})',
        r'(?:no\.?|#)[:\.\s]*([A-Z]\d{2}[-\s]?\d{2}[-\s]?\d{4,6})',
        r'license\s*(?:no\.?|number|#)?[:\.\s]*([A-Z][-\d\s]{8,14})',
    ]
    
    for pattern in labeled_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result = match.group(1).strip()
            result = re.sub(r'[-\s]+$', '', result)  # Remove trailing separators
            result = re.sub(r'\s+', '-', result)  # Normalize spaces to dashes
            logger.info(f"Found driver's license number (labeled): {result}")
            return result
    
    # Try to find parts and reconstruct
    # Sometimes OCR splits the number across lines or has OCR errors
    lines = text.split('\n')
    
    # Look for lines that might contain the license number
    for i, line in enumerate(lines):
        logger.debug(f"Checking line {i}: {line}")
        
        # Look for pattern like "A12-23-003519" with possible OCR errors
        # Also try with lowercase in case OCR misreads
        line_upper = line.upper()
        
        # Check for agency code pattern (single letter + 2 digits)
        agency_match = re.search(r'\b([A-Z]\d{2})\b', line_upper)
        if agency_match:
            agency_code = agency_match.group(1)
            logger.debug(f"Found agency code candidate: {agency_code}")
            
            # Look for remaining digits in same line
            remaining = line_upper[agency_match.end():]
            
            # Check same line for various patterns
            digits_patterns = [
                r'[-\s]?(\d{2})[-\s]?(\d{5,6})',  # -23-003519
                r'[-\s]?(\d{2})[-\s]?(\d{4,6})',  # -23-03519 (OCR might miss a digit)
                r'[-\s\.]?(\d{2})[-\s\.]?(\d{4,6})',  # with periods
            ]
            
            for dp in digits_patterns:
                digits_match = re.search(dp, remaining)
                if digits_match:
                    result = f"{agency_code}-{digits_match.group(1)}-{digits_match.group(2)}"
                    logger.info(f"Reconstructed driver's license number: {result}")
                    return result
            
            # Check next line
            if i + 1 < len(lines):
                next_line = lines[i + 1].upper()
                for dp in digits_patterns:
                    digits_match = re.search(dp, next_line)
                    if digits_match:
                        result = f"{agency_code}-{digits_match.group(1)}-{digits_match.group(2)}"
                        logger.info(f"Reconstructed driver's license number (multi-line): {result}")
                        return result
    
    # Last resort: look for any sequence that looks like a license number
    # This handles cases where OCR breaks up the number
    all_text = text.upper().replace('\n', ' ')
    
    # Try to find agency code followed eventually by the rest
    agency_codes = re.findall(r'\b([A-Z]\d{2})\b', all_text)
    for agency in agency_codes:
        # Look for digits after this agency code
        idx = all_text.find(agency)
        if idx >= 0:
            after_agency = all_text[idx + len(agency):idx + len(agency) + 30]
            # Look for digits
            digits = re.findall(r'\d+', after_agency)
            if len(digits) >= 2:
                # Try to construct: agency-XX-XXXXXX
                first_part = digits[0][:2] if len(digits[0]) >= 2 else digits[0]
                second_part = digits[1] if len(digits) > 1 else ''
                if len(second_part) >= 4:
                    result = f"{agency}-{first_part}-{second_part[:6]}"
                    logger.info(f"Reconstructed driver's license number (last resort): {result}")
                    return result
    
    logger.warning("Could not find driver's license number")
    return None


def parse_name_components(full_name: str) -> Dict[str, str]:
    """
    Parse a full name into lastName, firstName, middleName components.
    
    Philippine ID format: "LASTNAME, FIRSTNAME(S) MIDDLENAME"
    - LASTNAME: Family name (before comma)
    - FIRSTNAME: Given name(s), can be multiple words
    - MIDDLENAME: Mother's maiden surname (LAST word after comma)
    
    Example: "DIAZ, MARK STEPHEN CABALSI"
    - lastName: DIAZ
    - firstName: MARK STEPHEN
    - middleName: CABALSI
    """
    result = {}
    
    if not full_name:
        return result
    
    # Clean the name
    name = full_name.strip()
    name = re.sub(r'[^A-Za-z\s,.\'-ÑñÀ-ÿ]', '', name)
    
    logger.info(f"Parsing name components: '{name}'")
    
    # Check for "LASTNAME, FIRSTNAME(S) MIDDLENAME" format (Philippine ID format)
    if ',' in name:
        parts = name.split(',', 1)
        result['lastName'] = parts[0].strip()
        
        if len(parts) > 1:
            remaining = parts[1].strip().split()
            if len(remaining) >= 3:
                # Last word is middle name (mother's maiden surname in PH)
                result['middleName'] = remaining[-1]
                # Everything else is first name (can be multiple words)
                result['firstName'] = ' '.join(remaining[:-1])
            elif len(remaining) == 2:
                # Two words: first name and middle name
                result['firstName'] = remaining[0]
                result['middleName'] = remaining[1]
            elif len(remaining) == 1:
                # Only first name, no middle name
                result['firstName'] = remaining[0]
        
        logger.info(f"Parsed (comma format): lastName={result.get('lastName')}, firstName={result.get('firstName')}, middleName={result.get('middleName')}")
    else:
        # No comma - OCR might have merged words (e.g., "DIAZMARK STEPHEN CABALSI")
        # For Philippine IDs, the expected format is: LASTNAME FIRSTNAME(S) MIDDLENAME
        # where MIDDLENAME is the mother's maiden surname (last word)
        words = name.split()
        logger.info(f"No comma found, words: {words}")
        
        if len(words) >= 3:
            # Philippine format without comma:
            # Last word = Middle Name (mother's maiden surname)
            # First word = might be LastName or merged LastName+FirstName
            # Middle words = First Name(s)
            
            result['middleName'] = words[-1]  # Last word is middle name
            
            # Check if first word might be merged (unusually long like "DIAZMARK")
            first_word = words[0]
            if len(first_word) > 6 and len(words) == 3:
                # First word might be merged LastName+FirstName
                # Try to split it - look for common split points
                # Common pattern: 4-5 letter last name + first name
                # Try splitting at different points
                best_split = None
                for i in range(3, len(first_word) - 2):
                    potential_last = first_word[:i]
                    potential_first = first_word[i:]
                    # Both parts should be at least 3 chars and look like names
                    if len(potential_last) >= 3 and len(potential_first) >= 3:
                        # Prefer splits where both parts start with consonants or common letters
                        if potential_first[0] in 'BCDFGHJKLMNPQRSTVWXYZ' or potential_last[-1] in 'AEIOU':
                            best_split = (potential_last, potential_first)
                            break
                
                if best_split:
                    result['lastName'] = best_split[0]
                    result['firstName'] = best_split[1] + ' ' + ' '.join(words[1:-1]) if len(words) > 3 else best_split[1]
                    logger.info(f"Split merged name: {first_word} -> {best_split}")
                else:
                    # Can't split, use first word as lastName
                    result['lastName'] = first_word
                    result['firstName'] = ' '.join(words[1:-1]) if len(words) > 2 else words[1] if len(words) > 1 else ''
            else:
                # Normal case: first word is lastName
                result['lastName'] = words[0]
                result['firstName'] = ' '.join(words[1:-1])
                
        elif len(words) == 2:
            result['firstName'] = words[0]
            result['lastName'] = words[1]
        elif len(words) == 1:
            result['lastName'] = words[0]
        
        logger.info(f"Parsed (no comma): lastName={result.get('lastName')}, firstName={result.get('firstName')}, middleName={result.get('middleName')}")
    
    return result


def is_address_text(line: str) -> bool:
    """Check if a line looks like address text (not a name)."""
    line_upper = line.upper()
    address_keywords = [
        'BOULEVARD', 'BLVD', 'STREET', 'ST.', 'AVENUE', 'AVE', 'ROAD', 'RD',
        'DRIVE', 'DR.', 'LANE', 'LN', 'HIGHWAY', 'HWY', 'BARANGAY', 'BRGY',
        'POB', 'POBLACION', 'CITY', 'MUNICIPALITY', 'PROVINCE',
        'SUBDIVISION', 'SUBD', 'VILLAGE', 'VILL', 'COMPOUND'
    ]
    return any(kw in line_upper for kw in address_keywords)


def extract_name(text: str, id_type: str = 'unknown') -> Optional[str]:
    """Try to extract a name from text. Returns full name string."""
    lines = text.split('\n')
    
    logger.info(f"Extracting name from {len(lines)} lines")
    
    # Log all lines for debugging
    for i, line in enumerate(lines):
        logger.info(f"  Line {i}: '{line.strip()}'")
    
    # PRIORITY 1: Look for name after label line "Last Name. First Name. Middle Name"
    # This is the most reliable - the name should be right after the label
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        lower_line = line_stripped.lower()
        
        # Check if this is a name label line
        is_label_line = (
            ('last name' in lower_line and 'first name' in lower_line) or
            ('last name' in lower_line and 'middle name' in lower_line) or
            ('last name' in lower_line and 'first name' in lower_line and 'middle' in lower_line) or
            (lower_line.count('name') >= 2 and 'address' not in lower_line)
        )
        
        if is_label_line and i + 1 < len(lines):
            next_line = lines[i + 1].strip()
            logger.info(f"Found name label line '{line_stripped}', checking next line: '{next_line}'")
            
            # Skip if next line looks like header or address
            next_upper = next_line.upper()
            if 'REPUBLIC' in next_upper or 'PHILIPPINES' in next_upper:
                continue
            if is_address_text(next_line):
                continue
            
            # Validate it looks like a name
            # Should be mostly letters, multiple words, no address keywords
            if len(next_line) > 5 and ' ' in next_line:
                name = re.sub(r'[^A-Za-z\s,.\'-ÑñÀ-ÿ]', '', next_line)
                words = name.split()
                if len(words) >= 2 and not is_address_text(name):
                    logger.info(f"Found name after label: {name}")
                    return name
    
    # PRIORITY 2: Look for comma-separated name pattern "LASTNAME, FIRSTNAME MIDDLENAME"
    # BUT filter out address lines that have commas
    for line in lines:
        line = line.strip()
        
        # Must have a comma (indicates Last, First format)
        if ',' not in line:
            continue
        
        # Skip lines with too many numbers (likely IDs/dates)
        digit_count = len(re.findall(r'\d', line))
        if digit_count > 2:
            continue
        
        # Skip address text
        if is_address_text(line):
            logger.info(f"Skipping address line: {line}")
            continue
        
        # Skip obvious header text
        line_upper = line.upper()
        if 'REPUBLIC' in line_upper or 'PHILIPPINES' in line_upper:
            continue
        if 'DEPARTMENT' in line_upper or 'TRANSPORTATION' in line_upper:
            continue
        if 'SIGNATURE' in line_upper or 'ASSISTANT' in line_upper:
            continue
            
        # Match pattern: WORD(S), WORD(S) - at least 2 parts with letters
        parts = line.split(',')
        if len(parts) >= 2:
            before_comma = parts[0].strip()
            after_comma = ','.join(parts[1:]).strip()
            
            # Both parts should have mostly letters
            before_letters = re.sub(r'[^A-Za-zÑñ]', '', before_comma)
            after_letters = re.sub(r'[^A-Za-zÑñ]', '', after_comma)
            
            if len(before_letters) >= 2 and len(after_letters) >= 3:
                name = re.sub(r'[^A-Za-z\s,.\'-ÑñÀ-ÿ]', '', line)
                if len(name) > 5:
                    logger.info(f"Found name with comma pattern: {name}")
                    return name
    
    # PRIORITY 3: Look for all-caps line with multiple words (no comma)
    # that appears after a name-related label
    for line in lines:
        line = line.strip()
        
        if len(line) < 8 or not line.isupper():
            continue
        if re.search(r'\d', line):  # Skip lines with numbers
            continue
        if is_address_text(line):
            continue
        
        # Skip header text
        skip_patterns = ['REPUBLIC', 'PHILIPPINES', 'DEPARTMENT', 'TRANSPORTATION',
                        'LICENSE', 'DRIVER', 'SIGNATURE', 'ATTY', 'ASSISTANT', 'SECRETARY']
        if any(kw in line.upper() for kw in skip_patterns):
            continue
        
        # Should have multiple words
        words = line.split()
        if len(words) >= 3 and all(len(w) >= 2 for w in words[:3]):
            name = re.sub(r'[^A-Za-z\s,.\'-ÑñÀ-ÿ]', '', line)
            logger.info(f"Found all-caps name: {name}")
            return name
    
    logger.info("No name found")
    return None


def extract_name_fields(text: str, id_type: str = 'unknown') -> Dict[str, str]:
    """
    Extract name as separate fields (lastName, firstName, middleName).
    
    Returns:
        Dictionary with lastName, firstName, middleName keys
    """
    # First try to get the full name
    full_name = extract_name(text, id_type)
    
    if full_name:
        return parse_name_components(full_name)
    
    return {}


def extract_drivers_license_fields(text: str, lines: List[str]) -> Dict[str, str]:
    """
    Extract Driver's License specific fields.
    
    Fields:
    - dlCodes: DL Codes/Restrictions (e.g., "A, A1, B, B1, B2")
    - agencyCode: Agency Code (e.g., "A12")
    - conditions: Conditions (e.g., "NONE", "1, 2")
    - eyesColor: Eyes Color (e.g., "BLACK", "BROWN")
    """
    result = {}
    
    logger.debug(f"Extracting driver's license fields from {len(lines)} lines")
    
    # Extract DL Codes
    # Format: "DL Codes" followed by codes like "B,B1,B2" or "B.B1.B2"
    # Valid DL codes are: A, A1, B, B1, B2, C, D, BE, CE, etc.
    for i, line in enumerate(lines):
        line_lower = line.lower()
        if 'dl code' in line_lower or 'dl codes' in line_lower:
            logger.debug(f"Found DL codes line: {line}")
            # Extract just the codes part - typically letter+optional digit, comma or period separated
            # Look for codes on same line after "DL Codes"
            match = re.search(r'dl\s*codes?[:\s]*([A-Z0-9][A-Z0-9,.\s]*)', line, re.IGNORECASE)
            if match:
                codes_raw = match.group(1).strip()
                # Extract only valid DL code patterns (A, A1, B, B1, B2, BE, CE, D, etc.)
                valid_codes = re.findall(r'\b([A-D](?:[1-2E])?)\b', codes_raw, re.IGNORECASE)
                if valid_codes:
                    dl_codes = ','.join([c.upper() for c in valid_codes])
                    result['dlCodes'] = dl_codes
                    logger.debug(f"Found DL codes: {dl_codes}")
                    break
            
            # Or check next line
            if i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                valid_codes = re.findall(r'\b([A-D](?:[1-2E])?)\b', next_line, re.IGNORECASE)
                if valid_codes:
                    dl_codes = ','.join([c.upper() for c in valid_codes])
                    result['dlCodes'] = dl_codes
                    logger.debug(f"Found DL codes from next line: {dl_codes}")
                    break
    
    # If DL codes not found yet, try direct pattern matching
    if 'dlCodes' not in result:
        for line in lines:
            line_stripped = line.strip().upper()
            # Skip lines that have other field labels
            if any(kw in line.lower() for kw in ['name', 'address', 'birth', 'blood', 'eyes', 'signature', 'atty', 'condition']):
                continue
            
            # Try to parse merged codes like "BBAB2" or "BB1B2"
            # This handles OCR that merges "B,B1,B2" into one string
            if re.match(r'^[AB][AB12]+$', line_stripped) and len(line_stripped) >= 4:
                # Parse character by character
                codes = []
                i = 0
                while i < len(line_stripped):
                    char = line_stripped[i]
                    if char in 'ABCD':
                        # Check if next char is a digit (1 or 2)
                        if i + 1 < len(line_stripped) and line_stripped[i + 1] in '12':
                            codes.append(char + line_stripped[i + 1])
                            i += 2
                        else:
                            codes.append(char)
                            i += 1
                    else:
                        i += 1
                
                if len(codes) >= 2:
                    result['dlCodes'] = ','.join(codes)
                    logger.debug(f"Found DL codes from merged pattern: {result['dlCodes']}")
                    break
            
            # Also try standard pattern matching
            codes_pattern = r'\b([A-D](?:[1-2E])?)[,.\s]*([A-D](?:[1-2E])?)?[,.\s]*([A-D](?:[1-2E])?)?[,.\s]*([A-D](?:[1-2E])?)?\b'
            match = re.search(codes_pattern, line_stripped, re.IGNORECASE)
            if match:
                codes = [g.upper() for g in match.groups() if g]
                if len(codes) >= 2:
                    result['dlCodes'] = ','.join(codes)
                    logger.debug(f"Found DL codes from pattern: {result['dlCodes']}")
                    break
    
    # Extract Agency Code (typically 3 characters: letter + 2 digits, like "A12")
    for line in lines:
        line_lower = line.lower()
        if 'agency' in line_lower:
            logger.debug(f"Found agency line: {line}")
            match = re.search(r'agency\s*(?:code)?[:\s]*([A-Z]\d{2})', line, re.IGNORECASE)
            if match:
                result['agencyCode'] = match.group(1).upper()
                logger.debug(f"Found agency code: {result['agencyCode']}")
                break
    
    # If agency code not found, try to extract from license number (first 3 chars)
    if 'agencyCode' not in result:
        license_match = re.search(r'([A-Z]\d{2})[-\s]?\d{2}[-\s]?\d{4,6}', text, re.IGNORECASE)
        if license_match:
            result['agencyCode'] = license_match.group(1).upper()
            logger.debug(f"Agency code from license number: {result['agencyCode']}")
    
    # Extract Conditions
    for i, line in enumerate(lines):
        line_lower = line.lower()
        if 'condition' in line_lower:
            logger.debug(f"Found conditions line: {line}")
            # Extract condition value - typically "NONE" or numbers
            match = re.search(r'conditions?[:\s]*(none|\d[,\s\d]*)', line, re.IGNORECASE)
            if match:
                conditions = match.group(1).strip().upper()
                result['conditions'] = conditions
                logger.debug(f"Found conditions: {conditions}")
                break
            
            # Check next line for condition value
            if i + 1 < len(lines):
                next_line = lines[i + 1].strip().upper()
                if next_line in ['NONE', '1', '2', '1,2', '1, 2'] or re.match(r'^[\d,\s]+$', next_line):
                    result['conditions'] = next_line
                    logger.debug(f"Found conditions from next line: {next_line}")
                    break
    
    # Extract Eyes Color
    for line in lines:
        line_lower = line.lower()
        if 'eye' in line_lower:
            logger.debug(f"Found eyes line: {line}")
            match = re.search(r'eyes?\s*(?:color)?[:\s]*([A-Z]+)', line, re.IGNORECASE)
            if match:
                eyes_color = match.group(1).upper()
                valid_colors = ['BLACK', 'BROWN', 'BLUE', 'GREEN', 'HAZEL', 'GRAY', 'GREY']
                if eyes_color in valid_colors:
                    result['eyesColor'] = eyes_color
                    logger.debug(f"Found eyes color: {eyes_color}")
                    break
    
    # Extract Weight and Height if present
    weight_match = re.search(r'weight\s*(?:\(kg\))?[:\s]*(\d+(?:\.\d+)?)', text, re.IGNORECASE)
    if weight_match:
        result['weight'] = weight_match.group(1)
        logger.debug(f"Found weight: {result['weight']}")
    
    height_match = re.search(r'height\s*(?:\(m\))?[:\s]*(\d+(?:\.\d+)?)', text, re.IGNORECASE)
    if height_match:
        result['height'] = height_match.group(1)
        logger.debug(f"Found height: {result['height']}")
    
    return result


def extract_address(text: str, lines: List[str]) -> Optional[str]:
    """Extract full address string from OCR text (legacy, for backward compatibility)."""
    components = extract_address_components(text, lines)
    if components:
        # Combine components into a single string
        parts = []
        if components.get('streetAddress'):
            parts.append(components['streetAddress'])
        if components.get('barangay'):
            parts.append(components['barangay'])
        if components.get('city'):
            parts.append(components['city'])
        if components.get('province'):
            parts.append(components['province'])
        if components.get('postalCode'):
            parts.append(components['postalCode'])
        return ', '.join(parts) if parts else None
    return None


def extract_address_components(text: str, lines: List[str]) -> Dict[str, str]:
    """
    Extract structured address components from OCR text.
    
    Philippine Driver's License format:
    house_number, street (barangay), city, province, postal_code
    Example: 133, ROXAS BOULEVARD (POB), SAN CARLOS CITY, PANGASINAN, 2420
    
    Returns dict with:
    - streetAddress: House/Bldg No. & Street
    - barangay: Barangay
    - city: City/Municipality
    - province: Province
    - postalCode: Postal Code
    """
    result = {}
    street_hint = None

    def has_street_keyword(value: str) -> bool:
        if not value:
            return False
        street_keywords = [
            'BOULEVARD', 'BLVD', 'STREET', 'ST', 'AVENUE', 'AVE', 'ROAD', 'RD',
            'DRIVE', 'DR', 'LANE', 'LN', 'HIGHWAY', 'HWY', 'WAY', 'PKWY'
        ]
        value_upper = value.upper()
        return any(kw in value_upper for kw in street_keywords)
    
    # First, collect all address-related lines
    address_lines = []
    in_address_section = False
    
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        line_lower = line_stripped.lower()
        
        # Check for "Address" label
        if 'address' in line_lower:
            in_address_section = True
            # Check for content after "Address" label
            addr_on_line = re.sub(r'^.*address\s*', '', line_stripped, flags=re.IGNORECASE).strip()
            if addr_on_line and len(addr_on_line) > 3:
                address_lines.append(addr_on_line)
            continue
        
        # Collect lines after Address label
        if in_address_section:
            # Stop if we hit another labeled field
            stop_keywords = ['license', 'expir', 'blood', 'date', 'sex', 'nationality', 
                           'agency', 'eyes', 'dl code', 'condition', 'weight', 'height']
            if any(kw in line_lower for kw in stop_keywords):
                break
            if line_stripped and len(line_stripped) > 1:
                address_lines.append(line_stripped)
    
    logger.info(f"Address lines collected: {address_lines}")
    
    # Combine all address text - join with space, then normalize
    full_address = ' '.join(address_lines)
    # Fix common OCR split issues - rejoin split city names
    # "SAN" + "CARLOS CITY" -> "SAN CARLOS CITY"
    full_address = re.sub(r',\s*(\d+)\s*,', r', \1,', full_address)  # Fix ", 133 ," -> ", 133,"
    full_address = re.sub(r'\s+', ' ', full_address).strip()
    # Fix common OCR errors for city keywords
    full_address = re.sub(r'GITY', 'CITY', full_address, flags=re.IGNORECASE)
    full_address = re.sub(r'ClTY', 'CITY', full_address, flags=re.IGNORECASE)
    full_address = re.sub(r'C1TY', 'CITY', full_address, flags=re.IGNORECASE)
    
    if not full_address:
        return result
    
    logger.info(f"Full address text: {full_address}")
    
    # ============================================================
    # Parse Philippine address format:
    # house_number, -, barangay, city, province, postal_code
    # Example: 133, -, Roxas Boulevard, San Carlos City, Pangasinan, 2420
    # ============================================================
    
    # Step 1: Extract province (from known list) - do this first to anchor the end
    provinces = [
        'PANGASINAN', 'PAMPANGA', 'BULACAN', 'CAVITE', 'LAGUNA', 'BATANGAS', 'RIZAL',
        'NUEVA ECIJA', 'TARLAC', 'ZAMBALES', 'BATAAN', 'AURORA', 'QUEZON', 'CAMARINES',
        'ALBAY', 'SORSOGON', 'MASBATE', 'CATANDUANES', 'CEBU', 'BOHOL', 'LEYTE', 'SAMAR',
        'ILOILO', 'NEGROS', 'PALAWAN', 'DAVAO', 'MISAMIS', 'BUKIDNON', 'COTABATO',
        'METRO MANILA', 'NCR', 'MANILA', 'BENGUET', 'ILOCOS', 'LA UNION', 'ISABELA',
        'CAGAYAN', 'NUEVA VIZCAYA', 'IFUGAO', 'KALINGA', 'APAYAO', 'ABRA', 'MOUNTAIN'
    ]
    
    for prov in provinces:
        pattern = rf'\b{prov}\b'
        if re.search(pattern, full_address, re.IGNORECASE):
            result['province'] = prov.title()
            full_address = re.sub(rf',?\s*{prov}\s*,?', ' ', full_address, flags=re.IGNORECASE).strip()
            break
    
    # Step 3: Extract city/municipality
    # Look for pattern like "SAN CARLOS CITY" or "CITY OF MANILA"
    # Handle OCR split: "SAN" + "CARLOS CITY" should become "SAN CARLOS CITY"
    city_patterns = [
        r'((?:SAN|SANTA|SANTO|CITY OF|MUNICIPALITY OF)?\s*[A-Z]+\s+CITY)',  # SAN CARLOS CITY
        r'(CITY\s+OF\s+[A-Z]+)',  # CITY OF MANILA
        r'([A-Z]+\s+CITY)',  # MAKATI CITY
        r'([A-Z]+\s+MUNICIPALITY)',  # Some municipality
    ]
    
    for pattern in city_patterns:
        city_match = re.search(pattern, full_address, re.IGNORECASE)
        if city_match:
            city_name = city_match.group(1).strip()
            result['city'] = city_name.title()
            full_address = full_address.replace(city_match.group(0), '').strip()
            break

    # If city was found but a prefix (e.g., SAN) is left behind, attach it
    if 'city' in result:
        city_upper = result['city'].upper()
        prefixes = ['SAN', 'SANTA', 'SANTO', 'GENERAL', 'LAS', 'LOS']
        tokens = re.findall(r'\b[A-Z]+\b', full_address.upper())
        for prefix in prefixes:
            if prefix in tokens and not city_upper.startswith(prefix + ' ') and city_upper.endswith(' CITY'):
                result['city'] = f"{prefix} {city_upper}".title()
                full_address = re.sub(rf'\b{prefix}\b', '', full_address, flags=re.IGNORECASE).strip()
                break
    
    # If city still not found, look for split city name
    # e.g., "BOULEVARD (POB ), SAN 133, CARLOS CITY" -> extract "SAN" + "CARLOS CITY"
    if 'city' not in result:
        # Look for partial city pattern and try to find the prefix
        partial_city = re.search(r'\b([A-Z]+)\s+CITY\b', full_address, re.IGNORECASE)
        if partial_city:
            city_suffix = partial_city.group(1)  # e.g., "CARLOS"
            # Look for common city prefixes nearby
            prefixes = ['SAN', 'SANTA', 'SANTO', 'GENERAL', 'LAS', 'LOS']
            for prefix in prefixes:
                if prefix in full_address.upper():
                    full_city = f"{prefix} {city_suffix} CITY"
                    result['city'] = full_city.title()
                    # Remove both parts
                    full_address = re.sub(rf'\b{prefix}\b', '', full_address, flags=re.IGNORECASE)
                    full_address = re.sub(rf'\b{city_suffix}\s+CITY\b', '', full_address, flags=re.IGNORECASE)
                    break
    
    # Step 4: Extract house number and barangay using Philippine format
    # Format: house_number, -, barangay, city
    # Example: "133, -, Roxas Boulevard, San Carlos City"
    # House numbers are typically 1-3 digits (not 4, which would be postal code)
    
    house_number = None
    
    # First try to find the pattern: number, -, barangay
    # Match: 1-3 digit number (house number), comma, dash, optional comma, barangay name
    house_barangay_pattern = r'\b(\d{1,3}[A-Z]?)\s*,\s*-\s*,?\s*([^,]+?)(?:,|$)'
    house_barangay_match = re.search(house_barangay_pattern, full_address, re.IGNORECASE)
    
    if house_barangay_match:
        house_number = house_barangay_match.group(1)
        barangay_name = house_barangay_match.group(2).strip()
        
        # Clean up barangay name
        barangay_name = re.sub(r'[()]', '', barangay_name).strip()
        if barangay_name:
            result['barangay'] = barangay_name.title()
            # Remove this pattern from address
            full_address = full_address.replace(house_barangay_match.group(0), '').strip()
            logger.info(f"Found house number and barangay: {house_number}, {barangay_name}")
    
    # If not found, try alternative patterns
    if not house_number:
        # Try (POB) or (POBLACION) pattern
        pob_match = re.search(r'\(?\s*(POB|POBLACION)\.?\s*\)?', full_address, re.IGNORECASE)
        if pob_match:
            result['barangay'] = 'Poblacion'
            full_address = re.sub(r'\(?\s*(POB|POBLACION)\.?\s*\)?', '', full_address, flags=re.IGNORECASE)
        else:
            # Look for BRGY or BARANGAY label
            brgy_match = re.search(r'(?:BARANGAY|BRGY\.?)\s+([A-Z0-9\s\-]+?)(?:,|;|$|\))', full_address, re.IGNORECASE)
            if brgy_match:
                result['barangay'] = brgy_match.group(1).strip().title()
                full_address = full_address.replace(brgy_match.group(0), '').strip()
        
        # Extract house number separately if not already found (1-3 digits only, at start or before comma)
        # Avoid matching 4-digit postal codes
        house_match = re.search(r'^\s*(\d{1,3}[A-Z]?)\s*,', full_address) or re.search(r'\b(\d{1,3}[A-Z]?)\s*,', full_address)
        if house_match:
            house_number = house_match.group(1)
            full_address = re.sub(rf'\b{re.escape(house_number)}\s*,', '', full_address, count=1).strip()
    
    # Step 5: Extract postal code (exactly 4 digits, MUST be at the end)
    # Only match 4-digit numbers that are clearly at the end (after comma or at end of string)
    # This ensures we don't grab house numbers or other numbers
    postal_match = re.search(r',\s*(\d{4})\s*$', full_address) or re.search(r'\s+(\d{4})\s*$', full_address)
    if postal_match:
        postal_code = postal_match.group(1)
        # Double-check it's not part of a larger number (like 1331)
        if len(postal_code) == 4 and postal_code.isdigit():
            result['postalCode'] = postal_code
            full_address = full_address.replace(postal_match.group(0), '').strip().rstrip(',;')
            logger.info(f"Found postal code: {result['postalCode']}")
    
    # Step 6: Construct street address (just house number in Philippine format)
    if house_number:
        result['streetAddress'] = house_number
    
    logger.info(f"Extracted address components: {result}")
    return result


def extract_structured_data(
    text: str, 
    id_type: str,
    ocr_mapping: Optional[Dict[str, List[str]]] = None
) -> Dict[str, Any]:
    """
    Parse structured data from OCR text based on ID type.
    
    Args:
        text: Raw OCR text
        id_type: Type of ID (e.g., 'philsys_id', 'drivers_license')
        ocr_mapping: Optional mapping of field names to keywords
        
    Returns:
        Dictionary of extracted fields
    """
    result = {
        'rawText': text,
        'extractedFields': {},
        'confidence': 0.0,
    }
    
    if not text:
        return result
    
    extracted = {}
    text_lower = text.lower()
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    logger.info(f"Parsing {len(lines)} lines for ID type: {id_type}")
    
    # Try to extract ID number
    id_number = parse_id_number(text, id_type)
    if id_number:
        # Updated field mapping to match new config field names
        field_map = {
            'philsys_id': 'pcn',  # Changed from 'psn' to 'pcn'
            'drivers_license': 'licenseNumber',
            'sss_id': 'sssNumber',
            'umid': 'crnNumber',
            'passport': 'passportNumber',
            'prc_id': 'registrationNumber',  # Changed from 'prcNumber'
            'voters_id': 'vinNumber',
            'postal_id': 'postalIdNumber',
            'tin_id': 'tinNumber',
        }
        field_name = field_map.get(id_type, 'idNumber')
        extracted[field_name] = id_number
        logger.info(f"Extracted {field_name}: {id_number}")
    
    # Try to extract name as separate fields (lastName, firstName, middleName)
    name_fields = extract_name_fields(text, id_type)
    if name_fields:
        # Map to appropriate field names based on ID type
        if id_type == 'passport':
            # Passport uses surname and givenNames
            if 'lastName' in name_fields:
                extracted['surname'] = name_fields['lastName']
            given_parts = []
            if 'firstName' in name_fields:
                given_parts.append(name_fields['firstName'])
            if 'middleName' in name_fields:
                given_parts.append(name_fields['middleName'])
            if given_parts:
                extracted['givenNames'] = ' '.join(given_parts)
        elif id_type == 'philsys_id':
            # PhilSys uses givenName instead of firstName
            if 'lastName' in name_fields:
                extracted['lastName'] = name_fields['lastName']
            if 'firstName' in name_fields:
                extracted['givenName'] = name_fields['firstName']
            if 'middleName' in name_fields:
                extracted['middleName'] = name_fields['middleName']
        else:
            # All other IDs use lastName, firstName, middleName
            extracted.update(name_fields)
        
        logger.info(f"Extracted name fields: {name_fields}")
    
    # Try to extract address components
    address_components = extract_address_components(text, lines)
    if address_components:
        # Add individual address fields
        if 'streetAddress' in address_components:
            extracted['streetAddress'] = address_components['streetAddress']
        if 'barangay' in address_components:
            extracted['barangay'] = address_components['barangay']
        if 'city' in address_components:
            extracted['city'] = address_components['city']
        if 'province' in address_components:
            extracted['province'] = address_components['province']
        if 'postalCode' in address_components:
            extracted['postalCode'] = address_components['postalCode']
        logger.info(f"Extracted address components: {address_components}")
    
    # Try to extract dates - look at all lines with date patterns
    dates_found = []
    for line in lines:
        date = parse_date(line)
        if date:
            dates_found.append((line.lower(), date))
    
    # Also look for dates in format YYYY/MM/DD anywhere in text
    all_dates = re.findall(r'(\d{4}[/-]\d{2}[/-]\d{2})', text)
    for date in all_dates:
        # Try to find context for this date
        idx = text.find(date)
        context = text[max(0, idx-50):idx+len(date)+50].lower()
        if (context, date) not in dates_found:
            dates_found.append((context, date))
    
    # Assign dates based on context
    for context, date in dates_found:
        logger.debug(f"Found date '{date}' in context: '{context[:50]}...'")
        if any(kw in context for kw in ['birth', 'dob', 'born', 'date of birth']):
            extracted['dateOfBirth'] = date
        elif any(kw in context for kw in ['expir', 'valid until', 'exp', 'expiration']):
            extracted['expiryDate'] = date
        elif any(kw in context for kw in ['issue', 'issued', 'date of issue', 'registration']):
            extracted['dateOfIssue'] = date
            # Also set registrationDate for PRC ID
            if id_type == 'prc_id':
                extracted['registrationDate'] = date
    
    # For driver's license, try to assign dates by position if not already assigned
    if id_type == 'drivers_license' and len(dates_found) >= 2:
        sorted_dates = sorted(set(d[1] for d in dates_found))
        if 'dateOfBirth' not in extracted and len(sorted_dates) >= 1:
            # First (oldest) date is usually DOB
            extracted['dateOfBirth'] = sorted_dates[0]
        if 'expiryDate' not in extracted and len(sorted_dates) >= 2:
            # Last (newest) date is usually expiry
            extracted['expiryDate'] = sorted_dates[-1]
    
    # Extract sex/gender if present
    sex_match = re.search(r'(?:sex|gender)[:\s]*([MF]|male|female)', text, re.IGNORECASE)
    if sex_match:
        sex_value = sex_match.group(1).upper()
        if sex_value in ['MALE', 'M']:
            extracted['sex'] = 'M' if id_type in ['drivers_license', 'passport'] else 'Male'
        elif sex_value in ['FEMALE', 'F']:
            extracted['sex'] = 'F' if id_type in ['drivers_license', 'passport'] else 'Female'
    
    # Extract nationality if present
    nationality_value = None
    for i, line in enumerate(lines):
        line_lower = line.lower()
        if 'nationality' in line_lower:
            # Try same line first
            same_line = re.sub(r'.*nationality[:\s]*', '', line, flags=re.IGNORECASE).strip()
            if same_line:
                nationality_value = same_line
                break
            # Fallback to next line if empty
            if i + 1 < len(lines):
                nationality_value = lines[i + 1].strip()
                break

    if nationality_value:
        nationality_clean = re.sub(r'[^A-Za-z\s/]', '', nationality_value).strip().upper()
        invalid_values = {'SEX', 'GENDER', 'MALE', 'FEMALE', 'M', 'F'}
        valid_values = {'PH', 'PHL', 'PHILIPPINE', 'PHILIPPINES', 'FILIPINO', 'FILIPINA'}
        if nationality_clean in valid_values:
            extracted['nationality'] = nationality_clean
        elif nationality_clean not in invalid_values and len(nationality_clean) >= 3:
            extracted['nationality'] = nationality_clean
    
    # Extract blood type if present (be specific to avoid matching DL codes)
    # Blood type is A, B, AB, O with optional +/-
    blood_patterns = [
        r'blood\s*type[:\s]*([ABO]{1,2}[+-]?)\b',  # "Blood Type: O+" 
        r'blood\s*type[:\s]*([ABO]{1,2})\s*[+-]?\b',  # "Blood Type: O +"
    ]
    for bp in blood_patterns:
        blood_match = re.search(bp, text, re.IGNORECASE)
        if blood_match:
            blood_type = blood_match.group(1).upper()
            # Make sure it's a valid blood type (not DL code like B1, B2)
            if blood_type in ['A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']:
                extracted['bloodType'] = blood_type
                logger.debug(f"Found blood type: {blood_type}")
                break
    
    # Driver's License specific fields
    if id_type == 'drivers_license':
        extracted.update(extract_drivers_license_fields(text, lines))
    
    # If we have ocr_mapping, try to extract more fields
    if ocr_mapping:
        for field_name, keywords in ocr_mapping.items():
            if field_name in extracted:
                continue
            
            for line in lines:
                line_lower = line.lower()
                for keyword in keywords:
                    if keyword.lower() in line_lower:
                        # Extract value after the keyword
                        pattern = rf'{re.escape(keyword)}[:\s]+(.+)'
                        match = re.search(pattern, line, re.IGNORECASE)
                        if match:
                            value = match.group(1).strip()
                            if value:
                                extracted[field_name] = value
                                logger.info(f"Extracted {field_name}: {value} (via mapping)")
                                break
                if field_name in extracted:
                    break
    
    result['extractedFields'] = extracted
    
    # Calculate confidence based on how many fields we extracted
    expected_fields = 4  # Minimum expected: ID number, lastName, firstName, one date
    result['confidence'] = min(1.0, len(extracted) / expected_fields)
    
    logger.info(f"Extracted {len(extracted)} fields with confidence {result['confidence']:.2f}")
    
    return result


def extract_from_id_image(
    image: Image.Image,
    id_type: str = 'unknown',
    ocr_mapping: Optional[Dict[str, List[str]]] = None
) -> Dict[str, Any]:
    """
    Full pipeline: Extract and parse data from an ID image.
    
    Args:
        image: PIL Image of ID document
        id_type: Type of ID for parsing hints
        ocr_mapping: Optional field-to-keyword mapping
        
    Returns:
        Dictionary with rawText, extractedFields, and confidence
    """
    # Extract raw text
    raw_text = extract_text(image)
    
    # Parse structured data
    result = extract_structured_data(raw_text, id_type, ocr_mapping)
    
    return result
