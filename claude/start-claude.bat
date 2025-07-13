@ECHO off
GOTO start
:find_dp0
SET dp0=%~dp0
EXIT /b
:start
SETLOCAL

:: RAM Optimization - 8GB allocation
SET NODE_OPTIONS=--max-old-space-size=8192 --max-semi-space-size=1024

:: CPU Optimization - More threads for processing
SET UV_THREADPOOL_SIZE=16

:: Processing Time Optimization - Unlimited timeouts
SET HTTP_TIMEOUT=0
SET HTTPS_TIMEOUT=0
SET REQUEST_TIMEOUT=0

:: Performance Environment
SET NODE_ENV=production

CALL :find_dp0
IF EXIST "%dp0%\node.exe" (
  SET "_prog=%dp0%\node.exe"
) ELSE (
  SET "_prog=node"
  SET PATHEXT=%PATHEXT:;.JS;=;%
)
endLocal & goto #_undefined_# 2>NUL || title KhoAugment POS - Claude CLI [OPTIMIZED] & "%_prog%" "%dp0%\node_modules\@anthropic-ai\claude-code\cli.js" --dangerously-skip-permissions %*