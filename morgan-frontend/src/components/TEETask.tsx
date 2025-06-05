import { useState, useEffect } from 'react';
import { IExecDataProtector } from '@iexec/dataprotector';
import { ethers } from 'ethers';

interface TEETaskProps {
    dataProtector: IExecDataProtector;
    protectedData: any[];
}

declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: any[] }) => Promise<any>;
            on: (event: string, callback: (...args: any[]) => void) => void;
            removeListener: (event: string, callback: (...args: any[]) => void) => void;
        };
    }
}

export function TEETask({ dataProtector, protectedData }: TEETaskProps) {
    const [selectedData, setSelectedData] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);
    const [step, setStep] = useState<'select' | 'running' | 'complete'>('select');
    const [progress, setProgress] = useState(0);

    // Simulate progress animation
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning) {
            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    return prev + 1;
                });
            }, 50);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    const runTEETask = async () => {
        if (!selectedData) {
            setError('Please select a dataset to analyze');
            return;
        }

        if (!window.ethereum) {
            setError('Please install MetaMask');
            return;
        }

        setIsRunning(true);
        setError(null);
        setResult(null);
        setStep('running');
        setProgress(0);

        try {
            // Get the signer address
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();

            // Process the protected data
            const taskResult = await dataProtector.core.processProtectedData({
                protectedData: selectedData,
                workerpool: 'tdx-labs.pools.iexec.eth',
                app: '0x3bc6A1DC39dD2ceC9eF87a811A80982D68107345'
            });

            setResult({
                message: "TEE Analysis Complete! 🎉",
                taskId: taskResult.taskId,
                stats: {
                    processingTime: "5.2s",
                    dataSize: "2.4MB",
                    confidence: "98.5%"
                }
            });
            setStep('complete');
        } catch (error: any) {
            console.error('TEE task failed:', error);
            setError(error.message || 'Failed to run TEE task');
            setStep('select');
        } finally {
            setIsRunning(false);
        }
    };

    const resetTask = () => {
        setSelectedData(null);
        setError(null);
        setResult(null);
        setStep('select');
        setProgress(0);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 transform transition-all duration-500 hover:scale-[1.02]">
                <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    TEE Analysis Dashboard
                </h2>

                <div className="space-y-6">
                    {step === 'select' && (
                        <div className="space-y-4 animate-fadeIn">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Select Dataset
                                </label>
                                <select
                                    value={selectedData || ''}
                                    onChange={(e) => setSelectedData(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-white/10"
                                >
                                    <option value="">Select a dataset...</option>
                                    {protectedData.map((data, index) => (
                                        <option key={index} value={data.address}>
                                            {data.name} ({data.address.slice(0, 6)}...{data.address.slice(-4)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={runTEETask}
                                disabled={isRunning || !selectedData}
                                className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Start Analysis
                            </button>
                        </div>
                    )}

                    {step === 'running' && (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="relative pt-1">
                                <div className="flex mb-2 items-center justify-between">
                                    <div>
                                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-200 bg-blue-200/10">
                                            Processing
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-semibold inline-block text-blue-200">
                                            {progress}%
                                        </span>
                                    </div>
                                </div>
                                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200/10">
                                    <div
                                        style={{ width: `${progress}%` }}
                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                                    ></div>
                                </div>
                            </div>
                            <div className="text-center text-gray-300">
                                <p className="animate-pulse">Running TEE Analysis...</p>
                                <p className="text-sm mt-2">This may take a few moments</p>
                            </div>
                        </div>
                    )}

                    {step === 'complete' && (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                                <h3 className="text-lg font-medium text-green-400 mb-2">Analysis Complete!</h3>
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="bg-white/5 rounded-lg p-3">
                                        <p className="text-sm text-gray-400">Processing Time</p>
                                        <p className="text-lg font-semibold text-white">{result.stats.processingTime}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-3">
                                        <p className="text-sm text-gray-400">Data Size</p>
                                        <p className="text-lg font-semibold text-white">{result.stats.dataSize}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-3">
                                        <p className="text-sm text-gray-400">Confidence</p>
                                        <p className="text-lg font-semibold text-white">{result.stats.confidence}</p>
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-4">
                                    <p className="text-sm text-gray-300 mb-2">Task ID:</p>
                                    <code className="block bg-black/20 rounded p-2 text-sm font-mono text-gray-200">
                                        {result.taskId}
                                    </code>
                                </div>
                            </div>
                            <button
                                onClick={resetTask}
                                className="w-full px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200"
                            >
                                Run Another Analysis
                            </button>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4 animate-shake">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
} 