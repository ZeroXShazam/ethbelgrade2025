import { useState } from 'react';
import { IExecDataProtector } from '@iexec/dataprotector';
import { validateJsonData, ValidationError, transformArraysToObjects } from '../lib/iexec';

interface DataProtectorProps {
    dataProtector: IExecDataProtector;
    onDataProtected?: (data: any) => void;
}

export function DataProtector({ dataProtector, onDataProtected }: DataProtectorProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<any>(null);
    const [transformedPreview, setTransformedPreview] = useState<any>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        setPreview(null);
        setTransformedPreview(null);
        
        if (!e.target.files || !e.target.files[0]) {
            return;
        }

        const selectedFile = e.target.files[0];
        
        // Validate file type
        if (!selectedFile.name.endsWith('.json')) {
            setError('Please upload a JSON file');
            return;
        }

        // Validate file size (max 1MB)
        if (selectedFile.size > 1024 * 1024) {
            setError('File size must be less than 1MB');
            return;
        }

        try {
            const content = await selectedFile.text();
            const data = JSON.parse(content);
            
            // Validate JSON structure
            validateJsonData(data);
            
            // Transform arrays to objects
            const transformed = transformArraysToObjects(data);
            
            setFile(selectedFile);
            setPreview(data);
            setTransformedPreview(transformed);
        } catch (error) {
            if (error instanceof ValidationError) {
                setError(error.message);
            } else if (error instanceof SyntaxError) {
                setError('Invalid JSON format');
            } else {
                setError('Failed to read file');
            }
            console.error('File validation error:', error);
        }
    };

    const protectData = async () => {
        if (!file || !transformedPreview) return;

        try {
            setIsUploading(true);
            setError(null);

            const protectedData = await dataProtector.core.protectData({
                name: file.name,
                data: transformedPreview
            });

            onDataProtected?.(protectedData);
            setFile(null);
            setPreview(null);
            setTransformedPreview(null);
        } catch (error: any) {
            console.error('Failed to protect data:', error);
            setError(error.message || 'Failed to protect data');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="border-2 border-dashed border-white/20 rounded-lg p-6">
                <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    disabled={isUploading}
                />
                <label
                    htmlFor="file-upload"
                    className={`flex flex-col items-center justify-center cursor-pointer ${
                        isUploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                    <div className="text-center">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                        >
                            <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <p className="mt-1 text-sm text-gray-300">
                            {file ? file.name : 'Click to upload JSON file'}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                            Max file size: 1MB
                        </p>
                    </div>
                </label>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {preview && (
                <div className="space-y-4">
                    <div className="bg-white/5 rounded-lg p-4">
                        <h4 className="text-sm font-medium mb-2">Original Data:</h4>
                        <pre className="text-xs text-gray-300 overflow-auto max-h-32">
                            {JSON.stringify(preview, null, 2)}
                        </pre>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                        <h4 className="text-sm font-medium mb-2">Transformed Data (for protection):</h4>
                        <pre className="text-xs text-gray-300 overflow-auto max-h-32">
                            {JSON.stringify(transformedPreview, null, 2)}
                        </pre>
                    </div>
                </div>
            )}

            {file && (
                <button
                    onClick={protectData}
                    disabled={isUploading}
                    className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUploading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Protecting...
                        </span>
                    ) : (
                        'Protect Data'
                    )}
                </button>
            )}
        </div>
    );
} 