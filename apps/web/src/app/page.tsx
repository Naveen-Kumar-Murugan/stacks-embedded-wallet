import React from "react";
import WalletInfo from "../components/WalletInfo";
import SendTransaction from "../components/SendTransaction";
import TransactionHistory from "../components/TransactionHistory";

export default function Home() {
  return (
    <div>
      Hi
      {/* <SendTransaction /> */}
      {/* <WalletInfo/> */}
      <TransactionHistory />
    </div>

  );
}