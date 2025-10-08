import {
    makeUnsignedSTXTokenTransfer,
    UnsignedTokenTransferOptions,
    AnchorMode,
    createMessageSignature,
    SingleSigSpendingCondition,
    sigHashPreSign,
    TransactionSigner,
    broadcastTransaction,
    type StacksTransactionWire,
} from "@stacks/transactions";
import { bytesToHex, hexToBytes } from "@stacks/common";
import { Turnkey } from "@turnkey/sdk-server";

export type SignerCallback = (preSignHash: Uint8Array | string, acc: any) => Promise<{ v: number; r: string; s: string } | { compactHex: string }>;

const turnkeyClient = new Turnkey({
    apiBaseUrl: process.env.TURNKEY_API_BASE_URL!,
    apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
    apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
    defaultOrganizationId: process.env.TURNKEY_ORGANIZATION_ID!,
});

export async function buildUnsignedSTXTransfer(opts: {
    sender: string;
    recipient: string;
    amount: bigint | number;
    fee?: bigint | number;
    nonce?: bigint | number;
    network?: "testnet";
    memo?: string;
}) {
    const unsignedOpts: UnsignedTokenTransferOptions = {
        publicKey: opts.sender,
        recipient: opts.recipient,
        amount: BigInt(opts.amount),
        nonce: opts.nonce !== undefined ? BigInt(opts.nonce) : undefined,
        fee: opts.fee !== undefined ? BigInt(opts.fee) : undefined,
        anchorMode: AnchorMode.Any,
        memo: opts.memo || "",
        network: "testnet",
    } as any;

    console.log("Inside buildUnsignedSTXTransfer and unsignedOpts: ", unsignedOpts);
    const unsignedTx = await makeUnsignedSTXTokenTransfer(unsignedOpts);
    console.log("Inside buildUnsignedSTXTransfer and unsignedTx: ", unsignedTx);
    const signer = new TransactionSigner(unsignedTx);
    return { stacksTransaction: unsignedTx, stacksTxSigner: signer };
}

export function computePreSignHash(
    transaction: StacksTransactionWire,
    signer: TransactionSigner,
): string {
    let preSignSigHash = sigHashPreSign(
        signer.sigHash,
        transaction.auth.authType,
        transaction.auth.spendingCondition.fee,
        transaction.auth.spendingCondition.nonce,
    );

    return preSignSigHash;
}

export function attachSignatureToUnsignedTx(
    unsignedTx: any,
    signerSig: { v: number; r: string; s: string } | { compactHex: string }
) {
    let compactSigHex: string;

    if ("compactHex" in signerSig) {
        compactSigHex = signerSig.compactHex.replace(/^0x/, "");
    } else {
        // Normalize r, s, and v to correct format
        const rClean = signerSig.r.replace(/^0x/, "").padStart(64, "0");
        const sClean = signerSig.s.replace(/^0x/, "").padStart(64, "0");
        const vByte = signerSig.v.toString(16).padStart(2, "0"); // recovery byte

        // 🧩 correct order: v + r + s
        compactSigHex = `${vByte}${rClean}${sClean}`;
        console.log("Attaching signature:", {
            v: signerSig.v,
            r: signerSig.r,
            s: signerSig.s,
            compactSigHex,
        });
    }

    try {
        const spendingCondition =
            unsignedTx.auth.spendingCondition as SingleSigSpendingCondition;

        spendingCondition.signature = createMessageSignature(compactSigHex);
        return unsignedTx;
    } catch (err) {
        console.error("Failed to attach signature:", err);
        return undefined;
    }
}


export async function broadcastSignedTransaction(
    signedTx: StacksTransactionWire,
    network: "testnet" | "mainnet" = "testnet"
) {
    try {
        const result = await broadcastTransaction({
            transaction: signedTx,
            network: "testnet"
        });

        if ('error' in result) {
            console.error("Broadcast error details:", result);

            const reason = (result as any).reason;
            const reasonData = (result as any).reason_data;

            throw new Error(
                `${result.error} - ${reason || ""} ${reasonData ? JSON.stringify(reasonData) : ""
                }`
            );
        }

        console.log("Broadcast success:", result);
        return result;
    } catch (err) {
        console.error("Broadcast failed:", err);
        throw err;
    }
}