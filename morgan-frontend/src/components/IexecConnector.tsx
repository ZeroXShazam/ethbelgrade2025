import { useState } from 'react';
import { getDataProtector } from '../lib/iexec';

declare global {
    interface Window {
        ethereum?: any;
    }
}

export function IexecConnector() {
    const [address, setAddress] = useState('');
    const [dataSets, setDataSets] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const connectWallet = async () => {
        const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAddress(account);

        const dataProtector = await getDataProtector(window.ethereum);
        const userProtectedData = await dataProtector.core.getProtectedData();
        setDataSets(userProtectedData);
    };

    const handleProtectData = async () => {
        setLoading(true);
        const dataProtector = await getDataProtector(window.ethereum);

        try {
            const result = await dataProtector.core.protectData({
                name: 'Mortgage Info',
                data: { secretText: input }
            });

            console.log('Protected data:', result);
            const updated = await dataProtector.core.getProtectedData();
            setDataSets(updated);
            setInput('');
        } catch (e) {
            console.error('Data protection failed:', e);
        }

        setLoading(false);
    };

    return (
        <div className="space-y-4">
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
                    <ul className="list-disc pl-5">
                        {dataSets.map((data, index) => (
                            <li key={index}>
                                {data.name} — {data.schema?.secretText}
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}
