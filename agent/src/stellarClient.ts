/**
 * Testnet Soroban istemcisi (server-side, keypair ile imza).
 * Raw @stellar/stellar-sdk kullanir (binding'siz) - oracle okuma/yazma + treasury okuma/agent_pay.
 */
import {
  rpc,
  Contract,
  TransactionBuilder,
  Keypair,
  Networks,
  nativeToScVal,
  scValToNative,
  Address,
  xdr,
  BASE_FEE,
} from "@stellar/stellar-sdk";

const RPC_URL = "https://soroban-testnet.stellar.org";
const PASSPHRASE = Networks.TESTNET;
const ORACLE_DECIMALS = 14;

export const server = new rpc.Server(RPC_URL);

/** SEP-40 Asset::Other(Symbol) scVal'i olusturur. */
function assetOther(symbol: string): xdr.ScVal {
  return xdr.ScVal.scvVec([
    nativeToScVal("Other", { type: "symbol" }),
    nativeToScVal(symbol, { type: "symbol" }),
  ]);
}

/** Read-only view cagrisi (simulate). scValToNative sonucu doner. */
export async function readView(
  contractId: string,
  readerPubKey: string,
  method: string,
  ...args: xdr.ScVal[]
): Promise<unknown> {
  const contract = new Contract(contractId);
  const account = await server.getAccount(readerPubKey);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`${method} simulate error: ${sim.error}`);
  }
  const retval = sim.result?.retval;
  return retval ? scValToNative(retval) : undefined;
}

/** Bir yazma islemini hazirla + imzala + gonder + onayini bekle. tx hash doner. */
async function submit(op: xdr.Operation, signer: Keypair, label: string): Promise<string> {
  const account = await server.getAccount(signer.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();
  const prepared = await server.prepareTransaction(tx);
  prepared.sign(signer);
  const sent = await server.sendTransaction(prepared);
  if (sent.status === "ERROR") {
    throw new Error(`${label} send error: ${JSON.stringify(sent.errorResult)}`);
  }
  let result = await server.getTransaction(sent.hash);
  while (result.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    await new Promise((r) => setTimeout(r, 1000));
    result = await server.getTransaction(sent.hash);
  }
  if (result.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`${label} tx failed: ${result.status}`);
  }
  return sent.hash;
}

/** Oracle'dan USDTRY kurunu okur. Olceklenmemis kur (orn 33.50) doner. */
export async function readUsdTry(oracleId: string, readerPubKey: string): Promise<number> {
  const data = (await readView(oracleId, readerPubKey, "lastprice", assetOther("TRY"))) as
    | { price: bigint; timestamp: bigint }
    | undefined;
  if (!data) throw new Error("oracle'da TRY fiyati yok");
  return Number(data.price) / 10 ** ORACLE_DECIMALS;
}

/** Oracle'a guncel kuru yazar (admin imzasi). tx hash doner. */
export async function pushRate(
  oracleId: string,
  admin: Keypair,
  symbol: string,
  rate: number,
): Promise<string> {
  const contract = new Contract(oracleId);
  const scaled = BigInt(Math.round(rate * 10 ** ORACLE_DECIMALS));
  const op = contract.call("set_price", assetOther(symbol), nativeToScVal(scaled, { type: "i128" }));
  return submit(op, admin, "set_price");
}

/** Treasury agent_pay cagirir (agent imzasi). tx hash doner. */
export async function agentPay(
  treasuryId: string,
  agent: Keypair,
  supplier: string,
  amountStroops: bigint,
): Promise<string> {
  const contract = new Contract(treasuryId);
  const op = contract.call(
    "agent_pay",
    Address.fromString(supplier).toScVal(),
    nativeToScVal(amountStroops, { type: "i128" }),
  );
  return submit(op, agent, "agent_pay");
}

/** Owner-yetkili arg'siz cagri (pause / unpause). tx hash doner. */
export async function ownerCall(
  treasuryId: string,
  owner: Keypair,
  method: string,
): Promise<string> {
  const contract = new Contract(treasuryId);
  return submit(contract.call(method), owner, method);
}
