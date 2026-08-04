import json
from collections import defaultdict

GEOJSON_PATH = 'docs/calles_segmentadas.geojson'
OUTPUT_PATH = 'docs/calles_segmentadas.geojson'

with open(GEOJSON_PATH, 'r', encoding='utf-8-sig') as f:
    geojson = json.load(f)

features = geojson['features']
print(f"Features cargados: {len(features)}")

# Build a spatial index: for each rounded endpoint, list features that share it
point_index = defaultdict(list)

for feat in features:
    fid = feat['properties']['fid']
    coords = feat['geometry']['coordinates']
    # Round to 5 decimal places (~1m precision)
    rounded = [(round(c[0], 5), round(c[1], 5)) for c in coords]

    # Index the first and last point (endpoints)
    first = rounded[0]
    last = rounded[-1]
    point_index[first].append(fid)
    if last != first:
        point_index[last].append(fid)

print(f"Puntos únicos indexados: {len(point_index)}")

# Build intersections: for each feature, find features of OTHER streets sharing endpoints
fid_to_features = {f['properties']['fid']: f for f in features}

intersections = defaultdict(set)

for fid, feat in fid_to_features.items():
    calle = feat['properties']['calle']
    coords = feat['geometry']['coordinates']
    first = (round(coords[0][0], 5), round(coords[0][1], 5))
    last = (round(coords[-1][0], 5), round(coords[-1][1], 5))

    for pt in (first, last):
        for other_fid in point_index.get(pt, []):
            if other_fid == fid:
                continue
            other = fid_to_features[other_fid]
            other_calle = other['properties']['calle']
            if other_calle.lower() == calle.lower():
                continue
            intersections[fid].add(other_fid)

print(f"Intersecciones detectadas: {sum(len(v) for v in intersections.values())}")

# Assign entre_calle_1 and entre_calle_2
asignados = 0
for fid, inters in intersections.items():
    # Get street names of intersecting features
    nombres = []
    seen = set()
    for other_fid in inters:
        name = fid_to_features[other_fid]['properties']['calle']
        if name and name.lower() not in seen:
            seen.add(name.lower())
            nombres.append(name)

    feat = fid_to_features[fid]
    feat['properties']['entre_calle_1'] = nombres[0] if len(nombres) > 0 else ''
    feat['properties']['entre_calle_2'] = nombres[1] if len(nombres) > 1 else ''
    if nombres:
        asignados += 1

print(f"Segmentos con entre_calle asignado: {asignados}")

# Count how many still have empty entre_calles
vacios = sum(1 for f in features if not f['properties'].get('entre_calle_1') and not f['properties'].get('entre_calle_2'))
print(f"Segmentos sin ninguna entre_calle: {vacios}")

# Save
with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(geojson, f, ensure_ascii=False, indent=2)

print(f"[OK] GeoJSON guardado en {OUTPUT_PATH}")
