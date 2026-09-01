# ============================================================
#  Inicia o Chrome (ou Edge) em modo debug para o snapgen-bridge.
#
#  Como usar:
#    1. Feche TODAS as janelas do Chrome / Edge que estiverem abertas
#    2. Rode: powershell -ExecutionPolicy Bypass -File start-chrome.ps1
#    3. Vai abrir uma nova janela do Chrome
#    4. Acesse https://snapgen.ai/app/video-gen/veo e faça login
#    5. Volte no terminal e rode: bun run snapgen:extract
# ============================================================

# Caminho do executável (troque para msedge.exe se preferir Edge).
$chromeExe = "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"

# Pasta do perfil dedicado (separado do seu Chrome pessoal).
$profileDir = "$env:USERPROFILE\.snapgen-bridge"

if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir | Out-Null
}

Write-Host "Iniciando Chrome em modo debug na porta 9222..."
Write-Host "Perfil dedicado: $profileDir"
Write-Host ""
Write-Host "Acesse https://snapgen.ai/app/video-gen/veo e faca login."
Write-Host "Feche esta janela para encerrar o Chrome."
Write-Host ""

& $chromeExe --remote-debugging-port=9222 --remote-allow-origins=* --user-data-dir="$profileDir"
