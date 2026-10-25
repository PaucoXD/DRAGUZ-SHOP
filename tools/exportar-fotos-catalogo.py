"""Baja las fotos del catálogo (colección «stock» de Firestore) y las guarda como archivos ligeros
en assets/catalogo/<id>.webp, más la lista js/catalogo-fotos.js. Así los clientes no descargan
las fotos dentro de la base de datos. Córrelo de nuevo cuando subas o cambies varios diseños:
    python tools/exportar-fotos-catalogo.py
(Requiere Pillow: pip install pillow). Las piezas sin archivo igual se ven: la página pide su foto aparte."""
import base64, io, json, os, urllib.parse, urllib.request
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = 'https://firestore.googleapis.com/v1/projects/draguz-shop-web/databases/(default)/documents/stock'

docs, tok = [], ''
while True:
    r = json.load(urllib.request.urlopen(URL + '?pageSize=100' + ('&pageToken=' + urllib.parse.quote(tok) if tok else '')))
    docs += r.get('documents', []); tok = r.get('nextPageToken')
    if not tok: break

out_dir = os.path.join(ROOT, 'assets', 'catalogo'); os.makedirs(out_dir, exist_ok=True)
keys = {}
for d in docs:
    i = d['name'].split('/')[-1]
    vals = d.get('fields', {}).get('images', {}).get('arrayValue', {}).get('values', [])
    if not vals or not vals[0].get('stringValue', '').startswith('data:'): continue
    src = vals[0]['stringValue']
    im = Image.open(io.BytesIO(base64.b64decode(src.split(',', 1)[1]))).convert('RGB')
    if im.width > 600: im = im.resize((600, round(im.height * 600 / im.width)), Image.LANCZOS)
    im.save(os.path.join(out_dir, i + '.webp'), 'WEBP', quality=78, method=6)
    keys[i] = f'{len(src)}-{src[-12:]}'  # misma huella que calcula js/store.js al guardar

with open(os.path.join(ROOT, 'js', 'catalogo-fotos.js'), 'w', encoding='utf-8') as f:
    f.write('/* Fotos del catálogo como archivos (assets/catalogo/<id>.webp) y la huella de cada una.\n   Lo genera tools/exportar-fotos-catalogo.py; no editar a mano. */\n')
    f.write('window.CAT_FOTOS = ' + json.dumps(dict(sorted(keys.items())), ensure_ascii=False) + ';\n')
print(f'{len(keys)} fotos exportadas')
