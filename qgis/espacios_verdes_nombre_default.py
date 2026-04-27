"""
ESPACIOS VERDES - Asignar nombre por defecto a NULL
Capa: espacios_verdes_pl_muni en MUNI.gpkg
"""

from qgis.core import edit, NULL

def asignar_nombre():
    ruta = r'D:\ALE-GIS-DEV\MUNI.gpkg'
    capa = 'espacios_verdes_pl_muni'
    campo = 'nombre'
    
    # Cargar capa
    layer = iface.addVectorLayer(ruta + f'|layername={capa}', capa, 'ogr')
    
    if not layer:
        print('ERROR: No se cargo la capa')
        return
    
    provider = layer.dataProvider()
    idx = provider.fields().indexFromName(campo)
    
    if idx == -1:
        print(f'ERROR: No existe campo {campo}')
        return
    
    total = 0
    nulos = 0
    
    with edit(layer):
        for feat in layer.getFeatures():
            total += 1
            valor = feat[campo]
            if valor is NULL or valor is None or (isinstance(valor, str) and not valor.strip()):
                nulos += 1
                feat[campo] = 'Sin nombre'
                layer.updateFeature(feat)
    
    print('=' * 40)
    print(f'Total features: {total}')
    print(f'Actualizados: {nulos}')
    print('OK' if nulos > 0 else 'Sin cambios')

asignar_nombre()