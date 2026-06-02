/**
 * Backtest simulasyonu (saf fonksiyon).
 *
 * Agent FX-zamanlama stratejisini, naive baseline'a (her odemeyi vade gunu banka
 * makasiyla cevirmek) karsi tarihsel USDTRY serisi uzerinde test eder.
 *
 * Kazanc UC bilesene ayrisir (matematiksel olarak TAM ayrisir, capraz terim yok):
 *   - spreadSavingTRY : banka makasi (%2-4) yerine stablecoin rayi (~%0.1) -> her zaman pozitif
 *   - timingGainTRY   : agent'in vade penceresinde erken/dip cevirmesi -> kalkan + alfa
 *   - totalSavingTRY  = spreadSavingTRY + timingGainTRY
 */
import { decideConversion } from "../strategy.ts";

export type Invoice = { dueIndex: number; amountUSD: number };

export type BacktestConfig = {
  windowDays: number;
  bankSpreadBps: number; // banka doviz makasi (ornek 300 = %3)
  railSpreadBps: number; // stablecoin rayi makasi (ornek 10 = %0.1)
};

export type PaymentDetail = {
  dueIndex: number;
  agentIndex: number;
  naiveRate: number;
  agentRate: number;
  amountUSD: number;
};

export type BacktestResult = {
  naiveCostTRY: number;
  agentCostTRY: number;
  spreadSavingTRY: number;
  timingGainTRY: number;
  totalSavingTRY: number;
  savingPct: number;
  payments: PaymentDetail[];
};

export function simulate(
  rates: number[],
  invoices: Invoice[],
  cfg: BacktestConfig,
): BacktestResult {
  const bankMul = 1 + cfg.bankSpreadBps / 10_000;
  const railMul = 1 + cfg.railSpreadBps / 10_000;

  let naiveCost = 0;
  let agentCost = 0;
  let spreadSaving = 0;
  let timingGain = 0;
  const payments: PaymentDetail[] = [];

  for (const inv of invoices) {
    const due = inv.dueIndex;
    const start = Math.max(0, due - cfg.windowDays);

    // Agent stratejisi: pencere boyunca gun gun ilerle, ilk "convert" gununde cevir.
    let recentMin = Infinity;
    let agentIndex = due; // varsayilan: deadline garantisi
    for (let day = start; day <= due; day++) {
      const rate = rates[day];
      if (rate < recentMin) recentMin = rate;
      const decision = decideConversion({
        daysToDeadline: due - day,
        windowDays: cfg.windowDays,
        currentRate: rate,
        recentMin,
        alreadyConverted: false,
      });
      if (decision.action === "convert") {
        agentIndex = day;
        break;
      }
    }

    const naiveRate = rates[due];
    const agentRate = rates[agentIndex];

    naiveCost += inv.amountUSD * naiveRate * bankMul;
    agentCost += inv.amountUSD * agentRate * railMul;
    spreadSaving += (inv.amountUSD * naiveRate * (cfg.bankSpreadBps - cfg.railSpreadBps)) / 10_000;
    timingGain += inv.amountUSD * (naiveRate - agentRate) * railMul;

    payments.push({ dueIndex: due, agentIndex, naiveRate, agentRate, amountUSD: inv.amountUSD });
  }

  const totalSaving = naiveCost - agentCost;
  return {
    naiveCostTRY: naiveCost,
    agentCostTRY: agentCost,
    spreadSavingTRY: spreadSaving,
    timingGainTRY: timingGain,
    totalSavingTRY: totalSaving,
    savingPct: naiveCost > 0 ? (totalSaving / naiveCost) * 100 : 0,
    payments,
  };
}
