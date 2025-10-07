import { useTurnkey } from "@turnkey/react-wallet-kit";
import { getAddressFromPublicKey } from "@stacks/transactions";

export async function getTurnkeyWalletAddress() {
    const turnkey = useTurnkey() as any;
    const currentUser = await turnkey.getCurrentUser();

    const wallet = currentUser?.wallets?.[0];
    const account = wallet?.accounts?.[0];

    if (!account?.publicKey) {
        throw new Error("No Turnkey account or public key found.");
    }

    const stacksAddress = getAddressFromPublicKey(account.publicKey, "testnet");

    return {
        address: stacksAddress,
        publicKey: account.publicKey,
        keyId: account.id,
    };
}
