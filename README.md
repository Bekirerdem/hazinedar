# Hazinedar — Autonomous Treasurer for SMEs

> An autonomous treasury agent on **Stellar/Soroban** for import-driven Turkish SMEs.
> It shields idle TRY from inflation, times FX conversions, and pays cross-border suppliers
> without bank spreads — **without ever touching the money.** Funds stay in the business's
> own non-custodial smart contract; the agent can only act within owner-defined rules.

**Hackathon:** Build On Stellar — IBW 2026 · **Tracks:** Main + Hack Agentic

---

## The Problem

An import-driven Turkish SME bleeds money in two places:
1. **Idle TRY erodes** under ~%32 annual inflation (~%2.3/month).
2. **Cross-border supplier payments** lose %2-4 to bank FX spreads + wire fees + days of delay.

A typical mid-sized importer can lose **$90K–190K/year**. Professional treasury management is today a luxury only large corporations can afford.

## The Solution

Hazinedar gives the business an **autonomous treasurer**:
- Converts idle TRY to USDC early to shield against inflation/devaluation.
- Reads the live USDTRY rate from an on-chain oracle and times the conversion within the payment window.
- Pays the supplier over Stellar (path-payment + anchor) at sub-cent cost instead of %2-4 bank spread.

**The money never leaves the business's own contract.** A `policy` (daily limit + supplier whitelist) is enforced *by the contract itself* — the agent cannot pay outside it, and the owner can withdraw anytime. Trust is in the code, not in us.

## Architecture

```
 frankfurter (live USDTRY)
        │  (admin-signed feeder)
        ▼
 ┌─────────────┐      reads      ┌──────────────────────────┐
 │  oracle     │◄────────────────│  agent (off-chain, TS)   │
 │ (SEP-40)    │                 │  FX-timing decision      │
 └─────────────┘                 └────────────┬─────────────┘
                                  agent_pay (policy-bounded) │
                                               ▼
                       ┌───────────────────────────────────┐
                       │  treasury (non-custodial Soroban)  │
                       │  USDC held here · policy enforced  │
                       │  agent bounded · owner withdraws   │
                       └───────────────────────────────────┘
```

- **`contracts/oracle`** — SEP-40 price oracle (USDTRY feed; production-swappable with Reflector).
- **`contracts/treasury`** — non-custodial vault: `agent_pay` (whitelist + daily-limit enforced), `withdraw` (owner), `set_policy` (owner).
- **`agent/`** — off-chain TypeScript: FX-timing strategy, backtest harness, live SDK loop (feeder → read → decide → pay).
- **`packages/`** — generated TypeScript contract bindings for the frontend.

## Hack Agentic — track requirements

1. **Autonomous actions:** the agent reads the on-chain rate, decides when to convert (FX-timing within the payment window), and executes the supplier payment — no per-transaction human approval.
2. **Safeguards:** every agent action is bounded by an on-chain `policy` (daily spend limit + supplier whitelist) enforced by the contract; the owner can withdraw at any time. The demo shows the contract *rejecting* an out-of-policy payment live.
3. **Why Stellar:** anchor network (last-mile cash-out to banks), native path-payment FX, and sub-cent fees make machine-speed cross-border treasury economical.

## Live on testnet

| Contract | ID |
|---|---|
| oracle | `CDLKJYWDJZU65LUHUUUICO2SY3R3OCSBITIABVIC5GGUZQDNU3T4FF2S` |
| treasury | `CB4I5MZ3KT2O5P6H32VTBV35KQZFASOQOXQBE4BLSN2DUPZ2WUCHC4AX` |
| test USDC (SAC) | `CDCEHPK4OJXVRA4JV7N56GR5SRD5KGGZ55BDSHKODGR72Y4KGS6A3Y2W` |

## Proof — backtest on real data

The FX-timing strategy was backtested on **real 1-year USD/TRY** data (frankfurter/ECB), 12 monthly payments of $60K:
**1,199,844 TL (%3.79) saved** vs. naive same-day bank conversion = 892K TL spread savings + 307K TL timing.
Honest bound (also tested): when TRY strengthens, timing can lose — but the spread saving is always positive.

## Getting started

```bash
# Contracts
stellar contract build
cargo test --manifest-path Cargo.toml   # 9 contract tests

# Agent (Node 24 — native TS)
cd agent && npm install
node --test                              # strategy + backtest tests
node src/backtest/run.ts                 # real-data backtest -> backtest-report.json
node --env-file=.env src/demo.ts         # end-to-end jury demo (needs AGENT_SECRET + ALICE_SECRET)

# Frontend
npm install && npm run dev

# Generate contract bindings (if packages/ is empty)
stellar contract bindings typescript --network testnet --contract-id <id> --output-dir packages/<name>
```

Full setup script: `demo/deploy.ps1`. Deployed addresses: `demo/deployed.json`.

## Tech stack

Soroban (Rust, soroban-sdk 23.5) · `@stellar/stellar-sdk` v15 · scaffold-stellar (React + Vite + TS) · Reflector-compatible SEP-40 oracle · USDC (Circle testnet) · Node 24 native TS.

## What's real vs. mocked (honest scope)

- ✅ **Real (testnet):** oracle, treasury + policy enforcement, agent_pay, live FX feeder, backtest.
- 🟡 **Mocked:** bank anchor cash-out (SEP-31 — partnership-heavy), on-chain TL→USDC swap liquidity, multi-tenant orchestration.

See `demo/production-roadmap.md` for the path to production + unit economics, and `demo/pitch-qa.md` for the pitch and judge Q&A.
