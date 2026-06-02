# Hazinedar — testnet kurulum (tekrarlanabilir).
# Tum adimlar 2026-06-01/02'de manuel dogrulandi; bu script onlari tek komutta toplar.
# DIKKAT: calistirmak YENI kontratlar deploy eder -> demo/deployed.json adresleri DEGISIR
#         (frontend packages/ binding'leri ve agent yeni adreslere gore guncellenmeli).
# Onkosul: `alice` identity testnet'te fonlu (stellar keys generate alice --network testnet --fund).

$ErrorActionPreference = "Stop"
$root = "C:\Users\l3eki\Desktop\hazinedar"
$net = "testnet"

Write-Output "1) Anahtarlar (agent, supplier) - yoksa olustur + fonla"
foreach ($k in @("agent", "supplier")) {
  try { stellar keys address $k | Out-Null } catch { stellar keys generate $k --network $net --fund }
}
$owner = stellar keys address alice
$agent = stellar keys address agent
$supplier = stellar keys address supplier

Write-Output "2) Kontratlari derle (release wasm)"
stellar contract build --manifest-path "$root\Cargo.toml"

Write-Output "3) Oracle deploy (admin = owner)"
$oracle = stellar contract deploy --wasm "$root\target\wasm32v1-none\release\oracle.wasm" --source alice --network $net -- --admin $owner

Write-Output "4) Test USDC (SAC) deploy (issuer = owner)"
$usdc = stellar contract asset deploy --asset "USDC:$owner" --source alice --network $net

Write-Output "5) Treasury deploy (owner/agent/usdc/policy)"
$policy = '{"daily_limit":"1000000000000","whitelist":["' + $supplier + '"],"max_slippage_bps":200}'
[System.IO.File]::WriteAllText("$root\demo\policy.json", $policy)
$treasury = stellar contract deploy --wasm "$root\target\wasm32v1-none\release\treasury.wasm" --source alice --network $net -- --owner $owner --agent $agent --usdc $usdc --policy-file-path "$root\demo\policy.json"

Write-Output "6) Seed: USDTRY kuru + 500K USDC mint + supplier trustline"
[System.IO.File]::WriteAllText("$root\demo\asset_try.json", '{"Other":"TRY"}')
stellar contract invoke --id $oracle --source alice --network $net -- set_price --asset-file-path "$root\demo\asset_try.json" --price 3350000000000000
stellar contract invoke --id $usdc --source alice --network $net -- mint --to $treasury --amount 5000000000000
stellar tx new change-trust --source supplier --line "USDC:$owner" --network $net

Write-Output "7) demo/deployed.json guncelle"
$deployed = [ordered]@{
  network   = $net
  rpc       = "https://soroban-testnet.stellar.org"
  contracts = [ordered]@{ oracle = $oracle; usdc = $usdc; treasury = $treasury }
  accounts  = [ordered]@{ owner = $owner; agent = $agent; supplier = $supplier }
} | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText("$root\demo\deployed.json", $deployed)

Write-Output ""
Write-Output "KURULUM TAMAM:"
Write-Output "  oracle   = $oracle"
Write-Output "  usdc     = $usdc"
Write-Output "  treasury = $treasury"
