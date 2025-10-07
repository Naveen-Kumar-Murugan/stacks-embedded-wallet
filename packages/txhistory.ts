export async function fetchTxHistory(address: string, hiroApiUrl?: string) {
    const hiro = hiroApiUrl || "https://stacks-node-api.testnet.stacks.co";
    const url = `${hiro}/extended/v1/address/${address}/transactions`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch tx history: " + res.statusText);
    const json = await res.json();
    return json; // contains array of transactions
}
