import json, os

files = [
    'src/data/calles_ejido_reordenado.geojson',
    'src/data/calles_pavim_040526_0941.geojson',
    'src/data/calles_pavim_040526_1050.geojson',
    'docs/calles_segmentadas.geojson',
]

for fname in files:
    if not os.path.exists(fname):
        print(f'{fname}: NO EXISTE')
        continue
    with open(fname, encoding='utf-8-sig') as f:
        d = json.load(f)
    feats = d.get('features', [])
    print(f'{fname}')
    print(f'  Features: {len(feats)}')
    if feats:
        p = feats[0].get('properties', {})
        g = feats[0].get('geometry', {})
        print(f'  Props: {json.dumps(p, ensure_ascii=False)[:250]}')
        print(f'  Geom type: {g.get("type")}')
        names = set(f.get('properties',{}).get('name','') or f.get('properties',{}).get('calle','') for f in feats)
        print(f'  Calles unicas: {len(names)}')
    print()
