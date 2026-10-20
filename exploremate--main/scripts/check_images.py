"""
ExploreMate Image Checking Script
Validates all photo paths in frontend/public/photos and reports status.
"""

from pathlib import Path

PHOTOS_DIR = Path(__file__).resolve().parent.parent / "frontend" / "public" / "photos"

def check_images():
    print(f"Checking images in: {PHOTOS_DIR}")
    if not PHOTOS_DIR.exists():
        print("Photos directory does not exist!")
        return False
        
    photos = list(PHOTOS_DIR.glob("*.*"))
    print(f"Total photos found: {len(photos)}")
    
    assigned_count = 0
    for p in sorted(photos):
        size_kb = round(p.stat().st_size / 1024, 1)
        print(f"  • {p.name} ({size_kb} KB)")
        assigned_count += 1
        
    return True

if __name__ == "__main__":
    check_images()
