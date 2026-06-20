import requests
from app.services.ai_waste_detector import GEMINI_API_KEY

print('GEMINI_API_KEY loaded:', bool(GEMINI_API_KEY))
url = f'https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_API_KEY}'
response = requests.get(url, timeout=20)
print('status_code=', response.status_code)
data = response.json()
models = data.get('models', [])
print('model count=', len(models))
for model in models:
    name = model.get('name')
    desc = model.get('description')
    methods = model.get('supportedGenerationMethods')
    print('MODEL:', name, 'desc:', desc)
    print('  methods:', methods)
    print('  vision? ', 'vision' in (name or '').lower() or 'image' in (name or '').lower() or 'vision' in (desc or '').lower() or 'image' in (desc or '').lower())
