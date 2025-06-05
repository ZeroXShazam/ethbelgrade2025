import { useState, useEffect } from 'react';
import { getDataProtector } from '../lib/iexec';
import type { ProtectedData } from '@iexec/dataprotector';
import { IExecDataProtector } from '@iexec/dataprotector';

declare global {
    interface Window {
        ethereum?: any;
    }
}

interface DataProtectorProps {
    dataProtector: IExecDataProtector;
    account: string;
}

export function IexecConnector() {
    const [address, setAddress] = useState('');
    const [dataSets, setDataSets] = useState<ProtectedData[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dataName, setDataName] = useState('');
    const [myProtectedData, setMyProtectedData] = useState<any[]>([]);

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

    const fetchProtectedData = async () => {
        try {
            const dataProtector = await getDataProtector(window.ethereum);
            const allProtectedData = await dataProtector.core.getProtectedData();
            const userData = allProtectedData.filter(
                (data: any) => data.owner.toLowerCase() === address.toLowerCase()
            );
            setDataSets(userData);
        } catch (error) {
            console.error('Failed to fetch protected data:', error);
        }
    };

    useEffect(() => {
        if (address) {
            fetchProtectedData();
        }
    }, [address]);

    useEffect(() => {
        const fetchMyProtectedData = async () => {
            if (address && dataProtector) {
                const allProtectedData = await dataProtector.core.getProtectedData();
                const myData = allProtectedData.filter(
                    (data: any) => data.owner.toLowerCase() === address.toLowerCase()
                );
                setMyProtectedData(myData);
            }
        };
        fetchMyProtectedData();
    }, [address]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-indigo-900 mb-2">Morgan</h1>
                    <p className="text-indigo-600">Secure Financial Data Protection</p>
                </div>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-sm" role="alert">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="block sm:inline">{error}</span>
                        </div>
                        <button
                            className="absolute top-0 bottom-0 right-0 px-4 py-3"
                            onClick={() => setError(null)}
                        >
                            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {!address ? (
                    <div className="text-center bg-white p-8 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold text-indigo-900 mb-4">Connect Your Wallet</h2>
                        <p className="text-gray-600 mb-6">Connect your wallet to start protecting your financial data</p>
                        <button
                            onClick={connectWallet}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                        >
                            Connect Wallet
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm">
                            <div>
                                <p className="text-sm text-gray-600">Connected as</p>
                                <p className="font-mono text-indigo-900">{formatAddress(address)}</p>
                            </div>
                            <button
                                onClick={() => setAddress('')}
                                className="text-gray-500 hover:text-indigo-600 transition-colors duration-200"
                            >
                                Disconnect
                            </button>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-md">
                            <h3 className="text-xl font-semibold text-indigo-900 mb-4">Protect New Data</h3>
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
                                        className="border border-gray-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
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
                                        className="border border-gray-300 p-2 rounded-lg w-full h-32 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                                    />
                                </div>
                                <button
                                    onClick={handleProtectData}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg shadow-md transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
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

                        <div className="bg-white p-6 rounded-xl shadow-md">
                            <h3 className="text-xl font-semibold text-indigo-900 mb-4">Protected Datasets</h3>
                            {dataSets.length === 0 ? (
                                <div className="text-center py-8">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                    <p className="mt-2 text-gray-500">No protected datasets yet</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {dataSets.map((data, index) => (
                                        <div key={index} className="border border-gray-200 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-200 transform hover:scale-[1.02]">
                                            <h4 className="font-bold text-lg text-indigo-900 mb-2">{data.name}</h4>
                                            <div className="space-y-2 text-sm">
                                                <p className="flex justify-between">
                                                    <span className="font-semibold text-gray-600">Address:</span>
                                                    <span className="font-mono text-indigo-900">{formatAddress(data.address)}</span>
                                                </p>
                                                <p className="flex justify-between">
                                                    <span className="font-semibold text-gray-600">Owner:</span>
                                                    <span className="font-mono text-indigo-900">{formatAddress(data.owner)}</span>
                                                </p>
                                                <p className="flex justify-between">
                                                    <span className="font-semibold text-gray-600">Created:</span>
                                                    <span className="text-indigo-900">{new Date(data.creationTimestamp * 1000).toLocaleString()}</span>
                                                </p>
                                                <p className="flex justify-between">
                                                    <span className="font-semibold text-gray-600">Schema:</span>
                                                    <span className="text-indigo-900">{JSON.stringify(data.schema)}</span>
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
        </div>
    );
}
