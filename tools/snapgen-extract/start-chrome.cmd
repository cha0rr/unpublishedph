@echo off
REM ============================================================
REM  Inicia o Chrome (ou Edge) em modo debug para o snapgen-bridge.
REM
REM  Como usar:
REM    1. Feche TODAS as janelas do Chrome / Edge que estiverem abertas
REM    2. Dê duplo-clique neste arquivo (ou rode no CMD)
REM    3. Vai abrir uma nova janela do Chrome
REM    4. Acesse https://snapgen.ai/app/video-gen/veo e faça login
REM    5. Volte no terminal e rode: bun run snapgen:extract
REM
REM  Edge funciona igual — só edite a variável CHROME_EXE abaixo.
REM ============================================================

REM Caminho do executável (troque para msedge.exe se preferir Edge).
set "CHROME_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"

REM Pasta do perfil dedicado (separado do seu Chrome pessoal).
set "PROFILE_DIR=%USERPROFILE%\.snapgen-bridge"

REM Garante que o perfil existe (cria na primeira vez).
if not exist "%PROFILE_DIR%" mkdir "%PROFILE_DIR%"

echo Iniciando Chrome em modo debug na porta 9222...
echo Perfil dedicado: %PROFILE_DIR%
echo.
echo Acesse https://snapgen.ai/app/video-gen/veo e faca login.
echo Aperte Ctrl+C nesta janela para encerrar o Chrome.
echo.

start "" "%CHROME_EXE%" --remote-debugging-port=9222 --remote-allow-origins=* --user-data-dir="%PROFILE_DIR%"
