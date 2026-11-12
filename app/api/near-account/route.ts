import { NextResponse } from "next/server";
import { queryAccount } from "@/lib/near-rpc";
import { analyzeAccount } from "@/lib/near-analysis";

const NEAR_ACCOUNT_ID_REGEX = /^[a-z0-9._-]{2,64}$/;

function errorResponse(code: string, message: string, statusCode: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status: statusCode }
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    let body: { accountId?: unknown };
    try {
      body = (await request.json()) as { accountId?: unknown };
    } catch {
      return errorResponse("INVALID_REQUEST", "Invalid JSON request body.", 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return errorResponse("INVALID_REQUEST", "Request body must be a JSON object.", 400);
    }

    const accountId = body.accountId;
    if (typeof accountId !== "string" || accountId.length === 0) {
      return errorResponse("INVALID_REQUEST", "accountId is required.", 400);
    }

    if (!NEAR_ACCOUNT_ID_REGEX.test(accountId)) {
      return errorResponse(
        "INVALID_REQUEST",
        "Invalid NEAR account ID format.",
        400
      );
    }

    const network = "mainnet";
    const result = await queryAccount(accountId, network);

    if (!result.ok) {
      if (result.error === "ACCOUNT_NOT_FOUND") {
        const analysis = analyzeAccount(accountId, null, network, result.rpcSource || "unknown", new Date().toISOString());
        return NextResponse.json({
          success: true,
          analysis: {
            accountId: analysis.accountId,
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

    const analysis = analyzeAccount(
      accountId,
      result.data,
      network,
      result.rpcSource,
      new Date().toISOString()
    );

    return NextResponse.json({
      success: true,
      analysis: {
        accountId: analysis.accountId,
        network: analysis.network,
        account: analysis.account,
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
