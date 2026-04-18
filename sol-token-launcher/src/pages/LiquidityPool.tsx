import { useState } from "react";
import { useNetwork } from "@/contexts/NetworkContext";

const RAYDIUM_CREATE_POOL_URL = "https://raydium.io/liquidity/create-pool/";
const METEORA_URL = "https://app.meteora.ag/pools/new";
const ORCA_URL = "https://v2.orca.so/pools";

const steps = [
  { num: 1, title: "Create & verify your token", desc: "Make sure your token is already created using the Token Launcher tab. Copy your mint address — you'll need it.", icon: "🪙" },
  { num: 2, title: "Get SOL for pairing", desc: "Decide how much SOL to pair with your tokens to seed the pool. This sets your launch price. Example: 5 SOL + 500M tokens = 0.00000001 SOL per token.", icon: "💰" },
  { num: 3, title: "Open Raydium Create Pool", desc: "Go to Raydium's Create Pool page. Connect the same wallet you used to create the token.", icon: "🦅" },
  { num: 4, title: "Select Base & Quote token", desc: "Paste your mint address as the Base token. Set Quote token to SOL (or USDC). Enter the token amounts and start time.", icon: "⚙️" },
  { num: 5, title: "Initialize the pool", desc: "Click 'Initialize Liquidity Pool' and approve the transaction. Raydium charges a small pool creation fee (~0.15 SOL). Your token is now tradeable!", icon: "🚀" },
  { num: 6, title: "Share & promote", desc: "Copy your pool address and share on socials. Traders can swap on Raydium, and the pool will appear on Jupiter and other aggregators within a few hours.", icon: "📣" },
];

interface Platform {
  name: string;
  url: string;
  desc: string;
  fee: string;
  recommended: boolean;
  color: string;
}

const platforms: Platform[] = [
  { name: "Raydium", url: RAYDIUM_CREATE_POOL_URL, desc: "The most popular Solana DEX. CPMM pools support any SPL token. Recommended for most memecoins.", fee: "~0.15 SOL pool creation fee", recommended: true, color: "from-purple-600 to-blue-600" },
  { name: "Meteora", url: METEORA_URL, desc: "Dynamic liquidity pools with multiple fee tiers. Great for tokens expecting high volatility.", fee: "~0.1 SOL creation fee", recommended: false, color: "from-cyan-600 to-purple-600" },
  { name: "Orca", url: ORCA_URL, desc: "Whirlpool concentrated liquidity. Better capital efficiency for stable pairs.", fee: "~0.1 SOL creation fee", recommended: false, color: "from-blue-600 to-cyan-600" },
];

const faqs = [
  { q: "Do I need permission to create a pool?", a: "No. Solana DEXes like Raydium are fully permissionless. Anyone with an SPL token and some SOL can create a liquidity pool." },
  { q: "What happens to my liquidity?", a: "You receive LP (Liquidity Provider) tokens representing your share of the pool. You can remove liquidity at any time by burning those LP tokens." },
  { q: "Should I burn LP tokens?", a: "Burning LP tokens signals to buyers that the liquidity is locked and the project is not a rug pull. This can significantly increase trust and trading volume." },
  { q: "How much liquidity should I add?", a: "More initial liquidity = less price impact per trade = more trader-friendly. A minimum of 1–5 SOL is recommended. You can add more later." },
  { q: "Will my token show up on Jupiter?", a: "Yes. Once your Raydium pool is live and has sufficient volume, it will automatically appear on Jupiter and other Solana aggregators within a few hours." },
];

export default function LiquidityPool() {
  const { isDevnet } = useNetwork();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mintAddress, setMintAddress] = useState("");

  const raydiumUrl = mintAddress
    ? `${RAYDIUM_CREATE_POOL_URL}?inputMint=So11111111111111111111111111111111111111112&outputMint=${mintAddress}`
    : RAYDIUM_CREATE_POOL_URL;

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Create Liquidity Pool
        </h1>
        <p className="text-slate-400 mt-2">
          Make your token tradeable on Solana DEXes. No platform fees — you set your own price and liquidity depth.
        </p>
      </div>

      {/* Devnet warning */}
      {isDevnet && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5">
          <p className="text-sm font-semibold text-yellow-300 mb-1">⚠️ You're on Devnet</p>
          <p className="text-sm text-slate-400">
            Liquidity pools are a mainnet feature. Switch to <strong>Mainnet</strong> (top-right toggle) when you're ready to create a real pool. The steps below apply to mainnet only.
          </p>
        </div>
      )}

      {/* Quick launch */}
      <div className="bg-slate-800/60 border border-purple-500/30 rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-200">Quick Launch on Raydium</h2>
        <p className="text-sm text-slate-400">Paste your mint address to open Raydium with your token pre-selected.</p>
        <div className="flex gap-3 flex-wrap sm:flex-nowrap">
          <input
            type="text"
            value={mintAddress}
            onChange={(e) => setMintAddress(e.target.value.trim())}
            placeholder="Your token mint address..."
            className="flex-1 min-w-0 bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors font-mono text-sm"
          />
          <a
            href={raydiumUrl}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-900/20 whitespace-nowrap"
          >
            Open Raydium →
          </a>
        </div>
        <p className="text-xs text-purple-400">💜 This site charges zero fees. Raydium's one-time ~0.15 SOL pool creation fee goes directly to the protocol.</p>
      </div>

      {/* Step by step */}
      <div>
        <h2 className="text-xl font-semibold text-slate-200 mb-5">Step-by-Step Guide</h2>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-4 bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600 transition-colors">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-slate-700/80 flex items-center justify-center text-xl">{step.icon}</div>
              </div>
              <div>
                <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Step {step.num}</p>
                <p className="font-semibold text-slate-200 mb-1">{step.title}</p>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform comparison */}
      <div>
        <h2 className="text-xl font-semibold text-slate-200 mb-5">Supported Platforms</h2>
        <div className="space-y-3">
          {platforms.map((p, i) => (
            <a key={i} href={p.url} target="_blank" rel="noreferrer" className="block bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600 transition-all group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-bold bg-gradient-to-r ${p.color} bg-clip-text text-transparent`}>{p.name}</span>
                    {p.recommended && (
                      <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded-full font-medium border border-purple-500/20">Recommended</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mb-2">{p.desc}</p>
                  <p className="text-xs text-slate-500">{p.fee}</p>
                </div>
                <span className="text-slate-500 group-hover:text-slate-300 transition-colors text-lg mt-0.5">→</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-xl font-semibold text-slate-200 mb-5">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-700/30 transition-colors">
                <span className="font-medium text-slate-200 text-sm">{faq.q}</span>
                <span className={`text-slate-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`}>▾</span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
