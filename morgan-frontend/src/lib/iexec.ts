import { ethers } from 'ethers';
import { IExecDataProtector } from '@iexec/dataprotector';

export const IEXEC_CHAIN_ID = '0x86'; // 134 in hex for iExec Sidechain
export const IEXEC_RPC = 'https://bellecour.iex.ec';

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export function transformArraysToObjects(data: any): any {
    if (Array.isArray(data)) {
        // Convert array to object with numeric keys
        return data.reduce((obj: Record<string, any>, item, index) => {
            obj[index] = transformArraysToObjects(item);
            return obj;
        }, {});
    }

    if (data && typeof data === 'object') {
        // Recursively transform nested objects
        return Object.entries(data).reduce((obj: Record<string, any>, [key, value]) => {
            obj[key] = transformArraysToObjects(value);
            return obj;
        }, {});
    }

    return data;
}

export function validateJsonData(data: any): void {
    if (typeof data !== 'object' || data === null) {
        throw new ValidationError('Data must be a valid JSON object');
    }

    // Check for circular references
    try {
        JSON.stringify(data);
    } catch (e) {
        throw new ValidationError('Data contains circular references');
    }

    // Check for non-serializable values
    const hasInvalidValues = Object.values(data).some(value =>
        typeof value === 'function' ||
        typeof value === 'symbol' ||
        value instanceof Date
    );

    if (hasInvalidValues) {
        throw new ValidationError('Data contains non-serializable values');
    }
}

export async function getDataProtector(ethProvider: any): Promise<IExecDataProtector> {
    if (!ethProvider) {
        throw new Error('No Ethereum provider found. Please install MetaMask or another Web3 wallet.');
    }

    try {
        // First, request the correct chain
        try {
            await ethProvider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: IEXEC_CHAIN_ID }],
            });
        } catch (switchError: any) {
            if (switchError.code === 4902) {
                await ethProvider.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: IEXEC_CHAIN_ID,
                        chainName: 'iExec Sidechain',
                        nativeCurrency: {
                            name: 'xRLC',
                            symbol: 'xRLC',
                            decimals: 18
                        },
                        rpcUrls: [IEXEC_RPC],
                        blockExplorerUrls: ['https://explorer.iex.ec']
                    }]
                });
            } else {
                throw switchError;
            }
        }

        // Use the provider and signer from the user's wallet
        const provider = new ethers.BrowserProvider(ethProvider);
        const signer = await provider.getSigner();

        // Verify the signer is connected
        const address = await signer.getAddress();
        if (!address) {
            throw new Error('Failed to get signer address');
        }

        // Pass the signer directly to IExecDataProtector
        return new IExecDataProtector(signer);
    } catch (error: any) {
        if (error.code === 4001) {
            throw new Error('User rejected the connection request');
        }
        throw new Error(`Failed to initialize DataProtector: ${error.message}`);
    }
}

export async function getProtectedData(dataProtector: IExecDataProtector, ownerAddress: string) {
    try {
        const allData = await dataProtector.core.getProtectedData();
        return allData.filter(data =>
            data.owner.toLowerCase() === ownerAddress.toLowerCase()
        );
    } catch (error: any) {
        throw new Error(`Failed to fetch protected data: ${error.message}`);
    }
}
