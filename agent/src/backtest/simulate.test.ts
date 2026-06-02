import { test } from "node:test";
import assert from "node:assert/strict";
import { simulate } from "./simulate.ts";

test("makas tasarrufu sabit kurda bile pozitif", () => {
  const rates = new Array(30).fill(33); // sabit USDTRY
  const r = simulate(rates, [{ dueIndex: 20, amountUSD: 100_000 }], {
    windowDays: 15,
    bankSpreadBps: 300,
    railSpreadBps: 10,
  });
  assert.ok(r.spreadSavingTRY > 0, "makas tasarrufu pozitif olmali");
});

test("toplam tasarruf = makas + zamanlama (tam ayrisma)", () => {
  const rates = Array.from({ length: 30 }, (_, i) => 33 + Math.sin(i) * 0.5);
  const r = simulate(
    rates,
    [
      { dueIndex: 25, amountUSD: 50_000 },
      { dueIndex: 18, amountUSD: 30_000 },
    ],
    { windowDays: 15, bankSpreadBps: 250, railSpreadBps: 10 },
  );
  assert.ok(Math.abs(r.spreadSavingTRY + r.timingGainTRY - r.totalSavingTRY) < 1e-3);
});

test("dusen TL'de (artan USDTRY) agent erken cevirip kazandirir", () => {
  // USDTRY 30 -> 44.5 (TL deger kaybediyor)
  const rates = Array.from({ length: 30 }, (_, i) => 30 + i * 0.5);
  const r = simulate(rates, [{ dueIndex: 20, amountUSD: 100_000 }], {
    windowDays: 15,
    bankSpreadBps: 300,
    railSpreadBps: 10,
  });
  assert.ok(r.timingGainTRY > 0, "erken cevirme kalkan kazanci saglamali");
});

test("TL guclenirken timing kaybedebilir AMA makas tasarrufu kosulsuz pozitif (durust sinir)", () => {
  // USDTRY 40 -> 25.5: TL guclenir. Agent erken cevirdigi icin timing NEGATIF olur.
  // Bu stratejinin durust siniri: tek-yonlu TL guclenmesinde zamanlama kaybi verir.
  const rates = Array.from({ length: 30 }, (_, i) => 40 - i * 0.5);
  const r = simulate(rates, [{ dueIndex: 20, amountUSD: 100_000 }], {
    windowDays: 15,
    bankSpreadBps: 300,
    railSpreadBps: 10,
  });
  assert.ok(r.timingGainTRY < 0, "TL guclenirken erken cevirme timing kaybi verir (beklenen sinir)");
  // Banka makasi yerine stablecoin rayi kullanmak HER ZAMAN kazandirir.
  assert.ok(r.spreadSavingTRY > 0, "makas tasarrufu kosulsuz pozitif");
});
