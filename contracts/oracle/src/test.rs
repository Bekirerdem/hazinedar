#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, Symbol};

fn setup() -> (Env, OracleClient<'static>, Address) {
    let env = Env::default();
    let admin = Address::generate(&env);
    let id = env.register(Oracle, (admin.clone(),));
    let client = OracleClient::new(&env, &id);
    (env, client, admin)
}

fn try_asset(env: &Env) -> Asset {
    Asset::Other(Symbol::new(env, "TRY"))
}

#[test]
fn set_and_get_price_roundtrip() {
    let (env, client, _admin) = setup();
    env.mock_all_auths();
    // 33.50 USDTRY, 14 decimals
    let rate: i128 = 33_50 * 10i128.pow(12);
    client.set_price(&try_asset(&env), &rate);
    let p = client.lastprice(&try_asset(&env)).unwrap();
    assert_eq!(p.price, rate);
}

#[test]
fn lastprice_is_none_for_unset_asset() {
    let (env, client, _admin) = setup();
    let unknown = Asset::Other(Symbol::new(&env, "JPY"));
    assert!(client.lastprice(&unknown).is_none());
}

#[test]
fn decimals_is_fourteen() {
    let (_env, client, _admin) = setup();
    assert_eq!(client.decimals(), DECIMALS);
}

#[test]
#[should_panic]
fn set_price_requires_admin_auth() {
    let (env, client, _admin) = setup();
    // mock_all_auths cagrilmadi => set_price'taki require_auth panic etmeli
    client.set_price(&try_asset(&env), &1);
}
