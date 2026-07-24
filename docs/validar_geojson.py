import json

GEOJSON_PATH = 'docs/calles_segmentadas.geojson'

with open(GEOJSON_PATH, 'r', encoding='utf-8-sig') as f:
    d = json.load(f)

feats = d['features']
errors = []

for i, feat in enumerate(feats):
    geom = feat.get('geometry')
    if not geom:
        errors.append(f"Feature {i}: sin geometry")
        continue

    gtype = geom.get('type')
    if gtype not in ('LineString', 'MultiLineString'):
        errors.append(f"Feature {i}: type inesperado {gtype}")
        continue

    coords = geom.get('coordinates', [])
    if not coords or not isinstance(coords, list):
        errors.append(f"Feature {i}: coordinates vacias o no es lista")
        continue

    if gtype == 'LineString':
        if len(coords) < 2:
            errors.append(f"Feature {i}: LineString con menos de 2 puntos")
            continue
        for j, c in enumerate(coords):
            if not isinstance(c, (list, tuple)) or len(c) < 2:
                errors.append(f"Feature {i} coord[{j}]: no es par [lon,lat]: {c}")
            elif not isinstance(c[0], (int, float)):
                errors.append(f"Feature {i} coord[{j}]: lon no numerica: {c[0]}")
            elif not isinstance(c[1], (int, float)):
                errors.append(f"Feature {i} coord[{j}]: lat no numerica: {c[1]}")

    if gtype == 'MultiLineString':
        for k, line in enumerate(coords):
            if not isinstance(line, list) or len(line) < 2:
                errors.append(f"Feature {i} MultiLineString[{k}]: menos de 2 puntos")
                continue
            for j, c in enumerate(line):
                if not isinstance(c, (list, tuple)) or len(c) < 2:
                    errors.append(f"Feature {i} MultiLineString[{k}][{j}]: no es par")

    props = feat.get('properties', {})
    if not props.get('fid'):
        errors.append(f"Feature {i}: sin fid")

print(f"Total features: {len(feats)}")
print(f"Errores: {len(errors)}")
for e in errors[:30]:
    print(f"  {e}")
