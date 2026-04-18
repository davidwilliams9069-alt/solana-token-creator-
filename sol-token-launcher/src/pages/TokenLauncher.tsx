import { useState, useRef, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { uploadImageToIPFS, uploadMetadataToIPFS } from "@/lib/pinata";
import { createSPLToken, getSolscanLink, getMintLink } from "@/lib/solana";
import { useNetwork } from "@/contexts/NetworkContext";

type Step = "idle" | "uploading-image" | "uploading-meta" | "creating-token" | "done" | "error";

interface FormData {
  name: string;
  symbol: string;
  description: string;
  decimals: number;
  supply: number;
}

interface Result {
  mintAddress: string;
  txSignature: string;
  metadataUri: string;
  imageUri: string;
}

export default function TokenLauncher() {
  const wallet = useWallet();
  const { network, isDevnet } = useNetwork();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({
    name: "",
    symbol: "",
    description: "",
    decimals: 9,
    supply: 1_000_000_000,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [stepMessage, setStepMessage] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.connected || !wallet.publicKey || !wallet.signTransaction) {
      setErrorMsg("Please connect your wallet first.");
      setStep("error");
      return;
    }
    if (!imageFile) {
      setErrorMsg("Please upload a token image.");
      setStep("error");
      return;
    }
    if (!form.name.trim() || !form.symbol.trim()) {
      setErrorMsg("Name and symbol are required.");
      setStep("error");
      return;
    }

    setStep("uploading-image");
    setStepMessage("Uploading image to IPFS via Pinata...");
    setErrorMsg("");

    try {
      const imageUri = await uploadImageToIPFS(imageFile);

      setStep("uploading-meta");
      setStepMessage("Uploading metadata to IPFS...");

      const metadata = {
        name: form.name,
        symbol: form.symbol,
        description: form.description,
        image: imageUri,
        attributes: [],
        properties: {
          files: [{ uri: imageUri, type: imageFile.type }],
          category: "image",
        },
      };
      const metadataUri = await uploadMetadataToIPFS(metadata);

      setStep("creating-token");
      setStepMessage(`Creating token on Solana ${isDevnet ? "devnet" : "mainnet"} — approve the transaction in your wallet...`);

      const { mintAddress, txSignature } = await createSPLToken(
        {
          publicKey: wallet.publicKey,
          signTransaction: wallet.signTransaction,
          signAllTransactions: wallet.signAllTransactions,
        },
        {
          name: form.name,
          symbol: form.symbol.toUpperCase(),
          description: form.description,
          metadataUri,
          decimals: form.decimals,
          supply: form.supply,
        },
        network
      );

      setResult({ mintAddress, txSignature, metadataUri, imageUri });
      setStep("done");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMsg(message);
      setStep("error");
    }
  };

  const resetForm = () => {
    setForm({ name: "", symbol: "", description: "", decimals: 9, supply: 1_000_000_000 });
    setImageFile(null);
    setImagePreview(null);
    setStep("idle");
    setResult(null);
    setErrorMsg("");
  };

  const isLoading = ["uploading-image", "uploading-meta", "creating-token"].includes(step);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-green-400 bg-clip-text text-transparent">
          Launch Your Token
        </h1>
        <p className="text-slate-400 mt-2">
          Create a Solana SPL token with on-chain metadata.{" "}
          {isDevnet
            ? "Devnet mode — tokens are free to create and have no real value."
            : "No fees — you only pay the Solana network transaction fee (~0.01 SOL)."}
        </p>
        {isDevnet && (
          <div className="mt-3 flex items-center gap-2">
            <a
              href="https://faucet.solana.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-sm rounded-lg hover:bg-yellow-500/25 transition-colors"
            >
              <span>💰</span> Get free devnet SOL from faucet
            </a>
          </div>
        )}
      </div>

      {step === "done" && result ? (
        <div className="bg-slate-800/60 border border-green-500/40 rounded-2xl p-8 text-center space-y-6">
          <div className="text-5xl">🎉</div>
          <h2 className="text-2xl font-bold text-green-400">
            Token Created{isDevnet ? " on Devnet!" : "!"}
          </h2>
          {isDevnet && (
            <p className="text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-2">
              This is a devnet token. Switch to Mainnet when you're ready to launch for real.
            </p>
          )}
          <div className="space-y-3 text-left">
            <div className="bg-slate-900/60 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Mint Address</p>
              <p className="text-sm font-mono text-slate-200 break-all">{result.mintAddress}</p>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Metadata URI (IPFS)</p>
              <a href={result.metadataUri} target="_blank" rel="noreferrer" className="text-sm font-mono text-purple-400 hover:text-purple-300 break-all">
                {result.metadataUri}
              </a>
            </div>
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <a
              href={getMintLink(result.mintAddress, network)}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-colors"
            >
              View on Solscan
            </a>
            <a
              href={getSolscanLink(result.txSignature, network)}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
            >
              View Transaction
            </a>
            <button
              onClick={resetForm}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
            >
              Create Another
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Wallet Connect */}
          {!wallet.connected && (
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-200">Connect your wallet</p>
                <p className="text-sm text-slate-400 mt-0.5">Required to sign the token creation transaction</p>
              </div>
              <WalletMultiButton />
            </div>
          )}

          {wallet.connected && (
            <div className="bg-slate-800/60 border border-green-500/30 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-slate-300 font-mono">
                  {wallet.publicKey?.toBase58().slice(0, 8)}...{wallet.publicKey?.toBase58().slice(-6)}
                </span>
              </div>
              <WalletMultiButton />
            </div>
          )}

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Token Image <span className="text-purple-400">*</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className={`
                relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200
                ${imagePreview
                  ? "border-purple-500/50 bg-slate-800/40"
                  : "border-slate-600 bg-slate-800/30 hover:border-purple-500/60 hover:bg-slate-800/50"
                }
              `}
            >
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              {imagePreview ? (
                <div className="flex items-center gap-4 p-4">
                  <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-xl object-cover ring-2 ring-purple-500/40" />
                  <div>
                    <p className="text-slate-200 font-medium">{imageFile?.name}</p>
                    <p className="text-sm text-slate-400 mt-0.5">{imageFile ? (imageFile.size / 1024).toFixed(1) : 0} KB</p>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }} className="text-xs text-red-400 hover:text-red-300 mt-1">Remove</button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="text-4xl mb-3">🖼️</div>
                  <p className="text-slate-300 font-medium">Drop your image here or click to browse</p>
                  <p className="text-sm text-slate-500 mt-1">PNG, JPG, GIF, WEBP supported</p>
                </div>
              )}
            </div>
          </div>

          {/* Name & Symbol */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Token Name <span className="text-purple-400">*</span></label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Doge Coin" maxLength={32} required className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Symbol (Ticker) <span className="text-purple-400">*</span></label>
              <input type="text" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })} placeholder="e.g. DOGE" maxLength={10} required className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is your token about?" rows={3} className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-none" />
          </div>

          {/* Decimals & Supply */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Decimals <span className="text-slate-500 font-normal">(9 = standard)</span></label>
              <input type="number" value={form.decimals} onChange={(e) => setForm({ ...form, decimals: parseInt(e.target.value) })} min={0} max={9} className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-purple-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Total Supply</label>
              <input type="number" value={form.supply} onChange={(e) => setForm({ ...form, supply: parseInt(e.target.value) })} min={1} className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-purple-500 transition-colors" />
            </div>
          </div>

          {/* Fee notice */}
          <div className={`border rounded-xl p-4 flex gap-3 ${isDevnet ? "bg-yellow-950/30 border-yellow-500/20" : "bg-purple-950/40 border-purple-500/20"}`}>
            <span className="text-lg">{isDevnet ? "🧪" : "💜"}</span>
            <div>
              <p className={`text-sm font-medium ${isDevnet ? "text-yellow-300" : "text-purple-300"}`}>
                {isDevnet ? "Test mode — no real money needed" : "Zero platform fees"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {isDevnet
                  ? "You're on devnet. Tokens cost free test SOL only. Use the faucet link above to get some."
                  : "You only pay the Solana network fee (~0.01–0.02 SOL) to create the token. No extra charges."}
              </p>
            </div>
          </div>

          {/* Error */}
          {step === "error" && (
            <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-4">
              <p className="text-sm font-medium text-red-400">Error</p>
              <p className="text-xs text-red-300 mt-1 break-words">{errorMsg}</p>
              <button type="button" onClick={() => { setStep("idle"); setErrorMsg(""); }} className="text-xs text-red-400 hover:text-red-300 mt-2 underline">Try again</button>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="bg-slate-800/60 border border-purple-500/30 rounded-xl p-4 flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-sm text-slate-300">{stepMessage}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !wallet.connected}
            className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 ${
              isLoading || !wallet.connected
                ? "bg-slate-700 cursor-not-allowed text-slate-400"
                : isDevnet
                ? "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 shadow-lg shadow-yellow-900/20"
                : "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-lg shadow-purple-900/30"
            }`}
          >
            {isLoading
              ? "Processing..."
              : !wallet.connected
              ? "Connect Wallet to Launch"
              : isDevnet
              ? "Launch Test Token on Devnet →"
              : "Launch Token on Solana →"
            }
          </button>
        </form>
      )}
    </div>
  );
}
