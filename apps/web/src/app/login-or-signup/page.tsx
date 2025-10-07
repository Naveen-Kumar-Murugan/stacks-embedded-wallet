// "use client";
// import React, { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { useTurnkey } from "@turnkey/react-wallet-kit";

// export default function LoginOrSignupPage() {
//     const router = useRouter();
//     const { handleLogin, fetchUser } = useTurnkey();

//     useEffect(() => {
//         (async () => {
//             const currentUser = await fetchUser();
//             if (currentUser) router.push("/dashboard");
//         })();
//     }, []);

//     const handleAuth = async () => {
//         await handleLogin();
//         router.push("/wallet-setup");
//     };

//     return (
//         <div className="flex flex-col items-center justify-center h-screen text-center">
//             <h1 className="text-3xl font-bold mb-6">Welcome to Embedded Wallet MVP</h1>
//             <p className="text-gray-500 mb-6">
//                 Sign in or create your account to continue
//             </p>
//             <button
//                 onClick={handleAuth}
//                 className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
//             >
//                 Sign in / Sign up with Turnkey
//             </button>
//         </div>
//     );
// }


"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTurnkey } from "@turnkey/react-wallet-kit";

export default function LoginOrSignupPage() {
    const router = useRouter();
    const { handleLogin, fetchUser, fetchWallets } = useTurnkey();
    const [isLoading, setIsLoading] = useState(false);

    const handleAuth = async (isSignup: boolean) => {
        try {
            setIsLoading(true);
            await handleLogin();
            const userData = await fetchUser();
            console.log("Authenticated User:", userData);
            const hasWallet = fetchWallets();
            if (isSignup || !hasWallet) {
                router.push("/wallet-setup");
            } else {
                console.log("In handle Auth")
                router.push("/dashboard");
            }
        } catch (err) {
            console.error("Auth Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <h1 className="text-2xl font-semibold mb-4">Login or Sign Up</h1>

            <button
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                onClick={() => handleAuth(true)}
                disabled={isLoading}
            >
                {isLoading ? "Signing Up..." : "Sign Up"}
            </button>

            <button
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
                onClick={() => handleAuth(false)}
                disabled={isLoading}
            >
                {isLoading ? "Logging In..." : "Login"}
            </button>
        </div>
    );
}
