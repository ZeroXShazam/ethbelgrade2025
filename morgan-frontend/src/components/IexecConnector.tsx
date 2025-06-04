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

    const connectWallet = async () => {
        try {
            setError(null);
            const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setAddress(account);

            const dataProtector = await getDataProtector(window.ethereum);
            const userProtectedData = await dataProtector.core.getProtectedData();
            setDataSets(userProtectedData);
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

        setLoading(true);
        setError(null);

        try {
            const dataProtector = await getDataProtector(window.ethereum);
            const result = await dataProtector.core.protectData({
                name: 'Mortgage Info',
                data: { secretText: input }
            });

            console.log('Protected data:', result);
            const updated = await dataProtector.core.getProtectedData();
            setDataSets(updated);
            setInput('');
        } catch (e: any) {
            console.error('Data protection failed:', e);
            setError(e.message || 'Failed to protect data');
        }

        setLoading(false);
    };

    return (
        <div className="space-y-4">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {!address && (
                <button
                    onClick={connectWallet}
                    className="bg-blue-600 text-white px-4 py-2 rounded shadow"
                >
                    Connect Wallet
                </button>
            )}

            {address && (
                <>
                    <p>Connected as: {address}</p>

                    <div className="mt-4">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Enter confidential data..."
                            className="border p-2 rounded w-full max-w-md"
                        />
                        <button
                            onClick={handleProtectData}
                            className="bg-green-600 text-white px-4 py-2 mt-2 rounded shadow"
                            disabled={loading}
                        >
                            {loading ? 'Encrypting...' : 'Upload Protected Data'}
                        </button>
                    </div>

                    <h3 className="text-lg mt-6 font-semibold">Protected Datasets:</h3>
                    <div className="space-y-4">
                        {dataSets.map((data, index) => (
                            <div key={index} className="border p-4 rounded-lg bg-gray-50">
                                <h4 className="font-bold">{data.name}</h4>
                                <div className="mt-2 space-y-1 text-sm">
                                    <p><span className="font-semibold">Address:</span> {data.address}</p>
                                    <p><span className="font-semibold">Owner:</span> {data.owner}</p>
                                    <p><span className="font-semibold">Created:</span> {new Date(data.creationTimestamp * 1000).toLocaleString()}</p>
                                    <p><span className="font-semibold">Transaction:</span> {data.transactionHash}</p>
                                    <p><span className="font-semibold">Schema:</span> {JSON.stringify(data.schema)}</p>
                                    <p><span className="font-semibold">Multiaddr:</span> {data.multiaddr}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
