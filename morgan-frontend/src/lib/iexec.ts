import { ethers } from 'ethers';
import { IExecDataProtector } from '@iexec/dataprotector';

export function getDataProtector(ethProvider: any) {
    if (!ethProvider) throw new Error('No Ethereum provider found');

    const provider = new ethers.BrowserProvider(ethProvider);
    const signer = provider.getSigner();

    return new IExecDataProtector(signer);
}
