#![no_std]
//! SEP-40 uyumlu minimal fiyat oracle.
//!
//! Reflector testnet FX oracle'inda TRY bulunmadigi icin (2026-06-01 dogrulandi),
//! USDTRY kurunu admin (biz) besliyoruz. Arayuz SEP-40 ile ayni oldugu icin
//! production'da Reflector kontratina tek-satir gecis mumkun.
//!
//! Konvansiyon: `lastprice(Asset::Other("TRY"))` -> 1 USD'nin TRY karsiligi,
//! `decimals()` ile olceklenmis (orn. 33.50 kuru, 14 decimals => 33_50 * 10^12).
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

/// SEP-40 fiyat verisi: olceklenmis fiyat + ledger zaman damgasi.
#[contracttype]
#[derive(Clone)]
pub struct PriceData {
    pub price: i128,
    pub timestamp: u64,
}

/// SEP-40 varlik tanimi (Reflector ile ayni sekil).
#[contracttype]
#[derive(Clone)]
pub enum Asset {
    Stellar(Address),
    Other(Symbol),
}

const ADMIN: Symbol = symbol_short!("ADMIN");
const DECIMALS: u32 = 14;

#[contract]
pub struct Oracle;

#[contractimpl]
impl Oracle {
    /// Oracle'i bir admin ile baslatir. Sadece admin fiyat yazabilir.
    pub fn __constructor(env: &Env, admin: Address) {
        env.storage().instance().set(&ADMIN, &admin);
    }

    /// Admin bir varlik icin en guncel fiyati yazar (10^DECIMALS ile olceklenmis).
    pub fn set_price(env: &Env, asset: Asset, price: i128) {
        Self::admin(env).require_auth();
        let data = PriceData {
            price,
            timestamp: env.ledger().timestamp(),
        };
        env.storage().persistent().set(&asset, &data);
    }

    /// SEP-40: bir varligin en son fiyati (yoksa None).
    pub fn lastprice(env: &Env, asset: Asset) -> Option<PriceData> {
        env.storage().persistent().get(&asset)
    }

    /// SEP-40: oracle ondalik basamak sayisi.
    pub fn decimals(_env: &Env) -> u32 {
        DECIMALS
    }

    /// Mevcut admin adresi.
    pub fn admin(env: &Env) -> Address {
        env.storage()
            .instance()
            .get(&ADMIN)
            .expect("admin not set")
    }
}

mod test;
