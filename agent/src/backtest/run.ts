/**
 * Backtest'i gercek USD/TRY verisiyle calistirir ve raporu yazar.
 * Calistir: `npm run backtest` (agent/ dizininde) veya `node src/backtest/run.ts`.
 *
 * Senaryo: Bursa tekstil ithalatcisi, her ~21 is gununde bir tedarikciye 60.000 USD odeme.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchUsdTry, ratesOf } from "./fetchRates.ts";
import { simulate, type Invoice } from "./simulate.ts";

const START = "2025-06-02";
const END = "2026-05-29";
const PAYMENT_EVERY_DAYS = 21; // ~aylik (is gunu)
const AMOUNT_USD = 60_000;
const CFG = { windowDays: 15, bankSpreadBps: 300, railSpreadBps: 10 };

const points = await fetchUsdTry(START, END);
const rates = ratesOf(points);

const invoices: Invoice[] = [];
for (let i = PAYMENT_EVERY_DAYS; i < rates.length; i += PAYMENT_EVERY_DAYS) {
  invoices.push({ dueIndex: i, amountUSD: AMOUNT_USD });
}

const result = simulate(rates, invoices, CFG);

const fmt = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 0 });
console.log("=== HAZINEDAR BACKTEST (USD/TRY gercek veri) ===");
console.log(`Donem: ${points[0].date} -> ${points.at(-1)!.date} (${rates.length} gun)`);
console.log(`Odeme sayisi: ${invoices.length} x ${fmt(AMOUNT_USD)} USD`);
console.log(`Banka makasi: %${CFG.bankSpreadBps / 100} | Ray makasi: %${CFG.railSpreadBps / 100}`);
console.log("-----------------------------------------------");
console.log(`Naive maliyet : ${fmt(result.naiveCostTRY)} TL`);
console.log(`Agent maliyet : ${fmt(result.agentCostTRY)} TL`);
console.log(`Makas tasarrufu  : ${fmt(result.spreadSavingTRY)} TL`);
console.log(`Zamanlama kazanci: ${fmt(result.timingGainTRY)} TL`);
console.log(`TOPLAM TASARRUF  : ${fmt(result.totalSavingTRY)} TL (%${result.savingPct.toFixed(2)})`);

const outPath = join(import.meta.dirname, "..", "..", "backtest-report.json");
writeFileSync(
  outPath,
  JSON.stringify(
    {
      period: { start: points[0].date, end: points.at(-1)!.date, days: rates.length },
      config: CFG,
      paymentCount: invoices.length,
      amountUSDPerPayment: AMOUNT_USD,
      ...result,
    },
    null,
    2,
  ),
);
console.log(`\nRapor yazildi: ${outPath}`);
