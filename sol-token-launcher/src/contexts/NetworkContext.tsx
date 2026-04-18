import { createContext, useContext, useState, type ReactNode } from "react";

export type SolanaNetwork = "mainnet-beta" | "devnet";

interface NetworkContextValue {
  network: SolanaNetwork;
  setNetwork: (n: SolanaNetwork) => void;
  rpcEndpoint: string;
  isDevnet: boolean;
}

const RPC: Record<SolanaNetwork, string> = {
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
  devnet: "https://api.devnet.solana.com",
};

const NetworkContext = createContext<NetworkContextValue>({
  network: "mainnet-beta",
  setNetwork: () => {},
  rpcEndpoint: RPC["mainnet-beta"],
  isDevnet: false,
});

export function NetworkProvider({ children }: { children: ReactNode }) {
  const saved = (localStorage.getItem("solana-network") as SolanaNetwork) || "mainnet-beta";
  const [network, setNetworkRaw] = useState<SolanaNetwork>(saved);

  function setNetwork(n: SolanaNetwork) {
    setNetworkRaw(n);
    localStorage.setItem("solana-network", n);
  }

  return (
    <NetworkContext.Provider
      value={{
        network,
        setNetwork,
        rpcEndpoint: RPC[network],
        isDevnet: network === "devnet",
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
