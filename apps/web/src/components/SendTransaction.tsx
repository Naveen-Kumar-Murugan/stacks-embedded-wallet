import React, { useState } from "react";
import { useSendSTXTransaction, getBalance } from "../../services/stacksService";

interface Account {
    accountId: string;
    publicKey: string;
    address: string;
}

interface SendTransactionProps {
    account: Account;
}

export default function SendTransaction({ account }: SendTransactionProps) {
    const { sendSTXTransaction } = useSendSTXTransaction();

    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [fee, setFee] = useState("1000");
    const [memo, setMemo] = useState("");
    const [status, setStatus] = useState("");
    const [txId, setTxId] = useState("");
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState<string | null>(null);

    const handleSend = async () => {
        if (!recipient || !amount) {
            setStatus("Please fill in all required fields");
            return;
        }

        setLoading(true);
        setStatus("Preparing transaction...");
        setTxId("");

        try {
            const nonce = 0;
            const amountInMicroStx = Math.floor(parseFloat(amount) * 1_000_000);
            const feeInMicroStx = parseInt(fee);

            setStatus("Signing transaction with Turnkey...");

            const result = await sendSTXTransaction(
                account.publicKey,
                recipient,
                amountInMicroStx,
                feeInMicroStx,
                nonce,
                memo,
                "testnet"
            );

            // setTxId(result.txid);
            setStatus("Transaction broadcast successfully!");
            setRecipient("");
            setAmount("");
            setMemo("");
        } catch (error: any) {
            console.error("Transaction error:", error);
            setStatus(`Error: ${error.message || "Transaction failed"}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckBalance = async () => {
        setStatus("Fetching balance...");
        try {
            const { stx: balanceData } = await getBalance(account.address);
            setBalance(balanceData.toString());
            setStatus("");
        } catch (error: any) {
            console.error("Balance error:", error);
            setStatus(`Error fetching balance: ${error.message}`);
        }
    };

    return (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4">Send STX Transaction</h3>

            <div className="mb-3">
                <p className="text-sm text-gray-700">
                    <strong>From:</strong> {account.address}
                </p>
                <button
                    onClick={handleCheckBalance}
                    className="text-sm text-blue-600 hover:text-blue-700 mt-1"
                >
                    Check Balance
                </button>
                {balance && (
                    <p className="text-sm text-gray-600 mt-1">
                        Balance: {balance} STX
                    </p>
                )}
            </div>

            {/* Recipient */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                    Recipient Address *
                </label>
                <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="SP..."
                    className="w-full p-2 border border-gray-300 rounded-md"
                />
            </div>

            {/* Amount */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                    Amount (STX) *
                </label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.1"
                    step="0.000001"
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md"
                />
            </div>

            {/* Fee */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                    Fee (microSTX)
                </label>
                <input
                    type="number"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    placeholder="1000"
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md"
                />
            </div>

            {/* Memo */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Memo</label>
                <input
                    type="text"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="Optional memo"
                    className="w-full p-2 border border-gray-300 rounded-md"
                />
            </div>

            {/* Send Button */}
            <button
                onClick={handleSend}
                disabled={loading}
                className={`w-full py-3 rounded-md font-semibold transition ${loading
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
            >
                {loading ? "Processing..." : "Send Transaction"}
            </button>

            {status && (
                <div
                    className={`mt-4 p-3 rounded-md ${status.includes("Error")
                            ? "bg-red-100 text-red-700"
                            : status.includes("success")
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                        }`}
                >
                    {status}
                </div>
            )}

            {txId && (
                <div className="mt-4 p-3 bg-green-50 rounded-md">
                    <p className="font-semibold text-green-800 mb-2">
                        Transaction Submitted!
                    </p>
                    <p className="text-sm text-gray-700 break-all">TX ID: {txId}</p>
                    <a
                        href={`https://explorer.hiro.so/txid/${txId}?chain=testnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 underline"
                    >
                        View on Explorer
                    </a>
                </div>
            )}
        </div>
    );
}
