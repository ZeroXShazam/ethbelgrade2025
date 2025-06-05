import { useState } from 'react';
import { IExecDataProtector } from '@iexec/dataprotector';

interface AnalysisRequestProps {
    dataProtector: IExecDataProtector;
    protectedData: any[];
}

export function AnalysisRequest({ dataProtector, protectedData }: AnalysisRequestProps) {
    const [selectedData, setSelectedData] = useState<string | null>(null);
    const [isRequesting, setIsRequesting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRequestAnalysis = async () => {
        if (!selectedData) {
            setError('Please select a dataset to analyze');
            return;
        }

        try {
            setIsRequesting(true);
            setError(null);

            // TODO: Implement the actual analysis request
            // This will be implemented when we have the backend ready
            console.log('Requesting analysis for:', selectedData);

            // Simulate a delay for now
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error: any) {
            console.error('Failed to request analysis:', error);
            setError(error.message || 'Failed to request analysis');
        } finally {
            setIsRequesting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                <h2 className="text-2xl font-semibold mb-4">Request Analysis</h2>

                {error && (
                    <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Select Dataset to Analyze
                        </label>
                        <select
                            value={selectedData || ''}
                            onChange={(e) => setSelectedData(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        onClick={handleRequestAnalysis}
                        disabled={isRequesting || !selectedData}
                        className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isRequesting ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Requesting Analysis...
                            </span>
                        ) : (
                            'Request Analysis'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
} 