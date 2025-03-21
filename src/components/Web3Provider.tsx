import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { toast } from 'sonner';

// Define the window interface with ethereum property
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Define network configuration
const NETWORK_CONFIG = {
  chainId: Number(import.meta.env.VITE_CHAIN_ID) || 31337,
  chainName: import.meta.env.VITE_NETWORK_NAME || 'Hardhat Local',
  rpcUrl: import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18
  },
  blockExplorerUrl: '',
};

// Define contract addresses
const CONTRACT_ADDRESSES = {
  ipNftRegistry: import.meta.env.VITE_IP_NFT_REGISTRY_CONTRACT || '',
  ruleEngine: import.meta.env.VITE_VELTIS_RULE_ENGINE || '',
};

// Create Web3 context
interface Web3ContextType {
  provider: ethers.providers.Web3Provider | ethers.providers.JsonRpcProvider | null;
  signer: ethers.Signer | null;
  account: string | null;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  switchNetwork: () => Promise<void>;
  networkConfig: typeof NETWORK_CONFIG;
  getNetworkName: (chainId: number) => string;
}

const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  account: null,
  chainId: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  isConnected: false,
  isCorrectNetwork: false,
  switchNetwork: async () => {},
  networkConfig: NETWORK_CONFIG,
  getNetworkName: () => '',
});

export const useWeb3 = () => useContext(Web3Context);

interface Web3ProviderProps {
  children: ReactNode;
}

// Helper function to convert hex to decimal
const hexToDecimal = (hex: string): number => parseInt(hex, 16);

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | ethers.providers.JsonRpcProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  // Network name mapping
  const getNetworkName = (id: number): string => {
    const networks: {[key: number]: string} = {
      1: 'Ethereum Mainnet',
      5: 'Ethereum Goerli',
      137: 'Polygon Mainnet',
      80001: 'Polygon Mumbai',
      80002: 'Polygon Amoy',
      31337: 'Hardhat Local',
    };
    return networks[id] || `Unknown (${id})`;
  };

  // Check if we're on the correct network
  const checkCorrectNetwork = (currentChainId: number): boolean => {
    console.log('Checking network:', { current: currentChainId, expected: NETWORK_CONFIG.chainId });
    return currentChainId === NETWORK_CONFIG.chainId;
  };

  // Initialize provider (read-only) on component mount
  useEffect(() => {
    const initProvider = () => {
      // Default to JsonRpcProvider for read-only access
      const fallbackProvider = new ethers.providers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
      setProvider(fallbackProvider);
      setChainId(NETWORK_CONFIG.chainId);
      
      // Check if window.ethereum is available (we're in a browser with MetaMask installed)
      if (window.ethereum) {
        (async () => {
          try {
            // Check if already connected
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
              const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
              const web3Signer = web3Provider.getSigner();
              const { chainId: connectedChainId } = await web3Provider.getNetwork();
              
              setProvider(web3Provider);
              setSigner(web3Signer);
              setAccount(accounts[0]);
              setChainId(connectedChainId);
              setIsConnected(true);
              setIsCorrectNetwork(checkCorrectNetwork(connectedChainId));
              
              console.log('Connected to network:', { 
                name: getNetworkName(connectedChainId),
                id: connectedChainId,
                isCorrect: checkCorrectNetwork(connectedChainId)
              });
            }
          } catch (error) {
            console.error('Error checking initial connection:', error);
          }
        })();
      }
    };

    initProvider();
    
    // Log environment info for debugging
    console.log('Network Configuration:', {
      chainId: NETWORK_CONFIG.chainId,
      chainName: NETWORK_CONFIG.chainName,
      rpcUrl: NETWORK_CONFIG.rpcUrl,
    });
  }, []);

  // Handle account and network changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        disconnectWallet();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        setIsConnected(true);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = hexToDecimal(chainIdHex);
      console.log('Chain changed:', { 
        newChainId,
        expected: NETWORK_CONFIG.chainId,
        isCorrect: checkCorrectNetwork(newChainId)
      });
      
      setChainId(newChainId);
      setIsCorrectNetwork(checkCorrectNetwork(newChainId));
      
      // Refresh the page as recommended by MetaMask
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [account]);

  // Connect wallet function
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask is not installed. Please install MetaMask to connect.');
      return;
    }

    try {
      // Request accounts access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Set Web3 provider
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const web3Signer = web3Provider.getSigner();
      
      // Get current chain ID
      const { chainId: connectedChainId } = await web3Provider.getNetwork();
      
      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(accounts[0]);
      setChainId(connectedChainId);
      setIsConnected(true);
      
      const correctNetwork = checkCorrectNetwork(connectedChainId);
      setIsCorrectNetwork(correctNetwork);
      
      console.log('Connected to wallet:', { 
        account: accounts[0],
        networkName: getNetworkName(connectedChainId),
        networkId: connectedChainId,
        isCorrectNetwork: correctNetwork
      });
      
      // If on wrong network, prompt to switch
      if (!correctNetwork) {
        toast.warning(`Please switch to ${NETWORK_CONFIG.chainName} to use Veltis.`);
        try {
          await switchNetwork();
        } catch (error) {
          console.error('Error auto-switching network:', error);
        }
      } else {
        toast.success(`Connected to ${getNetworkName(connectedChainId)}`);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet. Please try again.');
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    setAccount(null);
    setIsConnected(false);
    
    // Keep the provider for read-only access
    const fallbackProvider = new ethers.providers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
    setProvider(fallbackProvider);
    setSigner(null);
    
    toast.info('Wallet disconnected');
  };

  // Switch network function
  const switchNetwork = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask is not installed');
      return;
    }

    const chainIdHex = `0x${NETWORK_CONFIG.chainId.toString(16)}`;

    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName: NETWORK_CONFIG.chainName,
                nativeCurrency: NETWORK_CONFIG.nativeCurrency,
                rpcUrls: [NETWORK_CONFIG.rpcUrl],
                blockExplorerUrls: NETWORK_CONFIG.blockExplorerUrl ? [NETWORK_CONFIG.blockExplorerUrl] : [],
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding chain to MetaMask:', addError);
          toast.error('Failed to add network to MetaMask');
        }
      } else {
        console.error('Error switching chain in MetaMask:', switchError);
        toast.error('Failed to switch network. Please try manually in MetaMask.');
      }
    }
  };

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        account,
        chainId,
        connectWallet,
        disconnectWallet,
        isConnected,
        isCorrectNetwork,
        switchNetwork,
        networkConfig: NETWORK_CONFIG,
        getNetworkName,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};