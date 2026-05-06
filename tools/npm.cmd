@echo off
if "%1"=="config" if "%2"=="get" if "%3"=="registry" (
  echo https://registry.npmjs.org/
  exit /b 0
)

echo npm shim only supports "npm config get registry" 1>&2
exit /b 1
