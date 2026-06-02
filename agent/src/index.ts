/**
 * Agent canli dongusu (demo): dis kaynaktan guncel kuru cek -> on-chain oracle'a yaz ->
 * oracle'dan oku -> FX-zamanlama karari -> bounded agent_pay.
 *
 * Calistir: agent/ dizininde `node --env-file=.env src/index.ts`
 */
import { Keypair } from "@stellar/stellar-sdk";
import { readUsdTry, agentPay, pushRate } from "./stellarClient.ts";
import { decideConversion } from "./strategy.ts";
import { fetchLiveUsdTry } from "./backtest/fetchRates.ts";
import deployed from "../../demo/deployed.json" with { type: "json" };

const agentSecret = process.env.AGENT_SECRET;
const adminSecret = process.env.ALICE_SECRET;
if (!agentSecret || !adminSecret) {
  throw new Error("AGENT_SECRET ve ALICE_SECRET gerekli. Calistir: node --env-file=.env src/index.ts");
}
const agent = Keypair.fromSecret(agentSecret);
const admin = Keypair.fromSecret(adminSecret);
const { oracle, treasury } = deployed.contracts;
const { supplier } = deployed.accounts;

// 0) FEEDER: dis dunyadan guncel kuru cek -> on-chain oracle'a yaz (admin imzasi)
const liveRate = await fetchLiveUsdTry();
console.log(`[feeder] frankfurter USDTRY = ${liveRate} -> oracle'a yaziliyor...`);
await pushRate(oracle, admin, "TRY", liveRate);
console.log(`[feeder] on-chain oracle guncellendi`);

// 1) Agent ON-CHAIN oracle'dan okur (artik canli, statik degil)
const rate = await readUsdTry(oracle, agent.publicKey());
console.log(`[oracle] on-chain USDTRY = ${rate}`);

// 2) FX-zamanlama karari (ornek: vadeye 10 gun, 15 gunluk pencere)
const decision = decideConversion({
  daysToDeadline: 10,
  windowDays: 15,
  currentRate: rate,
  recentMin: rate,
  alreadyConverted: false,
});
console.log(`[strateji] ${decision.action.toUpperCase()} - ${decision.reason}`);

// 3) Bounded odeme (1000 USDC) - canli agent_pay
const amount = 1000n * 10n ** 7n;
console.log(`[agent_pay] 1000 USDC -> supplier (${supplier.slice(0, 6)}...) gonderiliyor...`);
const hash = await agentPay(treasury, agent, supplier, amount);
console.log(`[agent_pay] OK -> https://stellar.expert/explorer/testnet/tx/${hash}`);
