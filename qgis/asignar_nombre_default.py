"""
==============================================================
CALLES CHAJARÍ - Asignar nombre por defecto a NULL
==============================================================
Autor: Sistema GIS Chajarí
Fecha: Abril 2026

Descripción:
  Busca campos "nombre" con valor NULL o vacío
  en la capa activa y les asigna "Sin nombre"
  
用法 / Usage:
  1. Abrir QGIS con la capa de calles
  2. Processing Toolbox > Scripts > Asignar nombre default
  3. O ejecutar directamente desde Editor de Scripts
==============================================================
"""

from qgis.core import (
    edit,
    Qgis,
    QgisVectorLayer
)
from qgis.utils import iface

def asignar_nombre_default():
    """Asigna 'Sin nombre' a todos los campos vacíos o NULL."""
    
    # Obtener capa activa
    layer = iface.activeLayer()
    
    if not layer or not isinstance(layer, QgisVectorLayer):
        print('ERROR: Selecciona una capa vectorial activa')
        return
    
    if layer.geometryType() != Qgis.Line:
        print('AVISO: La capa no parece ser de calles (lineas)')
    
    # Campo nombre
    nombre_field = 'nombre'
    provider = layer.dataProvider()
    fields = provider.fields()
    
    # Buscar índice del campo nombre
    nombre_idx = fields.indexFromName(nombre_field)
    if nombre_idx == -1:
        print(f'ERROR: No existe campo "{nombre_field}"')
        return
    
    # Contadores
    total = 0
    null_count = 0
    empty_count = 0
    
    # Iniciar edición
    with edit(layer):
        for feat in layer.getFeatures():
            total += 1
            nombre_valor = feat[nombre_field]
            
            # Verificar si es NULL o vacío
            if nombre_valor is NULL or (nombre_valor and str(nombre_valor).strip() == ''):
                null_count += 1
                feat.setAttribute(nombre_idx, 'Sin nombre')
                layer.updateFeature(feat)
            elif nombre_valor is None:
                empty_count += 1
                feat.setAttribute(nombre_idx, 'Sin nombre')
                layer.updateFeature(feat)
    
    # Resumen
    print('=' * 50)
    print('ASIGNAR NOMBRE POR DEFECTO')
    print('=' * 50)
    print(f'Capa: {layer.name()}')
    print(f'Total features: {total}')
    print(f'Con NULL/vacio: {null_count + empty_count}')
    print(f'Actualizados: {null_count + empty_count}')
    print('')
    if null_count + empty_count > 0:
        print('OK: Proceso completado')
    else:
        print('INFO: No habia campos NULL o vacios')

# Ejecutar
asignar_nombre_default()