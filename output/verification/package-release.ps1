$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$verification = Join-Path $taskRoot 'output/verification'
$unit = Get-Content -LiteralPath (Join-Path $verification 'final-unit.json') -Raw | ConvertFrom-Json
$e2e = Get-Content -LiteralPath (Join-Path $verification 'final-e2e.json') -Raw | ConvertFrom-Json
$audit = Get-Content -LiteralPath (Join-Path $verification 'acceptance-audit.json') -Raw | ConvertFrom-Json
$provenance = Get-Content -LiteralPath (Join-Path $verification 'asset-provenance.json') -Raw | ConvertFrom-Json
if (-not $unit.success -or $unit.numFailedTests -ne 0 -or $e2e.stats.unexpected -ne 0 -or $e2e.stats.flaky -ne 0 -or $e2e.stats.skipped -ne 0 -or $e2e.stats.expected -lt 35) { throw 'Final tests have not passed; release packaging stopped.' }
if ($audit.entries.Count -ne 67 -or @($provenance.assets | Where-Object { -not $_.sourceMatches }).Count) { throw 'Acceptance or asset manifest is incomplete.' }
$dist = Join-Path $taskRoot 'dist'
$latestSource = Get-ChildItem -LiteralPath (Join-Path $taskRoot 'src') -Recurse -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($latestSource.LastWriteTime -gt (Get-Item -LiteralPath (Join-Path $dist 'index.html')).LastWriteTime) { throw 'Source changed after build; rebuild before packaging.' }
$buildFiles = @(Get-ChildItem -LiteralPath $dist -Recurse -File | Sort-Object FullName | ForEach-Object { [ordered]@{file=[IO.Path]::GetRelativePath($dist,$_.FullName).Replace('\','/');bytes=$_.Length;sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash} })
$buildFiles | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $verification 'build-manifest.json') -Encoding utf8
$report = [ordered]@{
  schemaVersion=1;candidate='sky-sprout-music-local-2026-10-17';createdAt=(Get-Date).ToString('o');packageVersion='0.1.0';publication='local only'
  design='스카이러너_음악이론_재즈화성학_VIBE코딩_프롬프트팩_v1.0.md';separateV2Design='not present in provided workspace';gitRepository=$false
  content=@{catalogModules=76;playableModules=74;activities=103;deferredModules=@('X07','X08');review='Scoped examples, not complete expert-reviewed courses'}
  verification=@{unit=@{passed=$unit.numPassedTests;failed=$unit.numFailedTests;report='final-unit.json'};e2e=$e2e.stats;e2eReport='final-e2e.json';build='npm run build: passed';lint='npm run lint: passed; reference art/demo and generated artifacts excluded';acceptance=$audit.summary;acceptanceReport='acceptance-audit.json';assets=@{count=$provenance.assets.Count;allSourceHashesMatch=$true};packageSmoke='Loopback Node server HTML and PNG HTTP200 with correct MIME; production C completed by real DOM inputs; no browser errors observed'}
  defaults=@{solfege='fixed_do';mode='guided';sound='explicit gesture only';safeInput='available';musicReward='1 per stable activity/profile/reward epoch';storage='browser-local, last200 attempts';externalApi='none'}
  limitations=@('Actual iOS/Android, assistive technology and acoustic latency are not certified.','Advanced jazz and creative examples need expert and learner review.','Active Story HP/position/checkpoint/timer restoration across music-room entry is not implemented; music runs from a separate menu route.','X07 hardware input and X08 culture-specific professional material are deferred.','Long-term low-end-device p95/p99 and all movement combinations are not verified.','Rights for public redistribution of user-provided art are not independently established.')
  rollback=@{featureOff='/?music=off or VITE_MUSIC_ENABLED=false';sourceBaseline='output/baseline';policy='Export music records and levels first; restore only this task changes after comparison; do not clear all localStorage; keep music JSON before older-app resave.'}
  evidence=@('change-manifest.json','asset-provenance.json','build-manifest.json','final-unit.json','final-e2e.json','acceptance-audit.json')
}
$report | ConvertTo-Json -Depth 9 | Set-Content -LiteralPath (Join-Path $verification 'release-report.json') -Encoding utf8
$release = Join-Path $taskRoot 'output/release'
$payload = Join-Path $release ('candidate-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $payload | Out-Null
Copy-Item -LiteralPath $dist -Destination $payload -Recurse
Copy-Item -LiteralPath (Join-Path $taskRoot 'README.md'),(Join-Path $release 'serve.mjs'),(Join-Path $release 'START.txt') -Destination $payload
$proof = Join-Path $payload 'output/verification'
New-Item -ItemType Directory -Path $proof -Force | Out-Null
foreach ($name in @('release-report.json') + $report.evidence) { Copy-Item -LiteralPath (Join-Path $verification $name) -Destination $proof }
$licenses = Join-Path $payload 'licenses'
New-Item -ItemType Directory -Path $licenses | Out-Null
foreach ($name in @('react','react-dom','phaser')) { $licenseName = if ($name -eq 'phaser') { 'LICENSE.md' } else { 'LICENSE' }; Copy-Item -LiteralPath (Join-Path $taskRoot "node_modules/$name/$licenseName") -Destination (Join-Path $licenses "$name-LICENSE.txt") }
$zip = Join-Path $release 'sky-sprout-music-local.zip'
Compress-Archive -LiteralPath @(Get-ChildItem -LiteralPath $payload | ForEach-Object FullName) -DestinationPath $zip -CompressionLevel Optimal -Force
[ordered]@{zip=$zip;bytes=(Get-Item -LiteralPath $zip).Length;sha256=(Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash;payload=$payload;unitPassed=$unit.numPassedTests;e2ePassed=$e2e.stats.expected} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $verification 'package-manifest.json') -Encoding utf8
Get-Content -LiteralPath (Join-Path $verification 'package-manifest.json')
