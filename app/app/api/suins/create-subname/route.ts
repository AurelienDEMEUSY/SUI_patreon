import { NextResponse } from "next/server";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuinsClient } from "@mysten/suins";
import { SuinsTransaction } from "@mysten/suins";
import {
    SUI_NETWORK,
    SUINS_PARENT_NFT_ID,
    SUINS_PARENT_NAME,
} from "@/lib/contract-constants";
import { findActiveServiceId } from "@/lib/service-lookup";

let suiClient: SuiJsonRpcClient | null = null;
let suinsClient: SuinsClient | null = null;

function getSuiClient(): SuiJsonRpcClient {
    if (!suiClient) {
        suiClient = new SuiJsonRpcClient({
            url: getJsonRpcFullnodeUrl(SUI_NETWORK),
            network: SUI_NETWORK,
        });
    }
    return suiClient;
}

function getSuinsClient(): SuinsClient {
    if (!suinsClient) {
        suinsClient = new SuinsClient({
            client: getSuiClient(),
            network: SUI_NETWORK as "testnet" | "mainnet",
        });
    }
    return suinsClient;
}

function getAdminKeypair(): Ed25519Keypair {
    const secret = process.env.SUINS_ADMIN_SECRET_KEY;
    if (!secret) {
        throw new Error(
            "SUINS_ADMIN_SECRET_KEY is not set. Add it to your .env.local."
        );
    }
    return Ed25519Keypair.fromSecretKey(secret);
}

function getServiceFields(serviceObject: any): any {
    if (serviceObject?.data?.content?.dataType !== "moveObject") return null;
    return serviceObject.data.content.fields;
}

async function getParentExpiration(client: SuiJsonRpcClient): Promise<string> {
    const parentObj = await client.getObject({
        id: SUINS_PARENT_NFT_ID,
        options: { showContent: true },
    });
    const fields = parentObj?.data?.content;
    if (fields?.dataType !== "moveObject") {
        throw new Error("Failed to read parent NFT object");
    }
    const expirationMs = (fields.fields as any)?.expiration_timestamp_ms;
    if (!expirationMs) {
        throw new Error("Parent NFT has no expiration_timestamp_ms");
    }
    return expirationMs;
}

export async function POST(request: Request) {
    let body: { creatorAddress: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON body" },
            { status: 400 },
        );
    }

    const { creatorAddress } = body;
    if (!creatorAddress || typeof creatorAddress !== "string") {
        return NextResponse.json(
            { error: "creatorAddress is required" },
            { status: 400 },
        );
    }

    try {
        const client = getSuiClient();

        const serviceObjectId = await findActiveServiceId(client, creatorAddress);
        if (!serviceObjectId) {
            return NextResponse.json(
                { error: "No active creator profile found for this address" },
                { status: 403 },
            );
        }

        const serviceObject = await client.getObject({
            id: serviceObjectId,
            options: { showContent: true },
        });

        const fields = getServiceFields(serviceObject);
        if (!fields) {
            return NextResponse.json(
                { error: "Failed to read Service object" },
                { status: 500 },
            );
        }

        if (fields.creator !== creatorAddress) {
            return NextResponse.json(
                { error: "Creator address mismatch" },
                { status: 403 },
            );
        }

        const existingSuins = fields.suins_name?.fields?.vec?.[0];
        if (existingSuins) {
            return NextResponse.json(
                {
                    error: "This creator already has a SuiNS name",
                    suinsName: existingSuins,
                },
                { status: 409 },
            );
        }

        const creatorName: string = fields.name;
        if (!creatorName || creatorName.trim().length === 0) {
            return NextResponse.json(
                { error: "Creator name is empty" },
                { status: 422 },
            );
        }

        const normalisedName = creatorName
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");

        if (normalisedName.length === 0) {
            return NextResponse.json(
                { error: "Creator name results in an empty subname after normalisation" },
                { status: 422 },
            );
        }

        const fullSubname = `${normalisedName}.${SUINS_PARENT_NAME}`;

        const suins = getSuinsClient();
        let alreadyExistsOnSuins = false;
        try {
            const existing = await suins.getNameRecord(fullSubname);
            if (existing) {
                alreadyExistsOnSuins = true;
            }
        } catch {
        }

        if (alreadyExistsOnSuins) {
            return NextResponse.json({
                success: true,
                suinsName: fullSubname,
                normalisedName,
                txDigest: null,
                note: "Subname already exists on SuiNS, skipped creation. Proceed with set_suins_name.",
            });
        }

        const parentExpirationMs = await getParentExpiration(client);
        const adminKeypair = getAdminKeypair();
        const tx = new Transaction();
        const suinsTx = new SuinsTransaction(suins, tx);

        const subNameNft = suinsTx.createSubName({
            parentNft: SUINS_PARENT_NFT_ID,
            name: fullSubname,
            expirationTimestampMs: Number(parentExpirationMs),
            allowChildCreation: false,
            allowTimeExtension: true,
        });

        suinsTx.setTargetAddress({
            nft: subNameNft,
            address: creatorAddress,
            isSubname: true,
        });

        tx.transferObjects([subNameNft], tx.pure.address(creatorAddress));

        tx.setSender(adminKeypair.toSuiAddress());

        const result = await client.signAndExecuteTransaction({
            transaction: tx,
            signer: adminKeypair,
            options: { showEffects: true },
        });

        await client.waitForTransaction({ digest: result.digest });

        return NextResponse.json({
            success: true,
            suinsName: fullSubname,
            normalisedName,
            txDigest: result.digest,
        });
    } catch (err) {
        console.error("[create-subname] error:", err);
        const message = err instanceof Error ? err.message : "Internal error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
