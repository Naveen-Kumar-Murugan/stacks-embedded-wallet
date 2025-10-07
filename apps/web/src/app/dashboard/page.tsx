"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTurnkey } from "@turnkey/react-wallet-kit";
import { getAddressFromPublicKey } from "@stacks/transactions";
import { STACKS_TESTNET } from "@stacks/network";
import SendTransaction from "../../components/SendTransaction";
import WalletInfo from "../../components/WalletInfo";

export default function DashboardPage() {
    const router = useRouter();
    const { user, fetchUser, logout, fetchWallets, fetchWalletAccounts } = useTurnkey();

    const [wallets, setWallets] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [stacksAddresses, setStacksAddresses] = useState<string[]>([]);
    const [status, setStatus] = useState<string>("");

    // ✅ Step 1: Ensure user session is restored on page reload
    useEffect(() => {
        const restoreUser = async () => {
            const u = await fetchUser();
            if (!u) {
                router.push("/login-or-signup");
                return;
            }
        };
        restoreUser();
    }, []);

    // ✅ Step 2: When user is available, automatically load wallets
    useEffect(() => {
        if (user) {
            loadWallets();
        }
    }, [user]); // ← this is key

    const loadWallets = async () => {
        try {
            setStatus("Loading wallets...");
            const res = await fetchWallets();
            setWallets(res);

            if (res.length > 0) {
                const accRes = await fetchWalletAccounts({ wallet: res[0] });
                setAccounts(accRes);

                const stxAddrs = accRes
                    .map((a: any) => {
                        const pubKey = a?.publicKey || a?.compressedPublicKey;
                        if (!pubKey) return null;
                        return getAddressFromPublicKey(pubKey, STACKS_TESTNET);
                    })
                    .filter(Boolean);
                setStacksAddresses(stxAddrs as string[]);
            }

            setStatus("");
        } catch (err) {
            console.error("Error loading wallets:", err);
            setStatus("Failed to load wallets");
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push("/login-or-signup");
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between mb-8">
                <h2 className="text-xl font-semibold">
                    Welcome, {user?.userName || "User"}
                </h2>
                <button
                    onClick={handleLogout}
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
                >
                    Logout
                </button>
            </div>

            {/* Refresh */}
            <button
                onClick={loadWallets}
                className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition mb-4"
            >
                Refresh Wallets
            </button>

            {/* Wallets */}
            <h3 className="font-bold text-lg mb-2">Wallets</h3>
            {wallets.length === 0 ? (
                <p>No wallets found.</p>
            ) : (
                wallets.map((w) => (
                    <div key={w.walletId} className="p-4 bg-gray-100 rounded-md mb-2">
                        <div className="font-semibold">{w.walletName}</div>
                        <div className="text-sm text-gray-500">{w.walletId}</div>
                    </div>
                ))
            )}

            {/* Accounts */}
            <h3 className="font-bold text-lg mt-6 mb-2">Accounts</h3>
            {accounts.length === 0 ? (
                <p>No accounts found.</p>
            ) : (
                accounts.map((a, i) => (
                    <div key={a.accountId} className="p-4 bg-gray-100 rounded-md mb-2">
                        <div className="text-sm font-medium text-blue-600">
                            STACKS (Testnet)
                        </div>
                        <div className="text-sm text-gray-800">{stacksAddresses[i]}</div>
                    </div>
                ))
            )}

            {stacksAddresses.length > 0 ? (
                <SendTransaction senderAddress={stacksAddresses[0]} />
            ) : (
                <p className="text-gray-500 mt-4">No sender address available for transactions.</p>
            )}

            {/* Wallet Info */}
            {stacksAddresses.length > 0 && <WalletInfo addresses={stacksAddresses} />}

            {status && <p className="text-blue-600 mt-4">{status}</p>}
        </div>
    );
}
