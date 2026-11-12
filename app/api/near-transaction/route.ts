import { NextResponse } from "next/server";
import { getTransaction } from "@/lib/near-rpc";
import { analyzeTransaction } from "@/lib/near-analysis";

const TX_HASH_REGEX = /^[0-9a-fA-F]{64}$/;
const NEAR_ACCOUNT_ID_REGEX = /^[a-z0-9._-]{2,64}$/;

function errorResponse(code: string, message: string, statusCode: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status: statusCode }
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    let body: { txHash?: unknown; senderAccountId?: unknown };
    try {
      body = (await request.json()) as { txHash?: unknown; senderAccountId?: unknown };
    } catch {
      return errorResponse("INVALID_REQUEST", "Invalid JSON request body.", 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return errorResponse("INVALID_REQUEST", "Request body must be a JSON object.", 400);
    }

    const txHash = body.txHash;
    if (typeof txHash !== "string" || txHash.length === 0) {
      return errorResponse("INVALID_REQUEST", "txHash is required.", 400);
    }

    if (!TX_HASH_REGEX.test(txHash)) {
      return errorResponse(
        "INVALID_REQUEST",
        "Invalid transaction hash format. Expected 64-character hex string.",
        400
      );
    }

    let senderAccountId: string | undefined;
    if (body.senderAccountId !== undefined) {
      if (typeof body.senderAccountId !== "string" || body.senderAccountId.length === 0) {
        return errorResponse("INVALID_REQUEST", "senderAccountId must be a non-empty string.", 400);
      }
      if (!NEAR_ACCOUNT_ID_REGEX.test(body.senderAccountId)) {
        return errorResponse(
          "INVALID_REQUEST",
          "Invalid senderAccountId format.",
          400
        );
      }
      senderAccountId = body.senderAccountId;
    }

    const network = "mainnet";
    const result = await getTransaction(txHash, senderAccountId, network);

    if (!result.ok) {
      if (result.error === "TRANSACTION_NOT_FOUND") {
        const analysis = analyzeTransaction(txHash, null, network, result.rpcSource || "unknown", new Date().toISOString());
        return NextResponse.json({
          success: true,
          analysis: {
            txHash: analysis.txHash,
            network: analysis.network,
            exists: false,
            riskIndicators: analysis.riskIndicators,
            positiveSignals: analysis.positiveSignals,
            limitations: analysis.limitations,
            rpcSource: analysis.rpcSource,
            timestamp: analysis.timestamp,
          },
        }, { status: 200 });
      }
      return errorResponse("RPC_ERROR", result.error, 502);
    }

    const analysis = analyzeTransaction(
      txHash,
      result.data,
      network,
      result.rpcSource,
      new Date().toISOString()
    );

    return NextResponse.json({
      success: true,
      analysis: {
        txHash: analysis.txHash,
        network: analysis.network,
        transaction: analysis.transaction,
        exists: analysis.exists,
        riskIndicators: analysis.riskIndicators,
        positiveSignals: analysis.positiveSignals,
        limitations: analysis.limitations,
        rpcSource: analysis.rpcSource,
        timestamp: analysis.timestamp,
      },
    }, { status: 200 });
  } catch {
    return errorResponse("UNKNOWN", "An unexpected error occurred.", 500);
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { success: false, error: { code: "INVALID_REQUEST", message: "Method not allowed. Use POST." } },
    { status: 405 }
  );
}

export async function PUT(): Promise<NextResponse> {
  return GET();
}

export async function DELETE(): Promise<NextResponse> {
  return GET();
}

export async function PATCH(): Promise<NextResponse> {
  return GET();
}
