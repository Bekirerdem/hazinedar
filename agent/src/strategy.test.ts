import { test } from "node:test";
import assert from "node:assert/strict";
import { decideConversion } from "./strategy.ts";

test("vade penceresi acilmadan once bekler", () => {
  const d = decideConversion({
    daysToDeadline: 20,
    windowDays: 15,
    currentRate: 33,
    recentMin: 33,
    alreadyConverted: false,
  });
  assert.equal(d.action, "hold");
});

test("zaten cevrildiyse bekler", () => {
  const d = decideConversion({
    daysToDeadline: 5,
    windowDays: 15,
    currentRate: 30,
    recentMin: 30,
    alreadyConverted: true,
  });
  assert.equal(d.action, "hold");
});

test("vade gununde mutlaka cevirir (deadline garantisi)", () => {
  const d = decideConversion({
    daysToDeadline: 0,
    windowDays: 15,
    currentRate: 40, // kotu kur olsa bile
    recentMin: 32,
    alreadyConverted: false,
  });
  assert.equal(d.action, "convert");
});

test("pencere icinde dip yakalaninca cevirir", () => {
  const d = decideConversion({
    daysToDeadline: 10,
    windowDays: 15,
    currentRate: 32, // recentMin'e esit = dip
    recentMin: 32,
    alreadyConverted: false,
  });
  assert.equal(d.action, "convert");
});

test("dip degilse daha iyi kur bekler", () => {
  const d = decideConversion({
    daysToDeadline: 10,
    windowDays: 15,
    currentRate: 34, // dipten yuksek
    recentMin: 32,
    alreadyConverted: false,
  });
  assert.equal(d.action, "hold");
});
