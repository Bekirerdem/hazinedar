/**
 * Hazinedar agent'ini ERC-8004 Identity Registry'ye (Stellar testnet) kaydeder.
 * Agent'a on-chain kimlik + itibar altyapisi kazandirir (Hack Agentic).
 * Calistir: agent/ dizininde `node --env-file=.env src/register8004.ts`
 */
import { Keypair } from "@stellar/stellar-sdk";
import {
  createClients,
  TESTNET_CONFIG,
  wrapBasicSigner,
  buildMetadataJson,
  toDataUri,
  validateMetadataJson,
} from "@trionlabs/stellar8004";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const keypair = Keypair.fromSecret(process.env.AGENT_SECRET!);
const signer = wrapBasicSigner(keypair, TESTNET_CONFIG.networkPassphrase);
const { identity } = createClients(TESTNET_CONFIG, signer);

const metadata = buildMetadataJson({
  name: "Hazinedar",
  description:
    "Autonomous treasury agent for import-driven SMEs on Stellar: shields idle TRY from inflation via FX-timing and pays cross-border suppliers within an owner-set on-chain policy (non-custodial, bounded).",
  services: [],
  supportedTrust: ["reputation"],
});
validateMetadataJson(metadata);
const dataUri = toDataUri(metadata);

console.log("8004 Identity Registry'ye kaydediliyor (caller =", keypair.publicKey(), ")...");
const tx = await identity.register_with_uri({ caller: keypair.publicKey(), agent_uri: dataUri });
const sent = await tx.signAndSend();
const agentId = sent.result;
console.log("OK — 8004 agentId:", agentId);
console.log("Explorer:", `https://stellar8004.com/agents/${agentId}`);

const out = join(import.meta.dirname, "..", "..", "demo", "8004.json");
writeFileSync(
  out,
  JSON.stringify(
    {
      agentId: Number(agentId),
      explorer: `https://stellar8004.com/agents/${agentId}`,
      identityRegistry: "CDE3K4COIAGWNNJQQLL26SYI3KBJF5FUDHXG5FA6GYDJCG7T5V7FIWZH",
      network: "testnet",
    },
    null,
    2,
  ),
);
console.log("kaydedildi: demo/8004.json");
