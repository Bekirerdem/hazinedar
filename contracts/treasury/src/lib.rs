#![no_std]
//! Non-custodial isletme hazine kontrati.
//!
//! Isletmenin USDC'si bu kontratin kendi adresinde durur. Iki rol var:
//! - `owner` (isletme): tam yetki, fonlari her an cekebilir (`withdraw`), policy belirler.
//! - `agent` (otonom yazilim): SADECE policy sinirlari icinde odeme yapabilir
//!   (whitelist'teki tedarikciye + gunluk limit dahilinde). Policy disini cagiramaz;
//!   kontrat panic eder. Boylece "guven koda ait" (contract-as-trust) saglanir.
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Vec};

/// Agent'in uyacagi kurallar. Owner belirler.
#[contracttype]
#[derive(Clone)]
pub struct Policy {
    /// Agent'in tek gunde hareket ettirebilecegi azami tutar (USDC stroops).
    pub daily_limit: i128,
    /// Agent'in odeme yapabilecegi izinli alici adresleri (tedarikciler).
    pub whitelist: Vec<Address>,
    /// FX cevirmede izin verilen azami sapma (basis points). (convert asamasinda kullanilir)
    pub max_slippage_bps: u32,
}

#[contracttype]
pub enum DataKey {
    Owner,
    Agent,
    Usdc,
    Policy,
    /// Gun indeksine gore agent'in o gun harcadigi tutar.
    SpentDay(u64),
}

#[contract]
pub struct Treasury;

#[contractimpl]
impl Treasury {
    pub fn __constructor(env: &Env, owner: Address, agent: Address, usdc: Address, policy: Policy) {
        let s = env.storage().instance();
        s.set(&DataKey::Owner, &owner);
        s.set(&DataKey::Agent, &agent);
        s.set(&DataKey::Usdc, &usdc);
        s.set(&DataKey::Policy, &policy);
    }

    /// Owner policy'yi gunceller.
    pub fn set_policy(env: &Env, policy: Policy) {
        Self::owner(env).require_auth();
        env.storage().instance().set(&DataKey::Policy, &policy);
    }

    /// Agent, whitelist'teki bir tedarikciye gunluk limit dahilinde USDC oder.
    /// Policy disi her cagri panic eder (bounded agent garantisi).
    pub fn agent_pay(env: &Env, supplier: Address, amount: i128) {
        Self::agent(env).require_auth();
        if amount <= 0 {
            panic!("amount must be positive");
        }
        let policy = Self::policy(env);

        let mut whitelisted = false;
        for addr in policy.whitelist.iter() {
            if addr == supplier {
                whitelisted = true;
                break;
            }
        }
        if !whitelisted {
            panic!("supplier not whitelisted");
        }

        let day = env.ledger().timestamp() / 86_400;
        let spent = Self::spent_of(env, day);
        if spent + amount > policy.daily_limit {
            panic!("daily limit exceeded");
        }

        Self::usdc_client(env).transfer(&env.current_contract_address(), &supplier, &amount);
        env.storage()
            .persistent()
            .set(&DataKey::SpentDay(day), &(spent + amount));
    }

    /// Owner fonlari diledigi zaman ceker (non-custodial: para her an owner kontrolunde).
    pub fn withdraw(env: &Env, to: Address, amount: i128) {
        Self::owner(env).require_auth();
        Self::usdc_client(env).transfer(&env.current_contract_address(), &to, &amount);
    }

    /// Kontratin guncel USDC bakiyesi.
    pub fn balance(env: &Env) -> i128 {
        Self::usdc_client(env).balance(&env.current_contract_address())
    }

    /// Agent'in bugun harcadigi toplam.
    pub fn spent_today(env: &Env) -> i128 {
        Self::spent_of(env, env.ledger().timestamp() / 86_400)
    }

    pub fn policy(env: &Env) -> Policy {
        env.storage().instance().get(&DataKey::Policy).unwrap()
    }

    pub fn owner(env: &Env) -> Address {
        env.storage().instance().get(&DataKey::Owner).unwrap()
    }

    pub fn agent(env: &Env) -> Address {
        env.storage().instance().get(&DataKey::Agent).unwrap()
    }

    fn spent_of(env: &Env, day: u64) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::SpentDay(day))
            .unwrap_or(0)
    }

    fn usdc_client(env: &Env) -> token::TokenClient<'_> {
        let usdc: Address = env.storage().instance().get(&DataKey::Usdc).unwrap();
        token::TokenClient::new(env, &usdc)
    }
}

mod test;
