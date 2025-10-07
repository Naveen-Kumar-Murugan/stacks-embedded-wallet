import {
    makeUnsignedSTXTokenTransfer,
    UnsignedTokenTransferOptions,
    AnchorMode,
    createMessageSignature,
    SingleSigSpendingCondition,
    sigHashPreSign,
    TransactionSigner,
    type StacksTransactionWire,
} from "@stacks/transactions";
import { bytesToHex, hexToBytes } from "@stacks/common";

export type SignerCallback = (preSignHash: Uint8Array | string) => Promise<{ v: number; r: string; s: string } | { compactHex: string }>;


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
};


export function attachSignatureToUnsignedTx(unsignedTx: any, signerSig: { v: number; r: string; s: string } | { compactHex: string }) {
    let vrsBytes: Uint8Array;
    if ("compactHex" in signerSig) {
        vrsBytes = hexToBytes(signerSig.compactHex);
    } else {
        const r = signerSig.r.startsWith("0x") ? signerSig.r.slice(2) : signerSig.r;
        const s = signerSig.s.startsWith("0x") ? signerSig.s.slice(2) : signerSig.s;
        const v = Number(signerSig.v);
        const compactHex = r + s + v.toString(16).padStart(2, "0");
        vrsBytes = hexToBytes(compactHex);
    }

    try {
        const spendingCondition = unsignedTx.auth.spendingCondition as SingleSigSpendingCondition;
        spendingCondition.signature = createMessageSignature(bytesToHex(vrsBytes));

        return unsignedTx;
    } catch (err) {
        console.error("Signing failed:", err);
        return undefined;
    }
    // Different transaction types and SDK versions require slightly different API calls.
    // We'll attempt the most common approach: use TransactionSigner to set origin signature.
    //   try {
    //     const signer = new TransactionSigner(deserialized as any);
    //     // There isn't a direct 'set signature bytes' helper exposed in older SDKs.
    //     // If `signer.signOriginWithSignature` or similar exists in your SDK please use it.
    //     // We'll attempt to use `signer.addSignature` pattern — if missing, user should
    //     // replace this with the library-specific call.
    //     if (typeof (signer as any).signOriginWithSignature === "function") {
    //       // hypothetical helper used by some stacks.js versions
    //       (signer as any).signOriginWithSignature(vrsBytes);
    //     } else if (typeof (deserialized as any).setSignature === "function") {
    //       // another possible internal helper
    //       (deserialized as any).setSignature(vrsBytes);
    //     } else {
    //       // last resort: attempt direct manipulation of spendingCondition
    //       // WARNING: this touches internal SDK structure and might need adjustment
    //       const auth = (deserialized as any).auth;
    //       if (!auth) throw new Error("transaction auth structure not found");
    //       // originCondition
    //       const origin = auth.spendingCondition || auth.spendingConditionOrigin || auth.principal;
    //       if (!origin) throw new Error("spendingCondition not found for attaching signature");
    //       origin.signature = vrsBytes;
    //     }
    //   } catch (err) {
    //     // If attaching fails, throw a clear error so the developer can map the correct SDK call
    //     throw new Error(
    //       "attaching signature failed — SDK versions differ. See README and stacks.js docs. Inner: " + (err as Error).message
    //     );
    //   }

    // Serialize signed tx and return hex
    //   const signedSerialized = deserialized.serialize();
    //   return signedSerialized;
}

export async function broadcastSignedTxHex(signedTxHex: string, networkName: "testnet" | "mainnet" = "testnet", hiroApiUrl?: string) {
    const endpoint = hiroApiUrl || (networkName === "testnet" ? "https://stacks-node-api.testnet.stacks.co" : "https://stacks-node-api.mainnet.stacks.co");
    const url = `${endpoint}/v2/transactions`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: Buffer.from(signedTxHex, "hex"),
    });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Broadcast failed: ${res.status} ${txt}`);
    }
    const body = await res.json();
    return body;
}