import { useState } from 'react';
import { IExecDataProtector } from '@iexec/dataprotector';
import { getDataProtector } from '../lib/iexec';

declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: any[] }) => Promise<any>;
            on: (event: string, callback: (...args: any[]) => void) => void;
            removeListener: (event: string, callback: (...args: any[]) => void) => void;
        };
    }
}

interface IexecConnectorProps {
    onConnect: (dataProtector: IExecDataProtector, account: string) => void;
}

export function IexecConnector({ onConnect }: IexecConnectorProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const connectWallet = async () => {
        if (!window.ethereum) {
            setError('Please install MetaMask to use this feature');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const dataProtector = await getDataProtector(window.ethereum);
            onConnect(dataProtector, account);
        } catch (error: any) {
            setError(error.message || 'Failed to connect wallet');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="text-center">
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
            {error && (
                <p className="mt-2 text-red-400 text-sm">{error}</p>
            )}
        </div>
    );
}
