// "use client"
// import React, { useEffect, useState } from "react";
// import { useTurnkey } from "@turnkey/react-wallet-kit";
// import { getBalance } from "../../services/stacksService";

// export default function WalletInfo() {
//     const { fetchUser, fetchWallets, fetchWalletAccounts } = useTurnkey();
//     const [addresses, setAddresses] = useState<string[]>([]);
//     const [balances, setBalances] = useState<Record<string, any>>({});
//     let user, res, accounts;

//     useEffect(() => {
//         (async () => {
//             try {
//                 user = await fetchUser();
//                 res = await fetchWallets();
//                 accounts = await fetchWalletAccounts({ wallet: res[0] });
//                 console.log("user", user);
//                 if (!user) return;
//                 console.log("accounts", accounts);
//                 const addrs = accounts?.map((a: any) => a.address).filter(Boolean) ?? [];
//                 setAddresses(addrs);
//                 const bmap: Record<string, any> = {};
//                 await Promise.all(
//                     addrs.map(async (addr: string) => {
//                         const b = await getBalance(addr);
//                         bmap[addr] = b;
//                     })
//                 );
//                 setBalances(bmap);
//             } catch (err) {
//                 console.error("wallet info err", err);
//             }
//         })();
//     }, [user, res, accounts]);

//     return (
//         <div>
//             <div>
//                 <strong>Accounts inside wallet:</strong>
//             </div>
//             {addresses.length === 0 ? (
//                 <div>No accounts found (login + create wallet first)</div>
//             ) : (
//                 <ul>
//                     {addresses.map((a) => (
//                         <li key={a}>
//                             <div>Address: {a}</div>
//                             <div>Balance: {balances[a] ? `${balances[a].stx} STX` : "loading..."}</div>
//                         </li>
//                     ))}
//                 </ul>
//             )}
//         </div>
//     );
// }


"use client";

import React, { useEffect, useState } from "react";
import { getBalance } from "../../services/stacksService";

interface WalletInfoProps {
    addresses: string[];
}

export default function WalletInfo({ addresses }: WalletInfoProps) {
    const [balances, setBalances] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!addresses || addresses.length === 0) return;

        const fetchBalances = async () => {
            const newBalances: Record<string, string> = {};
            await Promise.all(
                addresses.map(async (addr) => {
                    try {
                        const bal = await getBalance(addr);
                        newBalances[addr] = (bal.stx).toString() || "0";
                    } catch (err) {
                        console.error("Failed to get balance for", addr, err);
                        newBalances[addr] = "error";
                    }
                })
            );
            setBalances(newBalances);
        };

        fetchBalances();
    }, [addresses]);

    return (
        <div className="mt-8">
            <h3 className="font-semibold text-lg mb-2">Wallet Balances</h3>
            {addresses.length === 0 ? (
                <p>No wallet addresses found.</p>
            ) : (
                <ul className="space-y-3">
                    {addresses.map((a) => (
                        <li
                            key={a}
                            className="bg-gray-100 rounded-md p-3 text-sm flex flex-col"
                        >
                            <span className="font-medium">Address: {a}</span>
                            <span className="text-gray-600">
                                Balance:{" "}
                                {balances[a]
                                    ? `${balances[a]} STX`
                                    : "Fetching..."}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
