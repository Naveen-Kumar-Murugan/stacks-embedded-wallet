import { useCallback } from "react";
import { useTurnkey } from "@turnkey/react-wallet-kit";

export function useTurnkeySignerAdapter() {
    const turnkey = useTurnkey() as any;
    const signer = useCallback(
        async (preSignHash: Uint8Array | string) => {
            const preSignHex = typeof preSignHash === "string" ? preSignHash : Buffer.from(preSignHash).toString("hex");
            const currentUser = await turnkey.getCurrentUser();
            const orgId = currentUser?.organization?.organizationId;
            const signRes = await turnkey.signRaw({
                organizationId: orgId,
                payloadHex: preSignHex,
                algorithm: "secp256k1",
            });
            if (signRes.compactHex) return { compactHex: signRes.compactHex };
            if (signRes.r && signRes.s && typeof signRes.v !== "undefined") return { r: signRes.r, s: signRes.s, v: signRes.v };
            if (signRes.signature) {
                const hex = Buffer.from(signRes.signature, "base64").toString("hex");
                return { compactHex: hex };
            }

            throw new Error("Unexpected signature format from Turnkey. Inspect signRes in console and adapt adapter.");
        },
        [turnkey]
    );

    return signer;
}
