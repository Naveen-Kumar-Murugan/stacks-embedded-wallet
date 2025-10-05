import {
    StacksTransactionWire,
    createMessageSignature,
    isSingleSig
} from '@stacks/transactions';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import * as secp256k1 from '@noble/secp256k1';
import { Turnkey, TurnkeyApiClient } from "@turnkey/sdk-server";

export interface SignatureComponents {
    r: string;
    s: string;
    v: number;
}

export interface UnsignedTransactionData {
    transaction: StacksTransactionWire;
    sigHash: string;
    preSignSigHash: string;
}

/**
 * TransactionSigner handles the Stacks transaction signing flow:
 * 1. Generate sigHash from unsigned transaction
 * 2. Generate preSignSigHash
 * 3. Sign preSignSigHash (externally with Turnkey)
 * 4. Append signature to transaction
 */
export class TransactionSigner {
    /**
     * Step 1: Generate sigHash from unsigned transaction
     * The sigHash is the transaction hash with fee and nonce set to 0
     */
    static generateSigHash(transaction: StacksTransactionWire): string {
        // Use the built-in signBegin method which returns the sigHash
        const sigHash = transaction.signBegin();
        return sigHash;
    }

    /**
     * Step 2: Generate preSignSigHash
     * Combines sigHash with auth details (auth type, fee, nonce)
     */
    static generatePreSignSigHash(
        transaction: StacksTransactionWire,
        sigHash: string
    ): string {
        const tx = transaction;

        if (!isSingleSig(tx.auth.spendingCondition)) {
            throw new Error('Only single signature transactions are supported');
        }

        // Get spending condition details
        const spendingCondition = tx.auth.spendingCondition;
        const fee = spendingCondition.fee;
        const nonce = spendingCondition.nonce;

        // Create the pre-sign hash according to SIP-005
        // Format: sigHash + authFlag (0x04 for standard) + fee + nonce
        const authFlag = Buffer.from([0x04]); // Standard auth
        const feeBuffer = Buffer.alloc(8);
        feeBuffer.writeBigUInt64BE(BigInt(fee.toString()));

        const nonceBuffer = Buffer.alloc(8);
        nonceBuffer.writeBigUInt64BE(BigInt(nonce.toString()));

        // Combine all components
        const preSignSigHashBuffer = Buffer.concat([
            Buffer.from(sigHash, 'hex'),
            authFlag,
            feeBuffer,
            nonceBuffer,
        ]);

        // Hash the combined data
        const preSignSigHash = bytesToHex(sha256(preSignSigHashBuffer));

        return preSignSigHash;
    }

    /**
     * Prepare unsigned transaction data for external signing
     * Returns sigHash and preSignSigHash that need to be signed
     */
    static prepareForSigning(transaction: StacksTransactionWire): UnsignedTransactionData {
        const sigHash = this.generateSigHash(transaction);
        const preSignSigHash = this.generatePreSignSigHash(transaction, sigHash);

        return {
            transaction,
            sigHash,
            preSignSigHash,
        };
    }

    /**
     * Step 3: Sign the preSignSigHash using external signer (Turnkey)
     * This method would be called by Turnkey integration
     * Returns signature components in VRS format
     */
    TurnkeyApiClient = new Turnkey({
        apiBaseUrl: "https://api.turnkey.com",
        apiPublicKey: process.env.API_PUBLIC_KEY!,
        apiPrivateKey: process.env.API_PRIVATE_KEY!,
        defaultOrganizationId: process.env.ORGANIZATION_ID!,
    });

    // static async signWithKey(
    //   preSignSigHash: string,
    //   privateKeyHex: string
    // ): Promise<SignatureComponents> {
    //   // Remove the '01' suffix if present (Stacks private key format)
    //   const cleanPrivateKey = privateKeyHex.slice(0, 64);
    //   const privateKeyBytes = hexToBytes(cleanPrivateKey);
    //   const messageHash = hexToBytes(preSignSigHash);

    //   // Sign using secp256k1
    //   const signature = await secp256k1.signAsync(messageHash, privateKeyBytes, {
    //     recovered: true,
    //     der: false,
    //   });

    //   // Extract r, s, v components
    //   const r = bytesToHex(signature.slice(0, 32));
    //   const s = bytesToHex(signature.slice(32, 64));
    //   const v = signature[64]; // Recovery ID

    //   return { r, s, v };
    // }

    static async signWithTurnKey(
        preSignSigHash: string,
        TurnkeyApiClient: TurnkeyApiClient,   // your TurnKey client/SDK instance
        signWithAddress: string         // which key in TurnKey to use
    ): Promise<SignatureComponents> {
        // e.g. in TurnKey's sign raw payload API:
        const response = await TurnkeyApiClient.signRawPayload({
            signWith: signWithAddress,
            payload: preSignSigHash,
            encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
            hashFunction: "HASH_FUNCTION_NO_OP",
        });
        // TurnKey would return signature data, e.g. r, s, v
        return {
            r: response.r,
            s: response.s,
            v: Number(response.v),
        };
    }
    /**
     * Step 4: Concatenate signature components in VRS order
     */
    static formatSignature(components: SignatureComponents): string {
        const { v, r, s } = components;

        // Format: v (1 byte) + r (32 bytes) + s (32 bytes)
        const vHex = v.toString(16).padStart(2, '0');
        return `${vHex}${r}${s}`;
    }

    /**
     * Step 5: Append signature to transaction
     */
    static appendSignature(
        transaction: StacksTransactionWire,
        signatureHex: string
    ): StacksTransactionWire {
        const signature = createMessageSignature(signatureHex);

        if (!isSingleSig(transaction.auth.spendingCondition)) {
            throw new Error('Only single signature transactions are supported');
        }

        // Replace the empty signature with the actual signature
        transaction.auth.spendingCondition.signature = signature;

        return transaction;
    }

    /**
     * Complete signing flow (for local testing)
     * In production, step 3 would be replaced with Turnkey API call
     */
    static async signTransaction(
        transaction: StacksTransactionWire,
        TurnkeyApiClient: TurnkeyApiClient,
        signWithAddress: string
    ): Promise<StacksTransactionWire> {
        // Step 1 & 2: Prepare for signing
        const { preSignSigHash } = this.prepareForSigning(transaction);

        // Step 3: Sign (this would be done by Turnkey in production)
        const signatureComponents = await this.signWithTurnKey(
            preSignSigHash,
            TurnkeyApiClient,
            signWithAddress
        );

        // Step 4: Format signature
        const signatureHex = this.formatSignature(signatureComponents);

        // Step 5: Append to transaction
        const signedTransaction = this.appendSignature(transaction, signatureHex);

        return signedTransaction;
    }

    /**
     * Verify a signed transaction
     */
    static verifySignature(
        transaction: StacksTransactionWire,
        publicKey: string
    ): boolean {
        try {
            if (!isSingleSig(transaction.auth.spendingCondition)) {
                return false;
            }

            const sigHash = this.generateSigHash(transaction);
            const preSignSigHash = this.generatePreSignSigHash(transaction, sigHash);
            const signature = transaction.auth.spendingCondition.signature;

            // Convert signature hex data into bytes first
            const sigBytes = hexToBytes(signature.data);

            // Extract signature components
            const signatureData = sigBytes.slice(1); // Remove the first byte (type)
            const v = signatureData[0];
            const r = signatureData.slice(1, 33);
            const s = signatureData.slice(33, 65);

            // Verify using secp256k1
            const messageHash = hexToBytes(preSignSigHash);
            const publicKeyBytes = hexToBytes(publicKey);

            // Combine r and s into one 64-byte signature
            const fullSignature = new Uint8Array([...r, ...s]);

            return secp256k1.verify(fullSignature, messageHash, publicKeyBytes);
        } catch (error) {
            console.error("Signature verification failed:", error);
            return false;
        }
    }
    /**
     * Serialize signed transaction for broadcast
     */
    static serializeTransaction(transaction: StacksTransactionWire): string {
        return transaction.serialize().toString();
    }
}

/**
 * Helper class for handling transaction signing with external signers
 */
export class ExternalTransactionSigner {
    /**
     * Prepare transaction and get data that needs to be signed externally
     */
    static getSigningPayload(transaction: StacksTransactionWire): {
        preSignSigHash: string;
        sigHash: string;
    } {
        const { preSignSigHash, sigHash } = TransactionSigner.prepareForSigning(transaction);
        return { preSignSigHash, sigHash };
    }

    /**
     * Complete transaction after receiving signature from external signer
     */
    static completeTransaction(
        transaction: StacksTransactionWire,
        signatureComponents: SignatureComponents
    ): StacksTransactionWire {
        const signatureHex = TransactionSigner.formatSignature(signatureComponents);
        return TransactionSigner.appendSignature(transaction, signatureHex);
    }

    /**
     * Complete transaction with raw signature hex
     */
    static completeTransactionWithSignature(
        transaction: StacksTransactionWire,
        signatureHex: string
    ): StacksTransactionWire {
        return TransactionSigner.appendSignature(transaction, signatureHex);
    }
}