#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, token, Address, Env, Vec};

struct Ctx {
    env: Env,
    client: TreasuryClient<'static>,
    owner: Address,
    supplier: Address,
}

fn setup() -> Ctx {
    let env = Env::default();
    env.mock_all_auths();
    let owner = Address::generate(&env);
    let agent = Address::generate(&env);
    let supplier = Address::generate(&env);

    // USDC test asseti (SAC) olustur ve hazineyi fonla
    let usdc_admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(usdc_admin.clone());
    let usdc_id = sac.address();
    let usdc_admin_client = token::StellarAssetClient::new(&env, &usdc_id);

    let policy = Policy {
        daily_limit: 1_000,
        whitelist: Vec::from_array(&env, [supplier.clone()]),
        max_slippage_bps: 200,
    };
    let id = env.register(
        Treasury,
        (owner.clone(), agent.clone(), usdc_id.clone(), policy),
    );
    let client = TreasuryClient::new(&env, &id);

    usdc_admin_client.mint(&id, &10_000);
    Ctx {
        env,
        client,
        owner,
        supplier,
    }
}

#[test]
fn agent_pays_whitelisted_within_limit() {
    let ctx = setup();
    ctx.client.agent_pay(&ctx.supplier, &500);
    assert_eq!(ctx.client.balance(), 9_500);
    assert_eq!(ctx.client.spent_today(), 500);
}

#[test]
#[should_panic(expected = "daily limit")]
fn agent_cannot_exceed_daily_limit() {
    let ctx = setup();
    ctx.client.agent_pay(&ctx.supplier, &1_500); // limit 1000
}

#[test]
#[should_panic(expected = "not whitelisted")]
fn agent_cannot_pay_non_whitelisted() {
    let ctx = setup();
    let stranger = Address::generate(&ctx.env);
    ctx.client.agent_pay(&stranger, &100);
}

#[test]
fn owner_can_withdraw_anytime() {
    let ctx = setup();
    ctx.client.withdraw(&ctx.owner, &2_000);
    assert_eq!(ctx.client.balance(), 8_000);
}

#[test]
fn daily_limit_accumulates_across_payments() {
    let ctx = setup();
    ctx.client.agent_pay(&ctx.supplier, &600);
    ctx.client.agent_pay(&ctx.supplier, &400); // toplam 1000 == limit, gecmeli
    assert_eq!(ctx.client.spent_today(), 1_000);
}

#[test]
fn owner_can_pause_and_unpause() {
    let ctx = setup();
    assert_eq!(ctx.client.is_paused(), false);
    ctx.client.pause();
    assert_eq!(ctx.client.is_paused(), true);
    ctx.client.unpause();
    assert_eq!(ctx.client.is_paused(), false);
}

#[test]
#[should_panic(expected = "paused")]
fn paused_blocks_agent_pay() {
    let ctx = setup();
    ctx.client.pause();
    ctx.client.agent_pay(&ctx.supplier, &100); // paused -> reddedilmeli
}

#[test]
fn owner_can_rotate_agent_recoverability() {
    let ctx = setup();
    let new_agent = Address::generate(&ctx.env);
    ctx.client.set_agent(&new_agent);
    assert_eq!(ctx.client.agent(), new_agent);
}
