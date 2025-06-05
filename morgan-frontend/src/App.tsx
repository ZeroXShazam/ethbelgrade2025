import { useState, useEffect } from 'react';
import { IExecDataProtector } from '@iexec/dataprotector';
import { DataProtector } from './components/DataProtector';
import { AnalysisRequest } from './components/AnalysisRequest';
import { getDataProtector, getProtectedData } from './lib/iexec';
import { IexecConnector } from './components/IexecConnector';

type Page = 'upload' | 'analyze';

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [dataProtector, setDataProtector] = useState<IExecDataProtector | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myProtectedData, setMyProtectedData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>('upload');

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            // Wallet is already connected
            const dataProtector = await getDataProtector(window.ethereum);
            setDataProtector(dataProtector);
            setAccount(accounts[0]);
            await fetchMyProtectedData(dataProtector, accounts[0]);
          }
        } catch (error: any) {
          console.error('Failed to check wallet connection:', error);
        }
      }
      setIsInitializing(false);
    };

    checkWalletConnection();
  }, []);

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
      const data = await getProtectedData(dataProtector, account);
      setMyProtectedData(data);
    } catch (error: any) {
      console.error('Failed to fetch protected data:', error);
      setError(error.message || 'Failed to fetch protected data');
    }
  };

  // Handle new protected data
  const handleDataProtected = async () => {
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

  const handleConnect = async () => {
    await connectWallet();
  };

  const renderPage = () => {
    if (!account) {
      return <IexecConnector onConnect={handleConnect} />;
    }

    if (!dataProtector) {
      return null;
    }

    switch (currentPage) {
      case 'upload':
        return <DataProtector dataProtector={dataProtector} onDataProtected={handleDataProtected} />;
      case 'analyze':
        return <AnalysisRequest protectedData={myProtectedData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen min-w-full w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <nav className="border-b border-white/10 backdrop-blur-lg w-full">
        <div className="px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between h-16 items-center w-full">
            <div className="flex items-center space-x-8">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Morgan
              </span>
              {account && (
                <div className="flex space-x-4">
                  <button
                    onClick={() => setCurrentPage('upload')}
                    className={`px-3 py-2 rounded-lg transition-colors ${currentPage === 'upload'
                      ? 'bg-white/10 text-white'
                      : 'text-gray-300 hover:text-white'
                      }`}
                  >
                    Upload Data
                  </button>
                  <button
                    onClick={() => setCurrentPage('analyze')}
                    className={`px-3 py-2 rounded-lg transition-colors ${currentPage === 'analyze'
                      ? 'bg-white/10 text-white'
                      : 'text-gray-300 hover:text-white'
                      }`}
                  >
                    Request Analysis
                  </button>
                </div>
              )}
            </div>
            <div>
              {isInitializing ? (
                <div className="flex items-center text-gray-300">
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking wallet...
                </div>
              ) : !account ? (
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

        {isInitializing ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-300">Initializing...</p>
            </div>
          </div>
        ) : (
          renderPage()
        )}
      </main>
    </div>
  );
}

export default App;
