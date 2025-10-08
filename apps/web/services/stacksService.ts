// frontend/services/stacksService.ts
import { useTurnkey } from "@turnkey/react-wallet-kit";
import {
    buildUnsignedSTXTransfer,
    attachSignatureToUnsignedTx,
    broadcastSignedTransaction,
    computePreSignHash,
} from "../../../packages/signing";
import { fetchBalance } from "../../../packages/balance";
import { fetchTxHistory } from "../../../packages/txhistory";

const HIRO_API = process.env.NEXT_PUBLIC_HIRO_API || "https://stacks-node-api.testnet.stacks.co";

export function useSendSTXTransaction() {
    const { httpClient } = useTurnkey();

    const sendSTXTransaction = async (
        address: string,
        recipient: string,
        amount: number,
        fee: number,
        nonce: number,
        memo = "",
        network: "testnet" | "mainnet" = "testnet"
    ) => {
        const { stacksTransaction, stacksTxSigner } = await buildUnsignedSTXTransfer({
            sender: address,
            recipient,
            amount,
            fee,
            nonce,
            network: "testnet",
            memo,
        });

        console.log("Unsigned TX:", stacksTransaction);

        const preSignHash = computePreSignHash(stacksTransaction, stacksTxSigner);
        const payloadToSign = preSignHash.startsWith("0x") ? preSignHash : `0x${preSignHash}`;

        console.log("Payload to sign:", payloadToSign);

        let signWith = address;

        if (!httpClient) {
            throw new Error("httpClient is undefined");
        }

        const signResponse = await httpClient.signRawPayload({
            signWith,
            payload: payloadToSign,
            encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
            hashFunction: "HASH_FUNCTION_NO_OP",
        });


        const sigResult = signResponse.activity?.result?.signRawPayloadResult;
        if (!sigResult) throw new Error("Failed to get signature from Turnkey");

        const { r, s, v } = sigResult;
        const signature = { r, s, v: parseInt(v, 16) };

        const signedTx = attachSignatureToUnsignedTx(stacksTransaction, signature);
        if (!signedTx) throw new Error("Failed to attach signature");

        console.log("Signed TX:", signedTx);

        // 🚀 Broadcast using stacks/transactions
        const result = await broadcastSignedTransaction(signedTx, network);
        console.log("Broadcast Result:", result);

        return result;
    };

    return { sendSTXTransaction };
}

export async function getBalance(address: string) {
    return await fetchBalance(address, HIRO_API);
}

export async function getTxHistory(address: string) {
    return await fetchTxHistory(address, HIRO_API);
}
