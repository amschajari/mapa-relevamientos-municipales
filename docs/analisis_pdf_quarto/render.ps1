$env:QUARTO_DENO = "C:\PROGRA~1\Quarto\bin\tools\x86_64\deno.exe"
& "C:\PROGRA~1\Quarto\bin\quarto.cmd" render "informe.qmd" --to typst
if ($?) {
    Write-Host "PDF generado exitosamente" -ForegroundColor Green
} else {
    Write-Host "Error en render" -ForegroundColor Red
}
