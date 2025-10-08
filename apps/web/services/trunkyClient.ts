import { useCallback } from "react";
import { useTurnkey } from "@turnkey/react-wallet-kit";

export function useTurnkeySignerAdapter() {
    const { signTransaction } = useTurnkey() as any;
    const signer = useCallback(
        async (preSignHash: Uint8Array | string, acc: any) => {
            const preSignHex = typeof preSignHash === "string" ? preSignHash : Buffer.from(preSignHash).toString("hex");
            const signRes = await signTransaction({
                transactionType: "TRANSACTION_TYPE_TRON",
                unsignedTransaction: preSignHex,
                walletAccount: acc,
            });
            if (signRes.compactHex) return { compactHex: signRes.compactHex };
            if (signRes.r && signRes.s && typeof signRes.v !== "undefined") return { r: signRes.r, s: signRes.s, v: signRes.v };
            if (signRes.signature) {
                const hex = Buffer.from(signRes.signature, "base64").toString("hex");
                return { compactHex: hex };
            }

            throw new Error("Unexpected signature format from Turnkey. Inspect signRes in console and adapt adapter.");
        },
        []
    );

    return signer;
}
