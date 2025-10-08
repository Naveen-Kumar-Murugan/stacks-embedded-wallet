export async function fetchBalance(address: string, hiroApiUrl?: string) {
    const hiro = hiroApiUrl || "https://stacks-node-api.testnet.stacks.co";
    const url = `${hiro}/v2/accounts/${address}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch balance: " + res.statusText);
    const json = await res.json();
    const balanceMicro = BigInt(json.balance || "0");
    const stx = Number(balanceMicro) / 1e6;
    return { microstx: balanceMicro.toString(), stx };
}
