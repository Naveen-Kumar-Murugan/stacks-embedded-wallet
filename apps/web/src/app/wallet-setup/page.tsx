"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useTurnkey } from "@turnkey/react-wallet-kit";
import { access } from "fs";

export default function WalletSetupPage() {
    const router = useRouter();
    const { createWallet, fetchUser } = useTurnkey();

    const handleCreateWallet = async () => {
        const user = await fetchUser();
        if (!user) {
            alert("Please login first");
            router.push("/login-or-signup");
            return;
        }

        try {
            const wallet = await createWallet({
                walletName: "My Stacks Wallet",
                accounts: [
                    {
                        curve: "CURVE_SECP256K1",
                        pathFormat: "PATH_FORMAT_BIP32",
                        path: "m/44'/5757'/0'/0/0",
                        addressFormat: "ADDRESS_FORMAT_COMPRESSED",
                    },
                ],
                // accounts: ["ADDRESS_FORMAT_COMPRESSED"],
            });

            console.log("Wallet created:", wallet);
            router.push("/dashboard");
        } catch (err) {
            console.error(err);
            alert("Error creating wallet");
        }
    };

    const handleImportWallet = async () => {
        alert("Import wallet flow coming soon!");
        router.push("/dashboard");
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen text-center">
            <h1 className="text-2xl font-bold mb-6">Set Up Your Wallet</h1>
            <div className="flex gap-6">
                <button
                    onClick={handleCreateWallet}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
                >
                    Create New Wallet
                </button>
                <button
                    onClick={handleImportWallet}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition"
                >
                    Import Existing Wallet
                </button>
            </div>
        </div>
    );
}
