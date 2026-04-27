# -*- coding: utf-8 -*-
"""
==============================================================
CALLES CHAJARÍ - Descarga y Procesamiento desde OSM
==============================================================
Autor: Sistema GIS Chajarí
Fecha: Abril 2026
Descripción:
  Descarga calles de Chajarí desde OpenStreetMap via Overpass API,
  categoriza por tipo de vía, exporta a GeoJSON y prepara
  importacion a Supabase.
==============================================================

用法 / Usage:
  1. Abrir QGIS > Processing Toolbox > Scripts >
     Calles Chajari Download and Process
  2. Seleccionar carpeta de salida
  3. Hacer clic en "Run"

Dependencias:
  - QGIS 3.x
  - requests (incluido en QGIS)
  - Solo conexión a internet
"""

from qgis.core import (
    Qgis,
   QgisAlgorithm,
   QgisProcessingAlgorithm,
   QGis
)
from qgis.processing import run
from qgis.PyQt.QtCore import QUrl
from qgis.PyQt.QtNetwork import QNetworkRequest
import processing
import os
import json
import math
from datetime import datetime

class CallesChajariAlgorithm(QgisProcessingAlgorithm):
    """Algoritmo para descargar y procesar calles de Chajarí desde OSM."""
    
    # ========================
    # CONSTANTES
    # ========================
    
    # Bounding box de Chajarí (basado en polígonos de barrios)
    BBOX_CHAJARI = {
        'south': -30.780,
        'west': -58.030,
        'north': -30.730,
        'east': -57.965
    }
    
    # Tipos de vía a descargar
    HIGHWAY_TYPES = [
        'residential',    # Calles residenciales
        'primary',      # Avenidas principales
        'secondary',   # Secundarias/colectoras
        'tertiary',    # Terciarias
        'service',     # Calles de servicio/acceso
        'unclassified' # Otras
    ]
    
    # Mapeo de tipos a categorías para Supabase
    TIPO_CATEGORIA = {
        'residential': 'calle',
        'primary': 'avenida',
        'secondary': 'avenida',
        'tertiary': 'calle',
        'service': 'calle',
        'unclassified': 'calle'
    }
    
    # ========================
    # PARÁMETROS
    # ========================
    
    OUTPUT_FOLDER = 'OUTPUT_FOLDER'
    FILENAME_PREFIX = 'FILENAME_PREFIX'
    
    def initAlgorithm(self, config=None):
        self.addParameter(
            self.parameterFileDestination(
                name=self.OUTPUT_FOLDER,
                description='Carpeta de salida (Output Folder)'
            )
        )
        self.addParameter(
            self.parameterString(
                name=self.FILENAME_PREFIX,
                description='Prefijo del archivo (filename prefix)',
                defaultValue='calles_chajari'
            )
        )
    
    def processAlgorithm(self, parameters, context, feedback):
        output_folder = self.parameterAsString(parameters, self.OUTPUT_FOLDER, context)
        prefix = self.parameterAsString(parameters, self.FILENAME_PREFIX, context)
        
        if not output_folder:
            feedback.reportError('Error: No se especificó carpeta de salida')
            return {}
        
        os.makedirs(output_folder, exist_ok=True)
        
        feedback.pushInfo('=' * 50)
        feedback.pushInfo('CALLES CHAJARÍ - Descarga desde OSM')
        feedback.pushInfo('=' * 50)
        feedback.pushInfo(f'Carpeta: {output_folder}')
        feedback.pushInfo('')
        
        # ---- Descargar desde Overpass API ----
        feedback.pushInfo('1. Descargando calles desde Overpass API...')
        feedback.setProgress(10)
        
        geojson_data = self.descargar_desde_overpass(feedback)
        
        if not geojson_data or not geojson_data.get('features'):
            feedback.reportError('Error: No se descargaron datos')
            return {}
        
        total_features = len(geojson_data['features'])
        feedback.pushInfo(f'   ✓ Descargados {total_features} elementos')
        feedback.setProgress(40)
        
        # ---- Procesar datos ----
        feedback.pushInfo('')
        feedback.pushInfo('2. Procesando datos...')
        feedback.setProgress(50)
        
        calles_procesadas = self.procesar_calles(geojson_data, feedback)
        
        feedback.pushInfo(f'   ✓ {len(calles_procesadas)} calles procesadas')
        feedback.setProgress(70)
        
        # ---- Exportar GeoJSON ----
        feedback.pushInfo('')
        feedback.pushInfo('3. Exportando a GeoJSON...')
        feedback.setProgress(80)
        
        # Crear GeoJSON limpio para Supabase
        output_geojson = {
            'type': 'FeatureCollection',
            'name': prefix,
            'crs': {
                'type': 'name',
                'properties': {'name': 'urn:ogc:def:crs:OGC:1.3:CRS84'}
            },
            'features': []
        }
        
        # Procesar cada feature para Supabase
        for idx, feature in enumerate(calles_procesadas):
            props = feature.get('properties', {})
            
            # Agregar campos limpios
            clean_feature = {
                'type': 'Feature',
                'properties': {
                    'fid': idx + 1,
                    'nombre': props.get('name', f'Calle sin nombre {idx + 1}'),
                    'tipo': props.get('highway', 'unclassified'),
                    'categoria': self.TIPO_CATEGORIA.get(
                        props.get('highway', 'unclassified'), 'calle'
                    ),
                    'superficie': props.get('surface', ''),
                    'longitud_m': round(feature.get('length', 0), 1)
                },
                'geometry': feature.get('geometry')
            }
            output_geojson['features'].append(clean_feature)
        
        # Guardar GeoJSON
        fecha = datetime.now().strftime('%Y%m%d_%H%M')
        geojson_path = os.path.join(output_folder, f'{prefix}_{fecha}.geojson')
        
        with open(geojson_path, 'w', encoding='utf-8') as f:
            json.dump(output_geojson, f, ensure_ascii=False, indent=2)
        
        feedback.pushInfo(f'   ✓ Guardado: {os.path.basename(geojson_path)}')
        feedback.pushInfo(f'   ✓ {len(output_geojson["features"])} features')
        feedback.setProgress(100)
        
        # ---- Resumen ----
        feedback.pushInfo('')
        feedback.pushInfo('=' * 50)
        feedback.pushInfo('PROCESO COMPLETADO')
        feedback.pushInfo('=' * 50)
        feedback.pushInfo(f'Archivo: {geojson_path}')
        feedback.pushInfo('')
        feedback.pushInfo('Próximos pasos:')
        feedback.pushInfo('  1. Abrir el GeoJSON en QGIS para revisión')
        feedback.pushInfo('  2. Editar nombres en QGIS si es necesario')
        feedback.pushInfo('  3. Exportar a CSV o usar el importador del sistema')
        feedback.pushInfo('')
        
        return {'OUTPUT': geojson_path}
    
    def descargar_desde_overpass(self, feedback):
        """Descarga calles desde Overpass API."""
        import urllib.request
        import urllib.parse
        
        # Construir query Overpass
        bbox = self.BBOX_CHAJARI
        bbox_str = (
            f"{bbox['south']},{bbox['west']},"
            f"{bbox['north']},{bbox['east']}"
        )
        
        ways_filter = ' '.join([
            f'way["highway"="{t}"]({bbox_str});'
            for t in self.HIGHWAY_TYPES
        ])
        
        query = f"""
[out:json][timeout:60];
(
{ways_filter}
);
out body;
>;
out skel qt;
""".strip()
        
        # URL de Overpass API
        url = 'https://overpass-api.de/api/interpreter'
        
        feedback.pushInfo(f'   Bbox: {bbox_str}')
        feedback.pushInfo(f'   URL: {url}')
        feedback.pushInfo(f'   Tipos: {", ".join(self.HIGHWAY_TYPES)}')
        
        try:
            data = urllib.parse.urlencode({'data': query}).encode('utf-8')
            req = urllib.request.Request(url, data=data)
            req.add_header('User-Agent', 'QGIS-Calles-Chajari/1.0')
            
            with urllib.request.urlopen(req, timeout=120) as response:
                result = json.loads(response.read().decode('utf-8'))
            
            # Convertir JSON de Overpass a GeoJSON
            return self.json_to_geojson(result)
            
        except Exception as e:
            feedback.reportError(f'Error descargando: {str(e)}')
            return None
    
    def json_to_geojson(self, overpass_json):
        """Convierte resultado de Overpass JSON a GeoJSON."""
        features = []
        
        for element in overpass_json.get('elements', []):
            if element.get('type') != 'way':
                continue
            
            # Ignorar ways sin geometry
            if 'geometry' not in element or not element['geometry']:
                continue
            
            # Crear coordenadas [lon, lat] para LineString
            coords = [[n['lon'], [n['lat']] for n in element['geometry']]
            
            feature = {
                'type': 'Feature',
                'properties': {
                    'osm_id': element.get('id'),
                    'name': element.get('tags', {}).get('name', ''),
                    'highway': element.get('tags', {}).get('highway', ''),
                    'surface': element.get('tags', {}).get('surface', ''),
                    'oneway': element.get('tags', {}).get('oneway', ''),
                    'lanes': element.get('tags', {}).get('lanes', ''),
                    'maxspeed': element.get('tags', {}).get('maxspeed', ''),
                    'ref': element.get('tags', {}).get('ref', '')
                },
                'geometry': {
                    'type': 'LineString',
                    'coordinates': coords
                },
                'length': 0  # Se calcula después
            }
            
            # Calcular longitud aproximada (en metros)
            length = self.calcular_longitud(feature['geometry']['coordinates'])
            feature['length'] = length
            feature['properties']['longitud_m'] = length
            
            features.append(feature)
        
        return {'type': 'FeatureCollection', 'features': features}
    
    def calcular_longitud(self, coords):
        """Calcula longitud aproximada en metros usando Haversine."""
        if len(coords) < 2:
            return 0
        
        total = 0
        for i in range(len(coords) - 1):
            lat1, lon1 = coords[i]
            lat2, lon2 = coords[i + 1]
            
            # Haversine simplificado
            R = 6371000  # Radio terrestre en metros
            dlat = math.radians(lat2 - lat1)
            dlon = math.radians(lon2 - lon1)
            a = (
                math.sin(dlat / 2) ** 2 +
                math.cos(math.radians(lat1)) *
                math.cos(math.radians(lat2)) *
                math.sin(dlon / 2) ** 2
            )
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            total += R * c
        
        return round(total, 1)
    
    def procesar_calles(self, geojson, feedback):
        """Procesa y limpia datos de calles."""
        features = geojson.get('features', [])
        
        procesadas = []
        for feat in features:
            props = feat.get('properties', {})
            
            # Filtrar: solo con nombre o que sean vías importantes
            nombre = props.get('name', '')
            highway = props.get('highway', '')
            
            # Ignorar ways sin nombre (excepto principales)
            if not nombre and highway in ['service', 'unclassified']:
                continue
            
            # Limpiar nombre
            if not nombre:
                nombre = f'{highway.title()} sin nombre'
            
            feat['properties']['name'] = nombre
            procesadas.append(feat)
        
        return procesadas
    
    def name(self):
        return 'calles_chajari_download'
    
    def displayName(self):
        return 'Calles Chajarí: Descargar y Exportar'
    
    def group(self):
        return 'Chajarí GIS'
    
    def groupId(self):
        return 'chajari_gis'
    
    def shortHelpString(self):
        return """
DESCARGA Y PROCESA CALLES DE CHAJARÍ DESDE OPENSTREETMAP

Este script descarga las calles de Chajarí desde OpenStreetMap via Overpass API,
las procesa y exporta a GeoJSON listo para importar al sistema GIS.

PASOS:
1. Seleccionar carpeta de salida
2. Hacer clic en "Run"
3. Abrir el GeoJSON en QGIS para revisión
4. Editar nombres si es necesario
5. Usar el importador del sistema

NOTAS:
- Descarga todas las calles dentro del bounding box de Chajarí
- Incluye: residenciales, avenidas, colectoras, etc.
- Calcula longitud aproximada de cada tramo
- Exporta con campos listos para Supabase (fid, nombre, tipo, categoria)
        """
    
    def createInstance(self):
        return CallesChajariAlgorithm()


# Registrar el algoritmo
algori