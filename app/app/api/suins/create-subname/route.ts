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
import { findActiveServiceIdGraphQL } from "@/lib/graphql/queries/creators";

// ============================================================
// POST /api/suins/create-subname
// ============================================================
// Protected route: creates a **node** subname `<pseudo>.patreon.sui`
// as a real SubDomainRegistration NFT transferred to the creator.
//
// Body: { creatorAddress: string }
//
// Security checks:
//   1. creatorAddress must own an active Service on the platform
//   2. The Service.name is used to derive the subname (no client override)
//   3. The subname must not already exist on SuiNS
//   4. The Service.suins_name must not already be set (no duplicates)
// ============================================================

/** Lazy singleton clients — initialised once per cold start. */
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
    // Accepts both base64 (`suiprivkey1…`) and raw base64 formats
    return Ed25519Keypair.fromSecretKey(secret);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getServiceFields(serviceObject: any): any {
    if (serviceObject?.data?.content?.dataType !== "moveObject") return null;
    return serviceObject.data.content.fields;
}

/**
 * Fetch the expiration timestamp of the parent NFT (patreon.sui).
 * Node subnames must expire ≤ parent expiration.
 */
async function getParentExpiration(client: SuiJsonRpcClient): Promise<string> {
    const parentObj = await client.getObject({
        id: SUINS_PARENT_NFT_ID,
        options: { showContent: true },
    });
    const fields = parentObj?.data?.content;
    if (fields?.dataType !== "moveObject") {
        throw new Error("Failed to read parent NFT object");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expirationMs = (fields.fields as any)?.expiration_timestamp_ms;
    if (!expirationMs) {
        throw new Error("Parent NFT has no expiration_timestamp_ms");
    }
    return expirationMs;
}

export async function POST(request: Request) {
    // ----------------------------------------------------------------
    // 1. Parse & validate request body
    // ----------------------------------------------------------------
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

        // ----------------------------------------------------------------
        // 2. Verify the creator has an active Service on the platform
        // ----------------------------------------------------------------
        const serviceObjectId = await findActiveServiceIdGraphQL(creatorAddress);
        if (!serviceObjectId) {
            return NextResponse.json(
                { error: "No active creator profile found for this address" },
                { status: 403 },
            );
        }

        // ----------------------------------------------------------------
        // 3. Fetch the Service object to read the creator's name
        // ----------------------------------------------------------------
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

        // Guard: ensure the on-chain creator matches the request
        if (fields.creator !== creatorAddress) {
            return NextResponse.json(
                { error: "Creator address mismatch" },
                { status: 403 },
            );
        }

        // Guard: if suins_name is already set, the subname exists
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

        // ----------------------------------------------------------------
        // 4. Derive the subname from the Service.name
        // ----------------------------------------------------------------
        const creatorName: string = fields.name;
        if (!creatorName || creatorName.trim().length === 0) {
            return NextResponse.json(
                { error: "Creator name is empty" },
                { status: 422 },
            );
        }

        // Normalise: lowercase, trim, replace spaces with hyphens
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

        // ----------------------------------------------------------------
        // 5. Check the subname isn't already registered on SuiNS
        // ----------------------------------------------------------------
        const suins = getSuinsClient();
        let alreadyExistsOnSuins = false;
        try {
            const existing = await suins.getNameRecord(fullSubname);
            if (existing) {
                // Subname exists on SuiNS but the Service has no suins_name linked
                // (checked in step 3 above). This means a previous attempt created
                // the node subname but the contract link failed. Return success so
                // the frontend can proceed with set_suins_name.
                alreadyExistsOnSuins = true;
            }
        } catch {
            // getNameRecord throws if not found — that's what we want
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

        // ----------------------------------------------------------------
        // 6. Get the parent NFT expiration (node subnames must expire ≤ parent)
        // ----------------------------------------------------------------
        const parentExpirationMs = await getParentExpiration(client);

        // ----------------------------------------------------------------
        // 7. Build + sign + execute the node subname creation transaction.
        //    Creates a SubDomainRegistration NFT and transfers it
        //    to the creator — they truly own the name.
        // ----------------------------------------------------------------
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

        // Set the target address BEFORE transferring (NFT is consumed by transfer)
        suinsTx.setTargetAddress({
            nft: subNameNft,
            address: creatorAddress,
            isSubname: true,
        });

        // Transfer the SubDomainRegistration NFT to the creator
        tx.transferObjects([subNameNft], tx.pure.address(creatorAddress));

        tx.setSender(adminKeypair.toSuiAddress());

        const result = await client.signAndExecuteTransaction({
            transaction: tx,
            signer: adminKeypair,
            options: { showEffects: true },
        });

        await client.waitForTransaction({ digest: result.digest });

        // ----------------------------------------------------------------
        // 8. Return the subname so the frontend can call set_suins_name()
        //    client-side to link it to the Service object.
        // ----------------------------------------------------------------

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
