# Prompt para Agente: Reporte Automatizado de Alumbrado Público (Chajarí)

## Contexto del Proyecto

Estás trabajando en un proyecto de relevamiento de infraestructura urbana para la Municipalidad de Chajarí, Entre Ríos (aproximadamente 50.000 habitantes). El relevamiento se inició en marzo de 2026 y está centrado en el alumbrado público.

Los datos provienen del sistema Odoo de la municipalidad y están disponibles en formato CSV. El objetivo es crear reportes automatizados en formato PDF que permitan a las distintas áreas (alumbrado, CAV, gestión) tomar decisiones informadas sin tener que manipular datos crudos.

---

## Datos Disponibles

### CSV de Relevamiento (Columnas principales)

| Columna | Descripción |
|---|---|
| ID Luminaria | Identificador único |
| Sin Luz | Estado: True si está apagada |
| Tipo Luminaria | Ej: LED 150W |
| Dirección | Calle y número |
| Barrio | Barrio donde se encuentra |
| Estado de la base | "Sin base" / "Con base en buenas condiciones" / "Con base en malas condiciones" |
| Medidor | Número de medidor asociado |
| Created on | Fecha de creación del registro |
| Last Updated on | Fecha de última actualización |
| Tipo de Cableado | Aéreo / Subterráneo |
| Observación | Notas adicionales |

---

## Instrucciones de Procesamiento

### 1. Limpieza de Datos

- Manejar valores nulos y campos vacíos
- Normalizar nombres de calles y barrios
- Validar formato de fechas
- Identificar registros duplicados

### 2. Métricas a Calcular

**Por Barrio:**
- Total de luminarias relevadas
- Cantidad de luminarias con/sin base
- Estado de conservación (buenas condiciones vs malas condiciones)
- Cantidad de luminarias apagadas (Sin Luz = True)
- Distribución por tipo de luminaria
- Distribución por tipo de cableado

**Operativas:**
- Luminarias que requieren mantenimiento (apagadas, base dañada, base faltante)
- Zonas críticas identificadas (alta densidad de problemas)

---

## Especificaciones del Reporte (Quarto + Python)

### Formato de Salida

- **Tipo:** PDF (con opción de HTML interactivo)
- **Frecuencia:** Mensual (automatizable)
- **Herramientas:** Quarto con Python
- **Visualizaciones:** Matplotlib / Plotly

### Estructura del Reporte

#### Página 1: Resumen Ejecutivo
- KPIs principales:
  - Total de luminarias relevadas
  - Cantidad con/sin base
  - Luminarias apagadas
- Breve resumen cualitativo de hallazgos

#### Página 2: Estado de Conservación por Barrio
- Gráfico de barras: Cantidad de luminarias por barrio
- Gráfico de distribución: Estado de base
- Tabla resumen por barrio

#### Página 3: Luminarias Apagadas
- Cantidad de luminarias apagadas por barrio
- Zonas críticas identificadas

#### Página 4: Luminarias que Requieren Intervención
- Intervenciones requeridas (apagadas + bases con problema)

#### Página 5: Observaciones Cualitativas
- Patrones identificados
- Recomendaciones operativas

---

## Código de Referencia

### Carga y Preprocesamiento

```python
import pandas as pd
import numpy as np

# Cargar datos
df = pd.read_csv("relevamiento_alumbrado.csv")

# Limpieza básica
df["Estado de la base"] = df["Estado de la base"].fillna("Sin datos")
df["Sin Luz"] = df["Sin Luz"].fillna("Desconocido")
df["Barrio"] = df["Barrio"].fillna("Sin barrio")

# Conversión de fechas
df["Created on"] = pd.to_datetime(df["Created on"])
df["Last Updated on"] = pd.to_datetime(df["Last Updated on"])