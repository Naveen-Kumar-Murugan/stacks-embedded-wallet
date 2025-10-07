"use client";
import React, { useState } from "react";
import { useTurnkeySignerAdapter } from "../../services/trunkyClient";
import { createUnsignedTransferAndPreSign, signAttachAndBroadcast } from "../../services/stacksService";
import { STACKS_TESTNET } from "@stacks/network";

interface SendTransactionProps {
    senderAddress: string;
}

export default function SendTransaction({ senderAddress }: SendTransactionProps) {
    const turnkeySigner = useTurnkeySignerAdapter();
    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState<number>(0);
    const [fee, setFee] = useState<number>(5000);
    const [nonce, setNonce] = useState<number | undefined>(undefined);
    const [status, setStatus] = useState<string>("");
    const network = STACKS_TESTNET;

    async function handleSend() {
        setStatus("Preparing unsigned tx...");
        try {
            if (!senderAddress) throw new Error("No sender address provided.");

            const n = nonce ?? 0;

            const { tx: unsignedTx, preSignHash } = await createUnsignedTransferAndPreSign(
                senderAddress,
                recipient,
                amount,
                fee,
                n,
                "testnet"
            );

            setStatus("Computing preSign hash and asking Turnkey to sign...");
            const res = await signAttachAndBroadcast(unsignedTx, preSignHash, turnkeySigner, network);
            setStatus("Broadcast result: " + JSON.stringify(res));
        } catch (err: any) {
            setStatus("Error: " + err?.message);
            console.error(err);
        }
    }

    return (
        <div className="mt-8 p-4 border rounded-md bg-white shadow-sm">
            <h3 className="font-semibold mb-4">Send STX Transaction</h3>
            <div className="mb-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Sender</label>
                <input
                    readOnly
                    value={senderAddress || ""}
                    className="w-full px-3 py-2 border rounded-md bg-gray-100 text-gray-800"
                />
            </div>
            <div className="mb-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Recipient (STX address)</label>
                <input
                    placeholder="STX address"
                    onChange={(e) => setRecipient(e.target.value)}
                    value={recipient}
                    className="w-full px-3 py-2 border rounded-md"
                />
            </div>
            <div className="flex space-x-2 mb-2">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Amount (STX)</label>
                    <input
                        type="number"
                        placeholder="Amount"
                        onChange={(e) => setAmount(Number(e.target.value))}
                        value={amount}
                        className="w-full px-3 py-2 border rounded-md"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Fee (microSTX)</label>
                    <input
                        type="number"
                        placeholder="Fee"
                        onChange={(e) => setFee(Number(e.target.value))}
                        value={fee}
                        className="w-full px-3 py-2 border rounded-md"
                    />
                </div>
            </div>
            <button
                onClick={handleSend}
                className="w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 transition"
            >
                Send Transaction
            </button>
            {status && <div className="mt-3 text-sm text-gray-700">{status}</div>}
        </div>
    );
}
