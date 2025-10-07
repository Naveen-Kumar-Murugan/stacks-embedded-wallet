// frontend/services/stacksService.ts
import {
    buildUnsignedSTXTransfer,
    computePreSignHash,
    attachSignatureToUnsignedTx,
    broadcastSignedTxHex,
    SignerCallback,
} from "../../../packages/signing";
import { fetchBalance } from "../../../packages/balance";
import { fetchTxHistory } from "../../../packages/txhistory";

const HIRO_API = process.env.NEXT_PUBLIC_HIRO_API || "https://stacks-node-api.testnet.stacks.co";

export async function createUnsignedTransferAndPreSign(sender: string, recipient: string, amount: number, fee: number, nonce: number, network: "testnet" | "mainnet" = "testnet") {
    const { stacksTransaction, stacksTxSigner } = await buildUnsignedSTXTransfer({ sender, recipient, amount, fee, nonce, network: "testnet" });
    const preSignHash = computePreSignHash(stacksTransaction, stacksTxSigner);
    return { tx: stacksTransaction, preSignHash };
}

export async function signAttachAndBroadcast(unsignedTx: any, preSignHash: any, signerCb: SignerCallback, network: any) {
    const sig = await signerCb(preSignHash);

    const signedHex = attachSignatureToUnsignedTx(unsignedTx, sig as any);
    const res = await broadcastSignedTxHex(signedHex, network, HIRO_API);
    return res;
}

export async function getBalance(address: string) {
    return await fetchBalance(address, HIRO_API);
}

export async function getTxHistory(address: string) {
    return await fetchTxHistory(address, HIRO_API);
}
