param(
    [string]$InputFile = "docs/calles_segmentadas.geojson",
    [string]$OutputFile = "docs/calles_segmentadas.geojson",
    [int]$Precision = 5
)

Write-Host "Cargando GeoJSON..." -ForegroundColor Cyan
$geojson = Get-Content $InputFile -Encoding UTF8 -Raw | ConvertFrom-Json
$features = $geojson.features
Write-Host "  $($features.Count) segmentos cargados" -ForegroundColor Gray

# Paso 1: construir índice de calles por punto (coordenada redondeada)
Write-Host "Construyendo índice espacial..." -ForegroundColor Cyan
$pointIndex = @{}  # "lon,lat" -> hashtable de nombres de calle

foreach ($feat in $features) {
    $calle = $feat.properties.name
    $coords = $feat.geometry.coordinates

    # Normalizar a array de coordenadas (LineString directo)
    $pts = @()
    if ($coords[0] -is [array]) {
        if ($coords[0][0] -is [array]) {
            # MultiLineString
            $pts = $coords[0]
        } else {
            # LineString
            $pts = $coords
        }
    }

    foreach ($c in $pts) {
        $key = "{0:N$Precision},{1:N$Precision}" -f [double]$c[0], [double]$c[1]
        if (-not $pointIndex.ContainsKey($key)) {
            $pointIndex[$key] = @{}
        }
        $pointIndex[$key][$calle] = $true
    }
}

Write-Host "  $($pointIndex.Count) puntos únicos indexados" -ForegroundColor Gray

# Paso 2: asignar entre_calle_1/2 a cada segmento
Write-Host "Asignando entre calles..." -ForegroundColor Cyan
$asignados = 0
$sinAsignar = 0

for ($i = 0; $i -lt $features.Count; $i++) {
    $feat = $features[$i]
    $calle = $feat.properties.name
    $coords = $feat.geometry.coordinates

    $pts = @()
    if ($coords[0] -is [array]) {
        if ($coords[0][0] -is [array]) {
            $pts = $coords[0]
        } else {
            $pts = $coords
        }
    }

    if ($pts.Count -lt 2) {
        $sinAsignar++
        continue
    }

    # Punto inicial y final
    $startKey = "{0:N$Precision},{1:N$Precision}" -f [double]$pts[0][0], [double]$pts[0][1]
    $endKey   = "{0:N$Precision},{1:N$Precision}" -f [double]$pts[-1][0], [double]$pts[-1][1]

    function Get-OtherStreets($key, $currentCalle) {
        if (-not $pointIndex.ContainsKey($key)) { return @() }
        $streets = $pointIndex[$key].Keys | Where-Object { $_ -ne $currentCalle } | Sort-Object
        return @($streets)
    }

    $e1 = Get-OtherStreets $startKey $calle
    $e2 = Get-OtherStreets $endKey $calle

    # Asignar (tomar el primero si hay varios)
    $feat.properties.entre_calle_1 = if ($e1.Count -gt 0) { $e1[0] } else { "" }
    $feat.properties.entre_calle_2 = if ($e2.Count -gt 0) { $e2[0] } else { "" }

    if ($e1.Count -gt 0 -or $e2.Count -gt 0) {
        $asignados++
    } else {
        $sinAsignar++
    }
}

Write-Host "  Segmentos con entrecalles: $asignados" -ForegroundColor Green
Write-Host "  Segmentos sin entrecalles: $sinAsignar" -ForegroundColor Yellow

# Paso 3: guardar
Write-Host "Guardando GeoJSON..." -ForegroundColor Cyan
# ConvertTo-Json with -Depth 100 to preserve geometry nesting
$geojsonJson = $geojson | ConvertTo-Json -Depth 100
# Fix PowerShell's decimal separator issue (uses comma in es-AR locale)
Set-Content $OutputFile -Value $geojsonJson -Encoding UTF8
Write-Host "  -> $OutputFile" -ForegroundColor Gray
Write-Host "[OK]" -ForegroundColor Green
