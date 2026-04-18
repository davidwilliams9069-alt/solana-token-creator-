import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SolanaWalletProvider } from "@/components/WalletProvider";
import { NetworkProvider, useNetwork, type SolanaNetwork } from "@/contexts/NetworkContext";
import TokenLauncher from "@/pages/TokenLauncher";
import LiquidityPool from "@/pages/LiquidityPool";

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center">
      <div>
        <p className="text-6xl mb-4">404</p>
        <p className="text-slate-400">Page not found</p>
        <Link href="/" className="mt-4 inline-block text-purple-400 hover:text-purple-300">
          Go home
        </Link>
      </div>
    </div>
  );
}

function NetworkToggle() {
  const { network, setNetwork, isDevnet } = useNetwork();

  return (
    <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700 rounded-xl p-1">
      {(["mainnet-beta", "devnet"] as SolanaNetwork[]).map((n) => (
        <button
          key={n}
          onClick={() => setNetwork(n)}
          className={`
            px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200
            ${network === n
              ? n === "devnet"
                ? "bg-yellow-500 text-black shadow-sm"
                : "bg-purple-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
            }
          `}
        >
          {n === "mainnet-beta" ? "Mainnet" : "Devnet"}
        </button>
      ))}
    </div>
  );
}

function DevnetBanner() {
  const { isDevnet } = useNetwork();
  if (!isDevnet) return null;

  return (
    <div className="bg-yellow-500/15 border-b border-yellow-500/30 px-4 py-2.5 text-center">
      <p className="text-sm text-yellow-300 font-medium">
        ⚠️ <strong>Devnet mode</strong> — Tokens created here are <strong>fake</strong> and have no real value. Perfect for testing!
        &nbsp;
        <a
          href="https://faucet.solana.com"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-yellow-200 transition-colors"
        >
          Get free devnet SOL →
        </a>
      </p>
    </div>
  );
}

function Nav() {
  const [location] = useLocation();
  const navItems = [
    { href: "/", label: "Launch Token", icon: "🚀" },
    { href: "/pool", label: "Liquidity Pool", icon: "💧" },
  ];
  return (
    <nav className="border-b border-slate-800 backdrop-blur-sm bg-slate-950/50 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
            S
          </div>
          <span className="font-bold text-slate-100 text-lg hidden sm:block">SolLaunch</span>
        </div>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = item.href === "/" ? location === "/" : location.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
                  ${active
                    ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }
                `}
              >
                <span className="hidden sm:inline">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <NetworkToggle />
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-800 mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-slate-500">
          Built on Solana · Zero platform fees · Your keys, your tokens
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <a href="https://solana.com" target="_blank" rel="noreferrer" className="hover:text-slate-400 transition-colors">Solana</a>
          <a href="https://raydium.io" target="_blank" rel="noreferrer" className="hover:text-slate-400 transition-colors">Raydium</a>
          <a href="https://pinata.cloud" target="_blank" rel="noreferrer" className="hover:text-slate-400 transition-colors">Pinata</a>
        </div>
      </div>
    </footer>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <DevnetBanner />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={TokenLauncher} />
        <Route path="/pool" component={LiquidityPool} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NetworkProvider>
        <SolanaWalletProvider>
          <WouterRouter base="">
            <Router />
          </WouterRouter>
        </SolanaWalletProvider>
      </NetworkProvider>
    </QueryClientProvider>
  );
}

export default App;
