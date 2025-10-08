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
    const [selectedWallet, setSelectedWallet] = useState<any | null>(null);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
    const [status, setStatus] = useState<string>("");

    // Load user session
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

    // Load wallets after login
    useEffect(() => {
        if (user) loadWallets();
    }, [user]);

    const loadWallets = async () => {
        try {
            setStatus("Loading wallets...");
            const res = await fetchWallets();
            setWallets(res);
            setStatus("");
        } catch (err) {
            console.error("Error loading wallets:", err);
            setStatus("Failed to load wallets");
        }
    };

    const handleWalletSelect = async (walletId: string) => {
        if (!walletId) {
            setSelectedWallet(null);
            setAccounts([]);
            setSelectedAccount(null);
            return;
        }

        const wallet = wallets.find((w) => w.walletId === walletId);
        setSelectedWallet(wallet);
        setStatus("Loading accounts...");
        setAccounts([]);
        setSelectedAccount(null);

        try {
            const accRes = await fetchWalletAccounts({ wallet });

            const formatted = accRes.map((a: any) => {
                const pubKey = a?.publicKey || a?.compressedPublicKey;
                const address = pubKey
                    ? getAddressFromPublicKey(pubKey, STACKS_TESTNET)
                    : "Unknown";
                return { ...a, address };
            });
            console.log("formatted, ", formatted);
            setAccounts(formatted);
            setStatus("");
        } catch (err) {
            console.error("Error loading accounts:", err);
            setStatus("Failed to load accounts");
        }
    };

    const handleAccountSelect = (address: string) => {
        const acc = accounts.find((a) => a.address === address);
        setSelectedAccount(acc || null);
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

            {/* Refresh Wallets */}
            <button
                onClick={loadWallets}
                className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition mb-4"
            >
                Refresh Wallets
            </button>

            {/* Wallet Selector */}
            <h3 className="font-bold text-lg mb-2">Select Wallet</h3>
            {wallets.length === 0 ? (
                <p>No wallets found.</p>
            ) : (
                <select
                    value={selectedWallet?.walletId || ""}
                    onChange={(e) => handleWalletSelect(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md mb-4"
                >
                    <option value="">-- Choose Wallet --</option>
                    {wallets.map((w) => (
                        <option key={w.walletId} value={w.walletId}>
                            {w.walletName} ({w.walletId.slice(0, 6)}…)
                        </option>
                    ))}
                </select>
            )}

            {/* Account Selector */}
            {selectedWallet && (
                <>
                    <h3 className="font-bold text-lg mt-6 mb-2">Select Account</h3>
                    {accounts.length === 0 ? (
                        <p>No accounts found for this wallet.</p>
                    ) : (
                        <select
                            value={selectedAccount?.address || ""}
                            onChange={(e) => handleAccountSelect(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md mb-4"
                        >
                            <option value="">-- Choose Account --</option>
                            {accounts.map((acc) => (
                                <option key={acc.address} value={acc.address}>
                                    {acc.address.slice(0, 10)}...{acc.address.slice(-6)}
                                </option>
                            ))}
                        </select>
                    )}
                </>
            )}

            {/* Send Transaction */}
            {selectedAccount && (
                <SendTransaction account={selectedAccount} />
            )}

            {/* Wallet Info (optional) */}
            {selectedWallet && accounts.length > 0 && (
                <WalletInfo
                    addresses={accounts.map((a: any) => a.address)}
                />
            )}

            {status && <p className="text-blue-600 mt-4">{status}</p>}
        </div>
    );
}
