import { ethers } from 'ethers';
import { IExecDataProtector } from '@iexec/dataprotector';

const IEXEC_CHAIN_ID = '0x86'; // 134 in hex for iExec Sidechain
const IEXEC_RPC = 'https://bellecour.iex.ec'; // This is the mainnet RPC

export async function getDataProtector(ethProvider: any) {
    if (!ethProvider) throw new Error('No Ethereum provider found');

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

    // Create a Web3Provider with the correct chain
    const provider = new ethers.BrowserProvider(ethProvider);

    // Get the signer
    const signer = await provider.getSigner();

    return new IExecDataProtector(signer);
}
