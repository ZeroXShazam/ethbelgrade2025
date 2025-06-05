import { useState } from 'react';
import { getDataProtector } from '../lib/iexec';
import type { ProtectedData } from '@iexec/dataprotector';

declare global {
    interface Window {
        ethereum?: any;
    }
}

export function IexecConnector() {
    const [address, setAddress] = useState('');
    const [dataSets, setDataSets] = useState<ProtectedData[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dataName, setDataName] = useState('');

    const connectWallet = async () => {
        try {
            setError(null);
            const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setAddress(account);

            const dataProtector = await getDataProtector(window.ethereum);
            const allProtectedData = await dataProtector.core.getProtectedData();
            const userData = allProtectedData.filter(data =>
                data.owner.toLowerCase() === account.toLowerCase()
            );
            setDataSets(userData);
        } catch (error: any) {
            console.error('Failed to connect:', error);
            setError(error.message || 'Failed to connect wallet');
        }
    };

    const handleProtectData = async () => {
        if (!input.trim()) {
            setError('Please enter some data to protect');
            return;
        }

        if (!dataName.trim()) {
            setError('Please enter a name for your data');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const dataProtector = await getDataProtector(window.ethereum);
            const result = await dataProtector.core.protectData({
                name: dataName,
                data: { secretText: input }
            });

            console.log('Protected data:', result);
            const allProtectedData = await dataProtector.core.getProtectedData();
            const userData = allProtectedData.filter(data =>
                data.owner.toLowerCase() === address.toLowerCase()
            );
            setDataSets(userData);
            setInput('');
            setDataName('');
        } catch (e: any) {
            console.error('Data protection failed:', e);
            setError(e.message || 'Failed to protect data');
        }

        setLoading(false);
    };

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                    <button
                        className="absolute top-0 bottom-0 right-0 px-4 py-3"
                        onClick={() => setError(null)}
                    >
                        <span className="sr-only">Dismiss</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {!address ? (
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
                    <button
                        onClick={connectWallet}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg transition-colors duration-200"
                    >
                        Connect Wallet
                    </button>
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                        <div>
                            <p className="text-sm text-gray-600">Connected as</p>
                            <p className="font-mono">{formatAddress(address)}</p>
                        </div>
                        <button
                            onClick={() => setAddress('')}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            Disconnect
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold mb-4">Protect New Data</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Data Name
                                </label>
                                <input
                                    type="text"
                                    value={dataName}
                                    onChange={(e) => setDataName(e.target.value)}
                                    placeholder="e.g., Credit Score, Income Statement"
                                    className="border p-2 rounded w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Confidential Data
                                </label>
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Enter your confidential data..."
                                    className="border p-2 rounded w-full h-32"
                                />
                            </div>
                            <button
                                onClick={handleProtectData}
                                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow transition-colors duration-200"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Encrypting...
                                    </span>
                                ) : (
                                    'Protect Data'
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold mb-4">Protected Datasets</h3>
                        {dataSets.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No protected datasets yet</p>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {dataSets.map((data, index) => (
                                    <div key={index} className="border p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                                        <h4 className="font-bold text-lg mb-2">{data.name}</h4>
                                        <div className="space-y-2 text-sm">
                                            <p className="flex justify-between">
                                                <span className="font-semibold">Address:</span>
                                                <span className="font-mono">{formatAddress(data.address)}</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="font-semibold">Owner:</span>
                                                <span className="font-mono">{formatAddress(data.owner)}</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="font-semibold">Created:</span>
                                                <span>{new Date(data.creationTimestamp * 1000).toLocaleString()}</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="font-semibold">Schema:</span>
                                                <span>{JSON.stringify(data.schema)}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
