param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Arguments
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$runtimeNode = "C:\Users\it11ataniguchi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$scriptPath = Join-Path $root "scripts\register-system.mjs"

if (-not (Test-Path $runtimeNode)) {
  throw "Bundled node runtime was not found: $runtimeNode"
}

if (-not (Test-Path $scriptPath)) {
  throw "Register script was not found: $scriptPath"
}

& $runtimeNode $scriptPath @Arguments
