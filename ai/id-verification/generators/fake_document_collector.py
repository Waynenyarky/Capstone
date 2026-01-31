#!/usr/bin/env python3
"""
Fake Document Generator

Generates various types of fake/wrong documents for training the ID verification model.
This includes:
- Hand-drawn ID simulations
- Wrong documents (receipts, notes, etc.)
- Random objects
- Obvious fakes (memes, cropped text, edited images)

These are used as negative examples (class "fake/wrong") in the binary classifier.
"""

import os
import argparse
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np


def generate_hand_drawn_id(output_path):
    """Generate an image that looks like a hand-drawn ID card."""
    # Random paper-like background
    width, height = random.choice([(800, 500), (700, 450), (850, 550)])
    
    # Paper colors (slightly off-white, lined paper, etc.)
    bg_colors = [
        (252, 250, 245),  # Off-white
        (255, 255, 240),  # Ivory
        (245, 245, 240),  # Light gray paper
        (255, 252, 235),  # Yellow tinted
        (200, 210, 220),  # Blue-gray lined paper
    ]
    bg_color = random.choice(bg_colors)
    
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Add paper texture (lines, creases)
    if random.random() > 0.5:
        # Lined paper effect
        line_spacing = random.randint(20, 35)
        for y in range(line_spacing, height, line_spacing):
            line_color = tuple(c - 30 for c in bg_color)
            draw.line([(0, y), (width, y)], fill=line_color, width=1)
    
    # Try to use a "handwriting-like" font, fall back to default
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Noteworthy.ttc", random.randint(16, 24))
    except:
        try:
            font = ImageFont.truetype("comic.ttf", random.randint(16, 24))
        except:
            font = ImageFont.load_default()
    
    # Hand-drawn pen colors
    pen_colors = [(30, 30, 100), (20, 20, 20), (50, 50, 150), (100, 50, 50)]
    pen_color = random.choice(pen_colors)
    
    # Draw hand-drawn border (wobbly lines)
    margin = random.randint(20, 40)
    points = []
    for x in range(margin, width - margin, 10):
        y_offset = random.randint(-3, 3)
        points.append((x, margin + y_offset))
    draw.line(points, fill=pen_color, width=random.randint(1, 3))
    
    points = []
    for x in range(margin, width - margin, 10):
        y_offset = random.randint(-3, 3)
        points.append((x, height - margin + y_offset))
    draw.line(points, fill=pen_color, width=random.randint(1, 3))
    
    # Draw "ID" header (hand-written style)
    headers = ['ID CARD', 'MY ID', 'IDENTIFICATION', 'ID', 'STUDENT ID', 'WORK ID']
    header = random.choice(headers)
    draw.text((width // 2 - 50, margin + 10), header, fill=pen_color, font=font)
    
    # Draw photo box (hand-drawn rectangle)
    photo_left = margin + 20
    photo_top = margin + 60
    photo_right = photo_left + random.randint(100, 140)
    photo_bottom = photo_top + random.randint(120, 160)
    
    # Wobbly rectangle
    for _ in range(2):  # Double line for emphasis
        draw.line([
            (photo_left + random.randint(-2, 2), photo_top + random.randint(-2, 2)),
            (photo_right + random.randint(-2, 2), photo_top + random.randint(-2, 2)),
            (photo_right + random.randint(-2, 2), photo_bottom + random.randint(-2, 2)),
            (photo_left + random.randint(-2, 2), photo_bottom + random.randint(-2, 2)),
            (photo_left + random.randint(-2, 2), photo_top + random.randint(-2, 2)),
        ], fill=pen_color, width=random.randint(1, 2))
    
    # Draw stick figure in photo area
    center_x = (photo_left + photo_right) // 2
    center_y = (photo_top + photo_bottom) // 2
    # Head
    head_radius = 15
    draw.ellipse([center_x - head_radius, center_y - 30 - head_radius,
                  center_x + head_radius, center_y - 30 + head_radius],
                 outline=pen_color, width=2)
    # Body
    draw.line([(center_x, center_y - 15), (center_x, center_y + 20)], fill=pen_color, width=2)
    # Arms
    draw.line([(center_x - 20, center_y), (center_x + 20, center_y)], fill=pen_color, width=2)
    
    # Draw text fields
    text_x = photo_right + 30
    text_y = photo_top
    
    fields = [
        ('Name:', 'Juan Dela Cruz'),
        ('ID No:', f'{random.randint(1000, 9999)}'),
        ('Date:', f'{random.randint(1, 12)}/{random.randint(1, 28)}/{random.randint(1990, 2005)}'),
        ('Address:', 'Sample Street'),
    ]
    
    for label, value in fields:
        # Add slight randomness to position
        x_offset = random.randint(-5, 5)
        y_offset = random.randint(-3, 3)
        draw.text((text_x + x_offset, text_y + y_offset), label, fill=pen_color, font=font)
        draw.text((text_x + x_offset, text_y + 20 + y_offset), value, fill=pen_color, font=font)
        text_y += 50
    
    # Add some scribbles/corrections
    if random.random() > 0.5:
        scribble_x = random.randint(100, width - 100)
        scribble_y = random.randint(100, height - 100)
        for _ in range(random.randint(3, 8)):
            draw.line([
                (scribble_x + random.randint(-20, 20), scribble_y + random.randint(-10, 10)),
                (scribble_x + random.randint(-20, 20), scribble_y + random.randint(-10, 10)),
            ], fill=pen_color, width=1)
    
    # Apply slight blur to simulate photo of paper
    if random.random() > 0.5:
        img = img.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.3, 0.8)))
    
    img.save(output_path, 'PNG')
    return output_path


def generate_receipt_document(output_path):
    """Generate a fake receipt-like document."""
    width, height = random.choice([(400, 600), (350, 700), (380, 650)])
    
    # Receipt paper (white/off-white)
    bg_color = random.choice([(255, 255, 255), (252, 252, 250), (250, 250, 248)])
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)
    
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Courier.dfont", 12)
        font_bold = ImageFont.truetype("/System/Library/Fonts/Courier.dfont", 14)
    except:
        font = ImageFont.load_default()
        font_bold = font
    
    y = 20
    center_x = width // 2
    
    # Store name
    store_names = ['MINI MART', 'SARI-SARI STORE', 'GROCERY PLUS', 'QUICK SHOP', '7-ELEVEN']
    store = random.choice(store_names)
    draw.text((center_x - 50, y), store, fill=(0, 0, 0), font=font_bold)
    y += 25
    
    # Address
    draw.text((center_x - 60, y), '123 Sample St., City', fill=(0, 0, 0), font=font)
    y += 20
    
    # Separator
    draw.text((20, y), '-' * 40, fill=(0, 0, 0), font=font)
    y += 25
    
    # Items
    items = [
        ('Rice 1kg', random.uniform(40, 60)),
        ('Cooking Oil', random.uniform(50, 80)),
        ('Sugar 1kg', random.uniform(45, 65)),
        ('Noodles x3', random.uniform(30, 50)),
        ('Canned Goods', random.uniform(25, 45)),
        ('Soap', random.uniform(15, 35)),
        ('Shampoo', random.uniform(10, 25)),
    ]
    
    total = 0
    for item, price in random.sample(items, random.randint(3, 6)):
        draw.text((20, y), f'{item}', fill=(0, 0, 0), font=font)
        draw.text((width - 80, y), f'P{price:.2f}', fill=(0, 0, 0), font=font)
        total += price
        y += 18
    
    # Separator
    y += 5
    draw.text((20, y), '-' * 40, fill=(0, 0, 0), font=font)
    y += 25
    
    # Total
    draw.text((20, y), 'TOTAL:', fill=(0, 0, 0), font=font_bold)
    draw.text((width - 100, y), f'P{total:.2f}', fill=(0, 0, 0), font=font_bold)
    y += 25
    
    # Cash/Change
    cash = total + random.uniform(10, 50)
    draw.text((20, y), f'CASH: P{cash:.2f}', fill=(0, 0, 0), font=font)
    y += 18
    draw.text((20, y), f'CHANGE: P{cash - total:.2f}', fill=(0, 0, 0), font=font)
    y += 30
    
    # Footer
    draw.text((center_x - 60, y), 'THANK YOU!', fill=(0, 0, 0), font=font)
    y += 20
    draw.text((center_x - 80, y), f'Date: {random.randint(1, 12)}/{random.randint(1, 28)}/2024', fill=(0, 0, 0), font=font)
    
    # Add some noise/wear
    img_array = np.array(img)
    noise = np.random.normal(0, 5, img_array.shape).astype(np.int16)
    img_array = np.clip(img_array.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    img = Image.fromarray(img_array)
    
    img.save(output_path, 'PNG')
    return output_path


def generate_random_object(output_path):
    """Generate an image of a random object (non-document)."""
    width, height = random.choice([(600, 400), (500, 500), (700, 500)])
    
    # Random background
    bg_color = (
        random.randint(180, 255),
        random.randint(180, 255),
        random.randint(180, 255)
    )
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Draw random shapes to simulate objects
    num_shapes = random.randint(3, 8)
    
    for _ in range(num_shapes):
        shape_type = random.choice(['rectangle', 'ellipse', 'polygon'])
        color = (
            random.randint(50, 200),
            random.randint(50, 200),
            random.randint(50, 200)
        )
        
        if shape_type == 'rectangle':
            x1 = random.randint(50, width - 150)
            y1 = random.randint(50, height - 150)
            x2 = x1 + random.randint(50, 200)
            y2 = y1 + random.randint(50, 150)
            draw.rectangle([x1, y1, x2, y2], fill=color, outline=(0, 0, 0))
        elif shape_type == 'ellipse':
            x1 = random.randint(50, width - 150)
            y1 = random.randint(50, height - 150)
            x2 = x1 + random.randint(50, 200)
            y2 = y1 + random.randint(50, 150)
            draw.ellipse([x1, y1, x2, y2], fill=color, outline=(0, 0, 0))
        else:  # polygon
            num_points = random.randint(3, 6)
            center_x = random.randint(100, width - 100)
            center_y = random.randint(100, height - 100)
            radius = random.randint(30, 100)
            points = []
            for i in range(num_points):
                angle = (2 * np.pi * i) / num_points + random.uniform(-0.3, 0.3)
                r = radius + random.randint(-20, 20)
                x = center_x + int(r * np.cos(angle))
                y = center_y + int(r * np.sin(angle))
                points.append((x, y))
            draw.polygon(points, fill=color, outline=(0, 0, 0))
    
    # Add some texture
    img_array = np.array(img)
    noise = np.random.normal(0, 8, img_array.shape).astype(np.int16)
    img_array = np.clip(img_array.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    img = Image.fromarray(img_array)
    
    # Maybe blur
    if random.random() > 0.5:
        img = img.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.5, 1.5)))
    
    img.save(output_path, 'PNG')
    return output_path


def generate_random_text_document(output_path):
    """Generate a document with random text (not an ID)."""
    width, height = random.choice([(600, 800), (700, 900), (650, 850)])
    
    bg_color = (255, 255, 255)
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)
    
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 12)
        font_header = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 18)
    except:
        font = ImageFont.load_default()
        font_header = font
    
    # Random document types
    doc_types = ['LETTER', 'MEMO', 'NOTICE', 'REPORT', 'FORM', 'APPLICATION']
    doc_type = random.choice(doc_types)
    
    # Header
    draw.text((width // 2 - 50, 30), doc_type, fill=(0, 0, 0), font=font_header)
    
    # Random lorem ipsum-like text
    words = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing',
             'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore',
             'et', 'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam',
             'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi']
    
    y = 80
    margin = 50
    line_height = 18
    
    for _ in range(random.randint(15, 30)):
        if y > height - 50:
            break
        
        # Generate a line of text
        line_words = random.randint(5, 12)
        line = ' '.join(random.choice(words) for _ in range(line_words))
        
        # Capitalize first word
        line = line.capitalize() + '.'
        
        draw.text((margin, y), line, fill=(30, 30, 30), font=font)
        y += line_height
        
        # Random paragraph breaks
        if random.random() > 0.7:
            y += line_height
    
    img.save(output_path, 'PNG')
    return output_path


def generate_meme_like_image(output_path):
    """Generate a meme-like image (obvious non-ID)."""
    width, height = random.choice([(600, 600), (800, 600), (500, 500)])
    
    # Colorful background
    bg_color = (
        random.randint(100, 255),
        random.randint(100, 255),
        random.randint(100, 255)
    )
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)
    
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Impact.ttf", 36)
    except:
        try:
            font = ImageFont.truetype("impact.ttf", 36)
        except:
            font = ImageFont.load_default()
    
    # Random meme-like text
    top_texts = ['WHEN YOU', 'ME TRYING TO', 'POV:', 'NOBODY:', 'THAT MOMENT WHEN']
    bottom_texts = ['SUBMIT AN ID', 'USE A FAKE ID', 'FIND YOUR ID', 'NOT AN ID', 'NICE TRY']
    
    top_text = random.choice(top_texts)
    bottom_text = random.choice(bottom_texts)
    
    # Draw text with outline (meme style)
    def draw_text_with_outline(text, y, font):
        try:
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
        except:
            text_width = len(text) * 20
        x = (width - text_width) // 2
        
        # Black outline
        for dx in [-2, 0, 2]:
            for dy in [-2, 0, 2]:
                draw.text((x + dx, y + dy), text, fill=(0, 0, 0), font=font)
        # White fill
        draw.text((x, y), text, fill=(255, 255, 255), font=font)
    
    draw_text_with_outline(top_text, 30, font)
    draw_text_with_outline(bottom_text, height - 80, font)
    
    # Add random shape in middle
    center_x, center_y = width // 2, height // 2
    size = random.randint(80, 150)
    shape_color = (
        random.randint(50, 200),
        random.randint(50, 200),
        random.randint(50, 200)
    )
    draw.ellipse([center_x - size, center_y - size, center_x + size, center_y + size],
                 fill=shape_color, outline=(0, 0, 0), width=3)
    
    img.save(output_path, 'PNG')
    return output_path


def generate_cropped_screenshot(output_path):
    """Generate a cropped screenshot-like image."""
    width, height = random.choice([(400, 300), (500, 400), (600, 350)])
    
    # Screen-like colors
    bg_colors = [(240, 240, 245), (235, 235, 240), (245, 245, 250)]
    bg_color = random.choice(bg_colors)
    
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)
    
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 14)
    except:
        font = ImageFont.load_default()
    
    # Draw UI elements (buttons, text fields, etc.)
    # Menu bar
    draw.rectangle([0, 0, width, 30], fill=(220, 220, 225))
    draw.text((10, 8), 'File  Edit  View  Help', fill=(50, 50, 50), font=font)
    
    # Random UI elements
    y = 50
    for _ in range(random.randint(3, 6)):
        # Text field or button
        if random.random() > 0.5:
            # Text field
            draw.rectangle([20, y, width - 20, y + 30], fill=(255, 255, 255), outline=(180, 180, 180))
            draw.text((25, y + 8), 'Input field...', fill=(150, 150, 150), font=font)
        else:
            # Button
            btn_width = random.randint(80, 150)
            btn_x = random.randint(20, width - btn_width - 20)
            btn_color = random.choice([(70, 130, 200), (100, 180, 100), (200, 100, 100)])
            draw.rectangle([btn_x, y, btn_x + btn_width, y + 35], fill=btn_color)
            draw.text((btn_x + 10, y + 10), 'Button', fill=(255, 255, 255), font=font)
        y += 50
    
    img.save(output_path, 'PNG')
    return output_path


def generate_blank_or_noise(output_path):
    """Generate a blank or noisy image."""
    width, height = random.choice([(600, 400), (500, 500), (700, 500)])
    
    if random.random() > 0.5:
        # Blank with slight color
        bg_color = (
            random.randint(230, 255),
            random.randint(230, 255),
            random.randint(230, 255)
        )
        img = Image.new('RGB', (width, height), bg_color)
    else:
        # Noisy image
        img_array = np.random.randint(100, 200, (height, width, 3), dtype=np.uint8)
        img = Image.fromarray(img_array)
    
    # Maybe add some random lines
    if random.random() > 0.5:
        draw = ImageDraw.Draw(img)
        for _ in range(random.randint(1, 5)):
            x1, y1 = random.randint(0, width), random.randint(0, height)
            x2, y2 = random.randint(0, width), random.randint(0, height)
            color = (random.randint(0, 100), random.randint(0, 100), random.randint(0, 100))
            draw.line([(x1, y1), (x2, y2)], fill=color, width=random.randint(1, 3))
    
    img.save(output_path, 'PNG')
    return output_path


def apply_random_augmentation(img):
    """Apply random augmentation to make images more varied."""
    # Random rotation
    if random.random() > 0.5:
        angle = random.uniform(-15, 15)
        img = img.rotate(angle, fillcolor=(255, 255, 255), expand=False)
    
    # Random crop/resize
    if random.random() > 0.6:
        width, height = img.size
        crop_factor = random.uniform(0.8, 0.95)
        new_width = int(width * crop_factor)
        new_height = int(height * crop_factor)
        left = random.randint(0, width - new_width)
        top = random.randint(0, height - new_height)
        img = img.crop((left, top, left + new_width, top + new_height))
        img = img.resize((width, height), Image.Resampling.LANCZOS)
    
    # Brightness adjustment
    if random.random() > 0.5:
        img_array = np.array(img)
        factor = random.uniform(0.7, 1.3)
        img_array = np.clip(img_array * factor, 0, 255).astype(np.uint8)
        img = Image.fromarray(img_array)
    
    # Add noise
    if random.random() > 0.5:
        img_array = np.array(img)
        noise = np.random.normal(0, random.uniform(5, 15), img_array.shape).astype(np.int16)
        img_array = np.clip(img_array.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        img = Image.fromarray(img_array)
    
    # Blur
    if random.random() > 0.6:
        img = img.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.5, 2.0)))
    
    return img


GENERATORS = [
    ('hand_drawn', generate_hand_drawn_id),
    ('receipt', generate_receipt_document),
    ('random_object', generate_random_object),
    ('text_document', generate_random_text_document),
    ('meme', generate_meme_like_image),
    ('screenshot', generate_cropped_screenshot),
    ('blank_noise', generate_blank_or_noise),
]


def generate_fake_dataset(output_dir, count=100, augment=True):
    """Generate a dataset of fake/wrong documents."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    generated = []
    
    for i in range(count):
        # Select a random generator
        gen_name, generator = random.choice(GENERATORS)
        filename = f"fake_{gen_name}_{i:04d}.png"
        filepath = output_path / filename
        
        # Generate the image
        generator(str(filepath))
        
        # Apply augmentation
        if augment:
            img = Image.open(filepath)
            img = apply_random_augmentation(img)
            img.save(filepath, 'PNG')
        
        generated.append(str(filepath))
        
        if (i + 1) % 50 == 0:
            print(f"Generated {i + 1}/{count} fake documents")
    
    print(f"Generated {len(generated)} fake documents in {output_dir}")
    return generated


def main():
    parser = argparse.ArgumentParser(description='Generate fake/wrong document images for training')
    parser.add_argument('--output', '-o', type=str, default='data/train/fake',
                       help='Output directory for generated images')
    parser.add_argument('--count', '-n', type=int, default=500,
                       help='Number of images to generate')
    parser.add_argument('--no-augment', action='store_true',
                       help='Disable augmentation')
    parser.add_argument('--type', '-t', type=str, default=None,
                       choices=[name for name, _ in GENERATORS],
                       help='Generate only specific type')
    
    args = parser.parse_args()
    
    generate_fake_dataset(args.output, args.count, augment=not args.no_augment)


if __name__ == '__main__':
    main()
