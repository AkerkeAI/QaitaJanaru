import sys
import os
sys.path.insert(0, os.getcwd())
from app.services.ai_waste_detector import analyze_waste_image, GEMINI_API_KEY
print('cwd=', os.getcwd())
print('GEMINI_API_KEY loaded:', bool(GEMINI_API_KEY))
print('GEMINI_API_KEY preview:', GEMINI_API_KEY[:20] if GEMINI_API_KEY else 'none')
repo_root = os.path.abspath(os.path.join(os.getcwd(), os.pardir, os.pardir))
image_path = os.path.join(repo_root, 'test_image.png')
print('repo_root=', repo_root)
print('test image path:', image_path, 'exists:', os.path.exists(image_path))
with open(image_path, 'rb') as f:
    img = f.read()
print('image len:', len(img))
try:
    result = analyze_waste_image(img)
    print('result:', result)
except Exception as exc:
    import traceback
    traceback.print_exc()
