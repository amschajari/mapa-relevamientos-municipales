param(
    [Parameter(Mandatory = $true)]
    [string]$CsvNuevo,
    [string]$Fecha,
    [switch]$Publicar
)

$ErrorActionPreference = "Stop"

$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $dir

if (-not (Test-Path $CsvNuevo)) {
    Write-Host "ERROR: No existe $CsvNuevo en $dir" -ForegroundColor Red
    exit 1
}

if (-not $Fecha) {
    if ($CsvNuevo -match "datos_odoo_(\d{2})(\d{2})(\d{2})\.csv") {
        $Fecha = "$($matches[1])/$($matches[2])/20$($matches[3])"
    } else {
        Write-Host "ERROR: No puedo inferir la fecha del nombre. Pase -Fecha 'DD/MM/AAAA'" -ForegroundColor Red
        exit 1
    }
}

$qmd = "$dir\informe.qmd"
$contenido = Get-Content -LiteralPath $qmd -Raw -Encoding UTF8

$contenido = $contenido -replace 'CSV = "datos_odoo_\d+\.csv"', "CSV = `"$CsvNuevo`""
$contenido = $contenido -replace 'Informe al \d{2}/\d{2}/\d{4}', "Informe al $Fecha"

[System.IO.File]::WriteAllText($qmd, $contenido, [System.Text.UTF8Encoding]::new($false))
Write-Host "Actualizado informe.qmd -> CSV: $CsvNuevo | fecha: $Fecha" -ForegroundColor Green

$env:QUARTO_DENO = "C:\PROGRA~1\Quarto\bin\tools\x86_64\deno.exe"
& "C:\PROGRA~1\Quarto\bin\quarto.cmd" render "informe.qmd" --to typst
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR en render" -ForegroundColor Red
    exit 1
}

Write-Host "PDF generado: $dir\informe.pdf" -ForegroundColor Green

if ($Publicar) {
    git add "$($qmd)" "$($dir)\informe.pdf" "$($dir)\$($CsvNuevo)"
    git commit -m "Informe alumbrado: nuevo informe ($CsvNuevo, $Fecha)"
    git push
    Write-Host "Publicado en git" -ForegroundColor Green
}