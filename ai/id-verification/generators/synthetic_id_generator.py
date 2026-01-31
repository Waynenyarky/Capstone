#!/usr/bin/env python3
"""
Synthetic ID Generator

Generates synthetic ID-like images for training the ID verification model.
These are NOT real IDs - they are synthetic training data that mimics the
visual layout and appearance of legitimate ID documents.

NO GOVERNMENT DATABASE IS USED - this generates purely synthetic images
for machine learning training purposes.
"""

import os
import argparse
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np

# ID type templates with different layouts
ID_TEMPLATES = {
    'drivers_license': {
        'size': (856, 540),  # Standard card size in pixels (3.375" x 2.125" at 254 dpi)
        'bg_colors': [(230, 240, 250), (240, 245, 235), (255, 252, 245)],
        'photo_area': (30, 80, 170, 260),  # left, top, right, bottom
        'text_areas': [
            {'pos': (200, 80), 'label': 'NAME', 'font_size': 14},
            {'pos': (200, 130), 'label': 'ADDRESS', 'font_size': 12},
            {'pos': (200, 180), 'label': 'LICENSE NO.', 'font_size': 12},
            {'pos': (200, 220), 'label': 'BIRTH DATE', 'font_size': 12},
            {'pos': (200, 260), 'label': 'EXPIRY', 'font_size': 12},
        ],
        'header': 'REPUBLIC OF THE PHILIPPINES\nLAND TRANSPORTATION OFFICE\nDRIVER\'S LICENSE',
        'has_barcode': True,
        'barcode_area': (600, 350, 820, 500),
    },
    'passport': {
        'size': (700, 500),  # Passport data page proportions
        'bg_colors': [(245, 245, 250), (250, 248, 245), (240, 245, 250)],
        'photo_area': (40, 100, 220, 340),
        'text_areas': [
            {'pos': (250, 100), 'label': 'SURNAME', 'font_size': 14},
            {'pos': (250, 150), 'label': 'GIVEN NAMES', 'font_size': 14},
            {'pos': (250, 200), 'label': 'NATIONALITY', 'font_size': 12},
            {'pos': (250, 240), 'label': 'DATE OF BIRTH', 'font_size': 12},
            {'pos': (250, 280), 'label': 'PASSPORT NO.', 'font_size': 12},
            {'pos': (250, 320), 'label': 'DATE OF EXPIRY', 'font_size': 12},
        ],
        'header': 'REPUBLIC OF THE PHILIPPINES\nPASSPORT',
        'has_barcode': False,
        'mrz_area': (40, 420, 660, 480),  # Machine Readable Zone
    },
    'sss_id': {
        'size': (856, 540),
        'bg_colors': [(220, 235, 250), (230, 230, 245), (240, 235, 230)],
        'photo_area': (30, 100, 170, 280),
        'text_areas': [
            {'pos': (200, 100), 'label': 'SSS NUMBER', 'font_size': 14},
            {'pos': (200, 150), 'label': 'NAME', 'font_size': 14},
            {'pos': (200, 200), 'label': 'DATE OF BIRTH', 'font_size': 12},
            {'pos': (200, 240), 'label': 'DATE ISSUED', 'font_size': 12},
        ],
        'header': 'REPUBLIC OF THE PHILIPPINES\nSOCIAL SECURITY SYSTEM\nSSS ID',
        'has_barcode': True,
        'barcode_area': (600, 380, 820, 500),
    },
    'philhealth_id': {
        'size': (856, 540),
        'bg_colors': [(230, 250, 230), (235, 245, 235), (240, 250, 240)],
        'photo_area': (30, 100, 170, 280),
        'text_areas': [
            {'pos': (200, 100), 'label': 'PIN', 'font_size': 14},
            {'pos': (200, 150), 'label': 'NAME', 'font_size': 14},
            {'pos': (200, 200), 'label': 'DATE OF BIRTH', 'font_size': 12},
            {'pos': (200, 240), 'label': 'MEMBERSHIP TYPE', 'font_size': 12},
        ],
        'header': 'REPUBLIC OF THE PHILIPPINES\nPHILIPPINE HEALTH INSURANCE CORPORATION\nPHILHEALTH ID',
        'has_barcode': True,
        'barcode_area': (600, 380, 820, 500),
    },
    'national_id': {
        'size': (856, 540),
        'bg_colors': [(245, 245, 250), (250, 250, 255), (248, 250, 252)],
        'photo_area': (50, 120, 200, 320),
        'text_areas': [
            {'pos': (230, 120), 'label': 'PSN', 'font_size': 14},
            {'pos': (230, 170), 'label': 'SURNAME', 'font_size': 14},
            {'pos': (230, 210), 'label': 'GIVEN NAME', 'font_size': 14},
            {'pos': (230, 250), 'label': 'MIDDLE NAME', 'font_size': 12},
            {'pos': (230, 290), 'label': 'DATE OF BIRTH', 'font_size': 12},
            {'pos': (230, 330), 'label': 'SEX', 'font_size': 12},
        ],
        'header': 'REPUBLIC OF THE PHILIPPINES\nPHILIPPINE IDENTIFICATION SYSTEM\nPhilSys ID',
        'has_barcode': True,
        'barcode_area': (600, 350, 820, 500),
    },
    'voters_id': {
        'size': (856, 540),
        'bg_colors': [(250, 245, 230), (255, 250, 240), (248, 245, 235)],
        'photo_area': (30, 100, 170, 280),
        'text_areas': [
            {'pos': (200, 100), 'label': 'VIN', 'font_size': 14},
            {'pos': (200, 150), 'label': 'NAME', 'font_size': 14},
            {'pos': (200, 200), 'label': 'PRECINCT NO.', 'font_size': 12},
            {'pos': (200, 240), 'label': 'ADDRESS', 'font_size': 12},
        ],
        'header': 'REPUBLIC OF THE PHILIPPINES\nCOMMISSION ON ELECTIONS\nVOTER\'S ID',
        'has_barcode': True,
        'barcode_area': (600, 380, 820, 500),
    },
    'prc_id': {
        'size': (856, 540),
        'bg_colors': [(235, 235, 250), (240, 240, 255), (238, 238, 248)],
        'photo_area': (30, 100, 170, 280),
        'text_areas': [
            {'pos': (200, 100), 'label': 'LICENSE NO.', 'font_size': 14},
            {'pos': (200, 150), 'label': 'NAME', 'font_size': 14},
            {'pos': (200, 200), 'label': 'PROFESSION', 'font_size': 12},
            {'pos': (200, 240), 'label': 'VALID UNTIL', 'font_size': 12},
        ],
        'header': 'REPUBLIC OF THE PHILIPPINES\nPROFESSIONAL REGULATION COMMISSION\nPRC ID',
        'has_barcode': True,
        'barcode_area': (600, 380, 820, 500),
    },
    'postal_id': {
        'size': (856, 540),
        'bg_colors': [(245, 240, 230), (250, 245, 235), (248, 242, 230)],
        'photo_area': (30, 100, 170, 280),
        'text_areas': [
            {'pos': (200, 100), 'label': 'POSTAL ID NO.', 'font_size': 14},
            {'pos': (200, 150), 'label': 'NAME', 'font_size': 14},
            {'pos': (200, 200), 'label': 'ADDRESS', 'font_size': 12},
            {'pos': (200, 260), 'label': 'DATE OF BIRTH', 'font_size': 12},
        ],
        'header': 'REPUBLIC OF THE PHILIPPINES\nPHILIPPINE POSTAL CORPORATION\nPOSTAL ID',
        'has_barcode': True,
        'barcode_area': (600, 380, 820, 500),
    },
    'umid': {
        'size': (856, 540),
        'bg_colors': [(230, 245, 250), (235, 248, 252), (228, 242, 248)],
        'photo_area': (50, 100, 200, 300),
        'text_areas': [
            {'pos': (230, 100), 'label': 'CRN', 'font_size': 14},
            {'pos': (230, 150), 'label': 'NAME', 'font_size': 14},
            {'pos': (230, 200), 'label': 'DATE OF BIRTH', 'font_size': 12},
            {'pos': (230, 240), 'label': 'SEX', 'font_size': 12},
        ],
        'header': 'REPUBLIC OF THE PHILIPPINES\nUNIFIED MULTI-PURPOSE ID\nUMID',
        'has_barcode': True,
        'barcode_area': (600, 350, 820, 500),
    },
    'tin_id': {
        'size': (856, 540),
        'bg_colors': [(250, 245, 240), (252, 248, 242), (248, 244, 238)],
        'photo_area': (30, 100, 170, 280),
        'text_areas': [
            {'pos': (200, 100), 'label': 'TIN', 'font_size': 14},
            {'pos': (200, 150), 'label': 'NAME', 'font_size': 14},
            {'pos': (200, 200), 'label': 'ADDRESS', 'font_size': 12},
            {'pos': (200, 260), 'label': 'DATE OF BIRTH', 'font_size': 12},
        ],
        'header': 'REPUBLIC OF THE PHILIPPINES\nBUREAU OF INTERNAL REVENUE\nTIN ID CARD',
        'has_barcode': True,
        'barcode_area': (600, 380, 820, 500),
    },
    'senior_citizen_id': {
        'size': (856, 540),
        'bg_colors': [(240, 235, 250), (245, 240, 252), (238, 235, 248)],
        'photo_area': (30, 100, 170, 280),
        'text_areas': [
            {'pos': (200, 100), 'label': 'OSCA ID NO.', 'font_size': 14},
            {'pos': (200, 150), 'label': 'NAME', 'font_size': 14},
            {'pos': (200, 200), 'label': 'DATE OF BIRTH', 'font_size': 12},
            {'pos': (200, 240), 'label': 'ADDRESS', 'font_size': 12},
        ],
        'header': 'REPUBLIC OF THE PHILIPPINES\nOFFICE FOR SENIOR CITIZENS AFFAIRS\nSENIOR CITIZEN ID',
        'has_barcode': False,
    },
    'pwd_id': {
        'size': (856, 540),
        'bg_colors': [(235, 250, 235), (240, 252, 240), (238, 248, 238)],
        'photo_area': (30, 100, 170, 280),
        'text_areas': [
            {'pos': (200, 100), 'label': 'PWD ID NO.', 'font_size': 14},
            {'pos': (200, 150), 'label': 'NAME', 'font_size': 14},
            {'pos': (200, 200), 'label': 'TYPE OF DISABILITY', 'font_size': 12},
            {'pos': (200, 260), 'label': 'DATE OF BIRTH', 'font_size': 12},
        ],
        'header': 'REPUBLIC OF THE PHILIPPINES\nNATIONAL COUNCIL ON DISABILITY AFFAIRS\nPWD ID',
        'has_barcode': False,
    },
    'company_id': {
        'size': (540, 856),  # Portrait orientation
        'bg_colors': [(250, 250, 250), (245, 248, 252), (252, 250, 248)],
        'photo_area': (170, 200, 370, 450),
        'text_areas': [
            {'pos': (270, 480), 'label': 'EMPLOYEE ID', 'font_size': 14},
            {'pos': (270, 530), 'label': 'NAME', 'font_size': 14},
            {'pos': (270, 580), 'label': 'DEPARTMENT', 'font_size': 12},
            {'pos': (270, 620), 'label': 'POSITION', 'font_size': 12},
        ],
        'header': 'COMPANY NAME\nEMPLOYEE IDENTIFICATION CARD',
        'has_barcode': True,
        'barcode_area': (170, 700, 370, 800),
    },
    'school_id': {
        'size': (540, 856),  # Portrait orientation
        'bg_colors': [(245, 250, 255), (250, 248, 245), (248, 252, 248)],
        'photo_area': (170, 180, 370, 430),
        'text_areas': [
            {'pos': (270, 460), 'label': 'STUDENT ID', 'font_size': 14},
            {'pos': (270, 510), 'label': 'NAME', 'font_size': 14},
            {'pos': (270, 560), 'label': 'COURSE/GRADE', 'font_size': 12},
            {'pos': (270, 600), 'label': 'SCHOOL YEAR', 'font_size': 12},
        ],
        'header': 'SCHOOL NAME\nSTUDENT IDENTIFICATION CARD',
        'has_barcode': True,
        'barcode_area': (170, 680, 370, 780),
    },
    'barangay_id': {
        'size': (856, 540),
        'bg_colors': [(250, 248, 240), (252, 250, 245), (248, 246, 238)],
        'photo_area': (30, 100, 170, 280),
        'text_areas': [
            {'pos': (200, 100), 'label': 'BARANGAY ID NO.', 'font_size': 14},
            {'pos': (200, 150), 'label': 'NAME', 'font_size': 14},
            {'pos': (200, 200), 'label': 'ADDRESS', 'font_size': 12},
            {'pos': (200, 260), 'label': 'DATE OF BIRTH', 'font_size': 12},
        ],
        'header': 'REPUBLIC OF THE PHILIPPINES\nBARANGAY CERTIFICATION\nBRGY. ID',
        'has_barcode': False,
    },
}

# Sample names for synthetic IDs
FIRST_NAMES = [
    'Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Carlos', 'Elena',
    'Miguel', 'Carmen', 'Antonio', 'Teresa', 'Ricardo', 'Sofia', 'Fernando',
    'Isabella', 'Rafael', 'Lucia', 'Manuel', 'Patricia', 'Diego', 'Gloria',
    'Gabriel', 'Cristina', 'Alejandro', 'Monica', 'Daniel', 'Victoria',
]

LAST_NAMES = [
    'Santos', 'Reyes', 'Cruz', 'Garcia', 'Torres', 'Flores', 'Rivera',
    'Gonzales', 'Bautista', 'Villanueva', 'Mendoza', 'Ramos', 'Aquino',
    'Dela Cruz', 'Castillo', 'Fernandez', 'Lopez', 'Diaz', 'Martinez',
    'Perez', 'Rodriguez', 'Hernandez', 'Morales', 'Sanchez', 'Romero',
]


def generate_random_name():
    """Generate a random Filipino name."""
    first = random.choice(FIRST_NAMES)
    middle = random.choice(LAST_NAMES)[0] + '.'
    last = random.choice(LAST_NAMES)
    return f"{first} {middle} {last}"


def generate_random_id_number(template_type):
    """Generate a random ID number based on template type."""
    if template_type == 'drivers_license':
        return f"N{random.randint(10, 99)}-{random.randint(10, 99)}-{random.randint(100000, 999999)}"
    elif template_type == 'passport':
        return f"P{random.randint(1000000, 9999999)}A"
    elif template_type == 'sss_id':
        return f"{random.randint(10, 99)}-{random.randint(1000000, 9999999)}-{random.randint(1, 9)}"
    elif template_type == 'philhealth_id':
        return f"{random.randint(10, 99)}-{random.randint(100000000, 999999999)}-{random.randint(1, 9)}"
    elif template_type == 'national_id':
        return f"PSN-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}-{random.randint(1, 9)}"
    elif template_type == 'voters_id':
        return f"VIN-{random.randint(1000, 9999)}{random.randint(1000, 9999)}{random.randint(1000, 9999)}"
    elif template_type == 'prc_id':
        return f"{random.randint(100000, 999999)}"
    elif template_type == 'umid':
        return f"CRN-{random.randint(1000, 9999)}-{random.randint(100000, 999999)}-{random.randint(1, 9)}"
    elif template_type == 'tin_id':
        return f"{random.randint(100, 999)}-{random.randint(100, 999)}-{random.randint(100, 999)}-{random.randint(100, 999)}"
    else:
        return f"ID-{random.randint(100000, 999999)}"


def generate_random_date(start_year=1960, end_year=2000):
    """Generate a random date string."""
    year = random.randint(start_year, end_year)
    month = random.randint(1, 12)
    day = random.randint(1, 28)
    return f"{month:02d}/{day:02d}/{year}"


def generate_expiry_date():
    """Generate a future expiry date."""
    year = random.randint(2025, 2032)
    month = random.randint(1, 12)
    day = random.randint(1, 28)
    return f"{month:02d}/{day:02d}/{year}"


def draw_photo_placeholder(draw, area, variation=0):
    """Draw a placeholder for the photo area."""
    left, top, right, bottom = area
    
    # Background color for photo area
    bg_colors = [(200, 200, 200), (190, 195, 200), (195, 190, 195)]
    bg_color = bg_colors[variation % len(bg_colors)]
    
    # Draw photo area background
    draw.rectangle([left, top, right, bottom], fill=bg_color, outline=(150, 150, 150), width=1)
    
    # Draw simple head silhouette
    center_x = (left + right) // 2
    center_y = (top + bottom) // 2 - 10
    head_radius = (right - left) // 4
    
    # Head (circle)
    draw.ellipse([
        center_x - head_radius,
        center_y - head_radius,
        center_x + head_radius,
        center_y + head_radius
    ], fill=(170, 170, 170), outline=(140, 140, 140))
    
    # Body (shoulders)
    shoulder_width = (right - left) * 0.7
    draw.ellipse([
        center_x - shoulder_width // 2,
        center_y + head_radius,
        center_x + shoulder_width // 2,
        center_y + head_radius * 3
    ], fill=(170, 170, 170), outline=(140, 140, 140))


def draw_barcode_placeholder(draw, area):
    """Draw a placeholder barcode."""
    left, top, right, bottom = area
    
    # Draw barcode lines
    num_bars = random.randint(30, 50)
    bar_width = (right - left) / num_bars
    
    for i in range(num_bars):
        if random.random() > 0.3:  # 70% chance of drawing a bar
            x = left + i * bar_width
            height_factor = random.uniform(0.5, 1.0)
            bar_height = (bottom - top) * height_factor * 0.8
            draw.rectangle([x, top, x + bar_width * 0.7, top + bar_height], fill=(30, 30, 30))


def draw_mrz_placeholder(draw, area, font):
    """Draw a placeholder Machine Readable Zone (for passports)."""
    left, top, right, bottom = area
    
    # MRZ uses special characters
    chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<'
    line_height = (bottom - top) // 2
    
    for line in range(2):
        mrz_line = ''.join(random.choice(chars) for _ in range(44))
        y = top + line * line_height
        try:
            draw.text((left, y), mrz_line, fill=(30, 30, 30), font=font)
        except:
            draw.text((left, y), mrz_line, fill=(30, 30, 30))


def apply_augmentation(img):
    """Apply random augmentation to the image."""
    img_array = np.array(img)
    
    # Random rotation (-5 to 5 degrees)
    if random.random() > 0.5:
        angle = random.uniform(-5, 5)
        img = img.rotate(angle, fillcolor=(255, 255, 255), expand=False)
    
    # Random brightness adjustment
    if random.random() > 0.5:
        factor = random.uniform(0.85, 1.15)
        img_array = np.array(img)
        img_array = np.clip(img_array * factor, 0, 255).astype(np.uint8)
        img = Image.fromarray(img_array)
    
    # Add slight noise
    if random.random() > 0.6:
        img_array = np.array(img)
        noise = np.random.normal(0, 3, img_array.shape).astype(np.int16)
        img_array = np.clip(img_array.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        img = Image.fromarray(img_array)
    
    # Random blur (slight)
    if random.random() > 0.7:
        from PIL import ImageFilter
        img = img.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.5, 1.0)))
    
    return img


def generate_synthetic_id(template_type, output_path, augment=True):
    """Generate a single synthetic ID image."""
    if template_type not in ID_TEMPLATES:
        template_type = random.choice(list(ID_TEMPLATES.keys()))
    
    template = ID_TEMPLATES[template_type]
    
    # Create image
    width, height = template['size']
    bg_color = random.choice(template['bg_colors'])
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Draw border
    draw.rectangle([2, 2, width - 3, height - 3], outline=(100, 100, 100), width=2)
    
    # Try to use a system font, fall back to default if not available
    try:
        header_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 16)
        label_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 12)
        value_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 14)
        mrz_font = ImageFont.truetype("/System/Library/Fonts/Courier.dfont", 10)
    except:
        try:
            header_font = ImageFont.truetype("arial.ttf", 16)
            label_font = ImageFont.truetype("arial.ttf", 12)
            value_font = ImageFont.truetype("arial.ttf", 14)
            mrz_font = ImageFont.truetype("cour.ttf", 10)
        except:
            header_font = ImageFont.load_default()
            label_font = header_font
            value_font = header_font
            mrz_font = header_font
    
    # Draw header
    header_text = template['header']
    header_y = 15
    for line in header_text.split('\n'):
        # Center the text
        try:
            bbox = draw.textbbox((0, 0), line, font=header_font)
            text_width = bbox[2] - bbox[0]
        except:
            text_width = len(line) * 8
        x = (width - text_width) // 2
        draw.text((x, header_y), line, fill=(20, 40, 80), font=header_font)
        header_y += 20
    
    # Draw photo placeholder
    variation = random.randint(0, 2)
    draw_photo_placeholder(draw, template['photo_area'], variation)
    
    # Generate random data
    name = generate_random_name()
    id_number = generate_random_id_number(template_type)
    birth_date = generate_random_date()
    expiry_date = generate_expiry_date()
    
    # Draw text fields
    for field in template['text_areas']:
        x, y = field['pos']
        label = field['label']
        
        # Draw label
        draw.text((x, y), label + ':', fill=(80, 80, 80), font=label_font)
        
        # Draw value
        if 'NAME' in label:
            value = name
        elif 'NO' in label or 'NUMBER' in label or 'PIN' in label or 'CRN' in label or 'TIN' in label or 'VIN' in label or 'PSN' in label:
            value = id_number
        elif 'BIRTH' in label:
            value = birth_date
        elif 'EXPIRY' in label or 'VALID' in label:
            value = expiry_date
        elif 'ADDRESS' in label:
            value = f"{random.randint(1, 999)} Sample St., City"
        elif 'NATIONALITY' in label:
            value = 'FILIPINO'
        elif 'SEX' in label:
            value = random.choice(['M', 'F'])
        elif 'PROFESSION' in label:
            value = random.choice(['ENGINEER', 'ACCOUNTANT', 'TEACHER', 'NURSE', 'DOCTOR'])
        elif 'DEPARTMENT' in label:
            value = random.choice(['ENGINEERING', 'ACCOUNTING', 'HR', 'OPERATIONS', 'IT'])
        elif 'POSITION' in label:
            value = random.choice(['STAFF', 'SUPERVISOR', 'MANAGER', 'ANALYST'])
        elif 'COURSE' in label or 'GRADE' in label:
            value = random.choice(['BS Computer Science', 'BS Engineering', 'Grade 12'])
        elif 'SCHOOL YEAR' in label:
            year = random.randint(2023, 2026)
            value = f"{year}-{year + 1}"
        elif 'DISABILITY' in label:
            value = random.choice(['Visual', 'Hearing', 'Physical', 'Mental'])
        elif 'MEMBERSHIP' in label:
            value = random.choice(['EMPLOYED', 'SELF-EMPLOYED', 'VOLUNTARY'])
        elif 'PRECINCT' in label:
            value = f"{random.randint(1000, 9999)}A"
        else:
            value = f"SAMPLE-{random.randint(100, 999)}"
        
        draw.text((x, y + 15), value, fill=(30, 30, 30), font=value_font)
    
    # Draw barcode if template has one
    if template.get('has_barcode') and 'barcode_area' in template:
        draw_barcode_placeholder(draw, template['barcode_area'])
    
    # Draw MRZ if template has one (passport)
    if 'mrz_area' in template:
        draw_mrz_placeholder(draw, template['mrz_area'], mrz_font)
    
    # Apply augmentation
    if augment:
        img = apply_augmentation(img)
    
    # Save image
    img.save(output_path, 'PNG')
    return output_path


def generate_dataset(output_dir, count=100, augment=True):
    """Generate a dataset of synthetic IDs."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    template_types = list(ID_TEMPLATES.keys())
    generated = []
    
    for i in range(count):
        template_type = template_types[i % len(template_types)]
        filename = f"synth_id_{template_type}_{i:04d}.png"
        filepath = output_path / filename
        
        generate_synthetic_id(template_type, str(filepath), augment=augment)
        generated.append(str(filepath))
        
        if (i + 1) % 50 == 0:
            print(f"Generated {i + 1}/{count} synthetic IDs")
    
    print(f"Generated {len(generated)} synthetic IDs in {output_dir}")
    return generated


def main():
    parser = argparse.ArgumentParser(description='Generate synthetic ID images for training')
    parser.add_argument('--output', '-o', type=str, default='data/train/legit',
                       help='Output directory for generated images')
    parser.add_argument('--count', '-n', type=int, default=500,
                       help='Number of images to generate')
    parser.add_argument('--no-augment', action='store_true',
                       help='Disable augmentation')
    parser.add_argument('--template', '-t', type=str, default=None,
                       help='Generate only specific template type')
    
    args = parser.parse_args()
    
    if args.template:
        if args.template not in ID_TEMPLATES:
            print(f"Unknown template: {args.template}")
            print(f"Available templates: {list(ID_TEMPLATES.keys())}")
            return
    
    generate_dataset(args.output, args.count, augment=not args.no_augment)


if __name__ == '__main__':
    main()
