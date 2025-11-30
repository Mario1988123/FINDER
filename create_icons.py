#!/usr/bin/env python3
"""Generate app icons for PWA"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    # Create image with gradient background
    img = Image.new('RGB', (size, size), color='#1e3c72')
    draw = ImageDraw.Draw(img)

    # Draw radar circles
    center = size // 2

    # Outer circle
    circle_color = '#00d4ff'
    draw.ellipse([size*0.1, size*0.1, size*0.9, size*0.9],
                 outline=circle_color, width=int(size*0.03))

    # Middle circle
    draw.ellipse([size*0.25, size*0.25, size*0.75, size*0.75],
                 outline=circle_color, width=int(size*0.02))

    # Inner circle
    draw.ellipse([size*0.4, size*0.4, size*0.6, size*0.6],
                 outline=circle_color, width=int(size*0.02))

    # Center dot
    dot_size = int(size * 0.08)
    draw.ellipse([center-dot_size, center-dot_size, center+dot_size, center+dot_size],
                 fill='#00ff88')

    # Radar line
    draw.line([center, center, size*0.9, center], fill='#00ff88', width=int(size*0.02))

    # Save
    img.save(filename, 'PNG')
    print(f'Created {filename}')

# Create icons
create_icon(192, 'icon-192.png')
create_icon(512, 'icon-512.png')

print('Icons created successfully!')
