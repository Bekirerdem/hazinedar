/**
 * Juri-onu demo senaryosu (tek komut, uctan uca). Bursa tekstil ithalatcisi.
 * Calistir: agent/ dizininde `node --env-file=.env src/demo.ts`
 */
import { Keypair } from "@stellar/stellar-sdk";
import { readView, readUsdTry, pushRate, agentPay, ownerCall } from "./stellarClient.ts";
import { decideConversion } from "./strategy.ts";
import { fetchLiveUsdTry } from "./backtest/fetchRates.ts";
import deployed from "../../demo/deployed.json" with { type: "json" };
import report from "../backtest-report.json" with { type: "json" };

const agent = Keypair.fromSecret(process.env.AGENT_SECRET!);
const admin = Keypair.fromSecret(process.env.ALICE_SECRET!);
const { oracle, treasury } = deployed.contracts;
const { supplier, agent: agentPub } = deployed.accounts;

const USDC = 10n ** 7n;
const usd = (b: bigint) => (Number(b) / 1e7).toLocaleString("tr-TR", { maximumFractionDigits: 0 });
const tl = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 0 });

console.log("══════════════════════════════════════════════════");
console.log("  HAZINEDAR — Bursa tekstil ithalatcisi (canli demo)");
console.log("══════════════════════════════════════════════════\n");

// 0) Hazine durumu
const bal = (await readView(treasury, agentPub, "balance")) as bigint;
const spent = (await readView(treasury, agentPub, "spent_today")) as bigint;
console.log(`Hazine bakiyesi : ${usd(bal)} USDC`);
console.log(`Bugun harcanan  : ${usd(spent)} USDC  (gunluk limit kontrat tarafindan zorlaniyor)\n`);

// 1) Feeder: dis dunyadan guncel kuru cek -> on-chain oracle
const live = await fetchLiveUsdTry();
console.log(`[1] Guncel kur cekiliyor: USDTRY = ${live}`);
await pushRate(oracle, admin, "TRY", live);
const rate = await readUsdTry(oracle, agentPub);
console.log(`    On-chain oracle guncellendi -> ${rate}\n`);

// 2) Agent karari
const decision = decideConversion({
  daysToDeadline: 10,
  windowDays: 15,
  currentRate: rate,
  recentMin: rate,
  alreadyConverted: false,
});
console.log(`[2] Agent FX-zamanlama karari: ${decision.action.toUpperCase()} (${decision.reason})\n`);

// 3) Bounded odeme (whitelist + limit ICI -> basarili)
console.log(`[3] Tedarikciye 1000 USDC odeniyor (whitelist + limit ICINDE)...`);
const hash = await agentPay(treasury, agent, supplier, 1000n * USDC);
console.log(`    BASARILI -> https://stellar.expert/explorer/testnet/tx/${hash}\n`);

// 4) GUVENLIK 1: whitelist DISI birine odeme -> kontrat reddetmeli
const stranger = Keypair.random().publicKey();
console.log(`[4] GUVENLIK 1 (whitelist): agent whitelist-DISI bir adrese odeme deniyor...`);
try {
  await agentPay(treasury, agent, stranger, 1000n * USDC);
  console.log(`    !! BEKLENMEDIK: islem gecti (hata)`);
} catch {
  console.log(`    KONTRAT REDDETTI. Agent whitelist disina odeyemez.\n`);
}

// 5) GUVENLIK 2: owner acil durdurma (pause kill-switch) -> agent odeyemez -> unpause
console.log(`[5] GUVENLIK 2 (kill-switch): owner acil durdurma (pause)...`);
await ownerCall(treasury, admin, "pause");
try {
  await agentPay(treasury, agent, supplier, 1n * USDC);
  console.log(`    !! BEKLENMEDIK: paused iken odeme gecti`);
} catch {
  console.log(`    pause AKTIF -> agent odeyemiyor. Owner istedigi an durdurabilir/agent'i degistirebilir.`);
}
await ownerCall(treasury, admin, "unpause");
console.log(`    unpause -> normale dondu. "Guven bize degil, koda ait." (non-custodial)\n`);

// 6) Backtest ozeti (gercek 1 yil USD/TRY)
console.log(`[6] Backtest (gercek 1 yil USD/TRY, ${report.paymentCount} odeme):`);
console.log(`    Naive'e karsi tasarruf: ${tl(report.totalSavingTRY)} TL (%${report.savingPct.toFixed(2)})`);
console.log(`    = makas ${tl(report.spreadSavingTRY)} TL + zamanlama ${tl(report.timingGainTRY)} TL`);
console.log("\n══════════════════════════════════════════════════");
