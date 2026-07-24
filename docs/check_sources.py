import json

# Original source imported to Supabase
with open('src/data/calles_ejido_reordenado.geojson', 'r', encoding='utf-8') as f:
    original = json.load(f)

print(f"=== calles_ejido_reordenado.geojson ===")
print(f"Features: {len(original['features'])}")
first = original['features'][0]
print(f"Primer feature props: {json.dumps(first['properties'], ensure_ascii=False, indent=2)}")
print(f"Geometry type: {first['geometry']['type']}")
names = set(f['properties'].get('name','') for f in original['features'])
print(f"Calles unicas: {len(names)}")
print()

# Segmented version
with open('docs/calles_segmentadas.geojson', 'r', encoding='utf-8-sig') as f:
    seg = json.load(f)

print(f"=== docs/calles_segmentadas.geojson ===")
print(f"Features: {len(seg['features'])}")
first_s = seg['features'][0]
print(f"Primer feature props: {json.dumps(first_s['properties'], ensure_ascii=False, indent=2)}")
print(f"Geometry type: {first_s['geometry']['type']}")
names_s = set(f['properties'].get('calle','') for f in seg['features'])
print(f"Calles unicas: {len(names_s)}")
print(f"Muestras: {sorted(list(names_s))[:10]}")
