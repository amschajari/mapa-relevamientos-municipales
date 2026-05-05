#!/usr/bin/env python3
"""
Script de segmentación de calles por intersecciones
Corta los tramos de calle en intersecciones (cuadra a cuadra)
"""

import json
from shapely.geometry import LineString, Point
from collections import Counter
import sys

# Configurar encoding
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Cargar GeoJSON
print("Cargando GeoJSON...")
with open('src/data/calles_ejido_reordenado.geojson', 'r', encoding='utf-8') as f:
    geojson = json.load(f)

features = geojson['features']
print(f"  {len(features)} features cargados")

# Convertir a objetos Shapely
print("Convirtiendo a geometrías...")
lines = []
for i, feat in enumerate(features):
    geom = feat['geometry']
    coords = []
    
    if geom['type'] == 'MultiLineString':
        for line_coords in geom['coordinates']:
            coords.extend(line_coords)
    elif geom['type'] == 'LineString':
        coords = geom['coordinates']
    
    if len(coords) > 1:
        shapely_line = LineString(coords)
        lines.append({
            'index': i,
            'name': feat['properties'].get('name', ''),
            'fid': feat['properties'].get('fid', i+1),
            'geom': shapely_line,
            'coords': coords
        })

print(f"  {len(lines)} lineas procesadas")

# Obtener TODOS los vertices únicos como puntos de corte
print("Extrayendo vertices (puntos de corte potenciales)...")
all_vertices = set()

for line in lines:
    coords = line['coords']
    # Agregar todos los vertices de la linea
    for c in coords:
        all_vertices.add((round(c[0], 6), round(c[1], 6)))

print(f"  {len(all_vertices)} vertices unicos")

# Para cada vertice, verificar si es una intersección (punto donde se unen 2+ lineas)
print("Identificando intersecciones reales...")
intersection_coords = []

for vx, vy in all_vertices:
    point = Point(vx, vy)
    count = 0
    
    for line in lines:
        if line['geom'].distance(point) < 0.00005:  # ~5 metros
            count += 1
            if count >= 2:
                break
    
    if count >= 2:
        intersection_coords.append((vx, vy))

print(f"  {len(intersection_coords)} intersecciones reales")

# Agregar vertices extremos de cada linea
for line in lines:
    coords = line['coords']
    intersection_coords.append((round(coords[0][0], 6), round(coords[0][1], 6)))
    intersection_coords.append((round(coords[-1][0], 6), round(coords[-1][1], 6)))

# Deduplicar
intersection_coords = list(set(intersection_coords))
print(f"  {len(intersection_coords)} puntos de corte totales")

# Segmentar cada linea
print("Segmentando lineas...")
new_features = []
new_fid = 1
min_segment_length = 3  # metros

for line_idx, line in enumerate(lines):
    name = line['name']
    original_fid = line['fid']
    coords = line['coords']
    geom = line['geom']
    
    if len(coords) < 2:
        continue
    
    # Encontrar puntos de corte relevantes para esta linea
    relevant_cuts = set()
    
    for ic in intersection_coords:
        point = Point(ic)
        if geom.distance(point) < 0.0001:  # ~10 metros
            # Encontrar indice mas cercano
            min_dist = float('inf')
            best_idx = -1
            for i, c in enumerate(coords):
                d = ((c[0] - ic[0])**2 + (c[1] - ic[1])**2)**0.5
                if d < min_dist:
                    min_dist = d
                    best_idx = i
            if best_idx >= 0:
                relevant_cuts.add(best_idx)
    
    # Siempre incluir inicio y fin
    relevant_cuts.add(0)
    relevant_cuts.add(len(coords) - 1)
    
    # Ordenar posiciones
    positions = sorted(relevant_cuts)
    
    # Crear segmentos entre posiciones consecutivas
    for i in range(len(positions) - 1):
        idx1 = positions[i]
        idx2 = positions[i + 1]
        
        if idx2 <= idx1:
            continue
        
        segment_coords = coords[idx1:idx2+1]
        
        if len(segment_coords) < 2:
            continue
        
        # Calcular longitud en metros
        seg_length = 0
        for j in range(len(segment_coords) - 1):
            dx = segment_coords[j+1][0] - segment_coords[j][0]
            dy = segment_coords[j+1][1] - segment_coords[j][1]
            # Aproximacion: 1 grado ~ 111km en latitud
            seg_length += ((dx * 111320)**2 + (dy * 111320 * 0.86)**2)**0.5
        
        if seg_length < min_segment_length:
            continue
        
        new_features.append({
            'type': 'Feature',
            'properties': {
                'name': name,
                'fid': new_fid,
                'calle': name,
                'entre_calle_1': '',
                'entre_calle_2': '',
                'tipo_obra': '',
                'fecha_aprobacion_concejo': None,
                'fecha_inauguracion': None,
                'observaciones': None,
                'original_fid': original_fid,
                'longitud_m': round(seg_length, 1)
            },
            'geometry': {
                'type': 'LineString',
                'coordinates': segment_coords
            }
        })
        new_fid += 1
    
    if (line_idx + 1) % 200 == 0:
        print(f"  Proceso {line_idx + 1}/{len(lines)} - {len(new_features)} segmentos")

print(f"\n  Total: {len(new_features)} segmentos")

# Guardar GeoJSON
output = {
    'type': 'FeatureCollection',
    'name': 'calles_segmentadas',
    'crs': {'type': 'name', 'properties': {'name': 'urn:ogc:def:crs:OGC:1.3:CRS84'}},
    'features': new_features
}

print("Guardando...")
with open('docs/calles_segmentadas.geojson', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\n[OK]")
print(f"  Originales: {len(features)}")
print(f"  Segmentados: {len(new_features)}")
print(f"  Calles unicas: {len(set(f['properties']['name'] for f in new_features))}")

# Top 10
name_counts = Counter(f['properties']['name'] for f in new_features)
print(f"\nTop 10 calles:")
for name, count in name_counts.most_common(10):
    print(f"  {name}: {count}")