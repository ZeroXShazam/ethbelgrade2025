import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { IExecDataProtector } from '@iexec/dataprotector';
import { DataProtector } from './components/DataProtector';
import { getDataProtector, getProtectedData } from './lib/iexec';

const IEXEC_CHAIN_ID = '0x86'; // 134 in hex for iExec Sidechain
const IEXEC_RPC = 'https://bellecour.iex.ec';

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [dataProtector, setDataProtector] = useState<IExecDataProtector | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myProtectedData, setMyProtectedData] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error('Please install MetaMask');
      }

      // Request account access
      const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });

      // Initialize DataProtector with iExec chain
      const dataProtector = await getDataProtector(window.ethereum);
      setDataProtector(dataProtector);
      setAccount(address);

      // Fetch initial protected data
      await fetchMyProtectedData(dataProtector, address);
    } catch (error: any) {
      console.error('Failed to connect:', error);
      setError(error.message || 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch protected data for the connected account
  const fetchMyProtectedData = async (dataProtector: IExecDataProtector, account: string) => {
    if (!dataProtector || !account) return;

    try {
      setIsRefreshing(true);
      const data = await getProtectedData(dataProtector, account);
      setMyProtectedData(data);
    } catch (error: any) {
      console.error('Failed to fetch protected data:', error);
      setError(error.message || 'Failed to fetch protected data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle new protected data
  const handleDataProtected = async (newData: any) => {
    if (dataProtector && account) {
      await fetchMyProtectedData(dataProtector, account);
    }
  };

  // Listen for account changes
  useEffect(() => {
    const ethereum = window.ethereum;
    if (ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          setAccount(null);
          setDataProtector(null);
          setMyProtectedData([]);
        } else if (accounts[0] !== account) {
          // Account changed
          connectWallet();
        }
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [account]);

  return (
    <div className="min-h-screen min-w-full w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <nav className="border-b border-white/10 backdrop-blur-lg w-full">
        <div className="px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between h-16 items-center w-full">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Morgan
              </span>
            </div>
            <div>
              {!account ? (
                <button
                  onClick={connectWallet}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connecting...
                    </span>
                  ) : (
                    'Connect Wallet'
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-300">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="text-center mb-12 w-full">
          <h1 className="text-4xl font-bold mb-4">
            Secure DeFi Mortgages with Confidential Computing
          </h1>
          <p className="text-xl text-gray-300">
            Protect your sensitive data while accessing DeFi mortgage services
          </p>
        </div>

        {account && dataProtector && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <h2 className="text-2xl font-semibold mb-4">Upload Protected Data</h2>
              <DataProtector
                dataProtector={dataProtector}
                onDataProtected={handleDataProtected}
              />
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Your Protected Data</h2>
                <button
                  onClick={() => fetchMyProtectedData(dataProtector, account)}
                  disabled={isRefreshing}
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              {myProtectedData.length === 0 ? (
                <p className="text-gray-300">No protected data found.</p>
              ) : (
                <ul className="space-y-2">
                  {myProtectedData.map((data, idx) => (
                    <li key={idx} className="bg-white/5 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">{data.name}</span>
                        <span className="text-xs text-gray-400">
                          {data.address.slice(0, 6)}...{data.address.slice(-4)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Created: {new Date(data.creationTimestamp * 1000).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
