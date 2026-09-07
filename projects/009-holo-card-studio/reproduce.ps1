param([string]$Blender = '')
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$repoRoot = (Resolve-Path (Join-Path $projectRoot '../..')).Path
$demoRoot = Join-Path $repoRoot 'docs/demos/009-holo-card-studio'
$buildRoot = Join-Path $repoRoot 'tmp/holo-build'
New-Item -ItemType Directory -Force (Join-Path $buildRoot 'assets') | Out-Null
Copy-Item -LiteralPath (Join-Path $projectRoot 'card-config.json') -Destination (Join-Path $buildRoot 'card-config.json')
foreach ($name in @('subject.png','background.png','lineart.png','text.png')) {
    Copy-Item -LiteralPath (Join-Path $demoRoot "assets/$name") -Destination (Join-Path $buildRoot "assets/$name")
}
$pipelineArgs = @((Join-Path $projectRoot 'upstream/scripts/run_pipeline.py'), '--project', $buildRoot, '--skip-npm')
if ($Blender) { $pipelineArgs += @('--blender', $Blender) }
& python @pipelineArgs
if ($LASTEXITCODE -ne 0) { throw 'Blender pipeline failed. Check dependencies and official download access.' }
foreach ($pair in @(@('card.blend','card.blend'),@('web/assets/card.glb','card.glb'),@('renders/hero.png','blender-render.png'))) {
    Copy-Item -LiteralPath (Join-Path $buildRoot $pair[0]) -Destination (Join-Path $demoRoot "assets/$($pair[1])")
}
Copy-Item -LiteralPath (Join-Path $projectRoot 'card-config.json') -Destination (Join-Path $demoRoot 'card-config.json')
Copy-Item -LiteralPath (Join-Path $buildRoot 'verification.json') -Destination (Join-Path $projectRoot 'blender-verification.json')
Copy-Item -LiteralPath (Join-Path $buildRoot 'asset-validation.json') -Destination (Join-Path $projectRoot 'asset-validation.json')
Write-Output 'Blender artifacts refreshed. Rebuild the browser bundle separately if its source changed.'
