import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  MintLayout,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export type SolanaNetwork = "mainnet-beta" | "devnet";

export const RPC_ENDPOINTS: Record<SolanaNetwork, string> = {
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
  devnet: "https://api.devnet.solana.com",
};

export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export interface TokenConfig {
  name: string;
  symbol: string;
  description: string;
  metadataUri: string;
  decimals: number;
  supply: number;
}

export interface WalletAdapter {
  publicKey: PublicKey;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  signAllTransactions?: (txs: Transaction[]) => Promise<Transaction[]>;
}

function encodeString(str: string): Uint8Array {
  const encoded = new TextEncoder().encode(str);
  const buf = new Uint8Array(4 + encoded.length);
  new DataView(buf.buffer).setUint32(0, encoded.length, true);
  buf.set(encoded, 4);
  return buf;
}

function buildCreateMetadataV3Data(
  name: string,
  symbol: string,
  uri: string,
  sellerFeeBasisPoints = 0,
  isMutable = true
): Buffer {
  const parts: Uint8Array[] = [
    new Uint8Array([33]),
    encodeString(name),
    encodeString(symbol),
    encodeString(uri),
    new Uint8Array(new Uint16Array([sellerFeeBasisPoints]).buffer),
    new Uint8Array([0]),
    new Uint8Array([0]),
    new Uint8Array([0]),
    new Uint8Array([isMutable ? 1 : 0]),
    new Uint8Array([0]),
  ];

  const totalLen = parts.reduce((s, p) => s + p.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return Buffer.from(result);
}

function createCreateMetadataV3Instruction(params: {
  metadata: PublicKey;
  mint: PublicKey;
  mintAuthority: PublicKey;
  payer: PublicKey;
  updateAuthority: PublicKey;
  name: string;
  symbol: string;
  uri: string;
}): TransactionInstruction {
  const data = buildCreateMetadataV3Data(params.name, params.symbol, params.uri);
  return new TransactionInstruction({
    programId: TOKEN_METADATA_PROGRAM_ID,
    keys: [
      { pubkey: params.metadata, isSigner: false, isWritable: true },
      { pubkey: params.mint, isSigner: false, isWritable: false },
      { pubkey: params.mintAuthority, isSigner: true, isWritable: false },
      { pubkey: params.payer, isSigner: true, isWritable: true },
      { pubkey: params.updateAuthority, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export async function createSPLToken(
  wallet: WalletAdapter,
  config: TokenConfig,
  network: SolanaNetwork = "mainnet-beta"
): Promise<{ mintAddress: string; txSignature: string }> {
  const rpc = RPC_ENDPOINTS[network];
  const connection = new Connection(rpc, "confirmed");

  const mintKeypair = Keypair.generate();
  const mintPublicKey = mintKeypair.publicKey;
  const ownerPublicKey = wallet.publicKey;

  const rentExemptBalance = await connection.getMinimumBalanceForRentExemption(MintLayout.span);

  const ata = await getAssociatedTokenAddress(
    mintPublicKey,
    ownerPublicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mintPublicKey.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );

  const supplyRaw = BigInt(Math.floor(config.supply * Math.pow(10, config.decimals)));

  const tx = new Transaction();

  tx.add(
    SystemProgram.createAccount({
      fromPubkey: ownerPublicKey,
      newAccountPubkey: mintPublicKey,
      space: MintLayout.span,
      lamports: rentExemptBalance,
      programId: TOKEN_PROGRAM_ID,
    })
  );

  tx.add(
    createInitializeMintInstruction(
      mintPublicKey,
      config.decimals,
      ownerPublicKey,
      ownerPublicKey,
      TOKEN_PROGRAM_ID
    )
  );

  tx.add(
    createAssociatedTokenAccountInstruction(
      ownerPublicKey,
      ata,
      ownerPublicKey,
      mintPublicKey,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
  );

  tx.add(
    createMintToInstruction(mintPublicKey, ata, ownerPublicKey, supplyRaw, [], TOKEN_PROGRAM_ID)
  );

  tx.add(
    createCreateMetadataV3Instruction({
      metadata: metadataPDA,
      mint: mintPublicKey,
      mintAuthority: ownerPublicKey,
      payer: ownerPublicKey,
      updateAuthority: ownerPublicKey,
      name: config.name,
      symbol: config.symbol.toUpperCase(),
      uri: config.metadataUri,
    })
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;
  tx.feePayer = ownerPublicKey;

  tx.partialSign(mintKeypair);

  const signedTx = await wallet.signTransaction(tx);

  const signature = await connection.sendRawTransaction(signedTx.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });

  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");

  return { mintAddress: mintPublicKey.toBase58(), txSignature: signature };
}

export function getSolscanLink(signature: string, network: SolanaNetwork = "mainnet-beta"): string {
  const cluster = network === "devnet" ? "?cluster=devnet" : "";
  return `https://solscan.io/tx/${signature}${cluster}`;
}

export function getMintLink(mint: string, network: SolanaNetwork = "mainnet-beta"): string {
  const cluster = network === "devnet" ? "?cluster=devnet" : "";
  return `https://solscan.io/token/${mint}${cluster}`;
}
