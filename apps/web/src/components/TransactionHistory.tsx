"use client"
import React, { useEffect, useState } from "react";
import { useTurnkey } from "@turnkey/react-wallet-kit";
import { getTxHistory } from "../../services/stacksService";

export default function TransactionHistory() {
    const turnkey = useTurnkey() as any;
    const [address, setAddress] = useState<string>("");
    const [txs, setTxs] = useState<any[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const accounts = await turnkey.getAccounts?.({ chain: "stacks" });
                const a = accounts?.[0]?.address;
                setAddress(a);
                if (a) {
                    const history = await getTxHistory(a);
                    setTxs(history?.results || history || []);
                }
            } catch (err) {
                console.error(err);
            }
        })();
    }, [turnkey]);

    return (
        <div>
            <div>Address: {address || "not logged-in or no wallet"}</div>
            <div style={{ marginTop: 8 }}>
                {txs.length === 0 ? <div>No transactions or loading...</div> : (
                    <ul>
                        {txs.map((t: any) => (
                            <li key={t.tx_id || t.tx_hash}>
                                <div>tx id: {t.tx_id || t.tx_hash}</div>
                                <div>type: {t.tx_type || t.type}</div>
                                <div>info: {JSON.stringify(t)}</div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
