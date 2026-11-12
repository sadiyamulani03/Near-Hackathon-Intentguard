import { NextResponse } from "next/server";
import { analyzeContract, validateSourceCode, ScanError } from "@/lib/scan";

const MAX_REQUEST_BODY_BYTES = 64 * 1024;

function errorResponse(error: ScanError): NextResponse {
  return NextResponse.json(
    { success: false, error: { code: error.code, message: error.message } },
    { status: error.statusCode }
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const contentLength = request.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_REQUEST_BODY_BYTES) {
      return errorResponse({
        code: "INPUT_TOO_LARGE",
        message: `Request body exceeds ${Math.floor(MAX_REQUEST_BODY_BYTES / 1024)} KB.`,
        statusCode: 413,
      });
    }

    let body: { sourceCode?: unknown };
    try {
      body = (await request.json()) as { sourceCode?: unknown };
    } catch {
      return errorResponse({
        code: "INVALID_REQUEST",
        message: "Invalid JSON request body.",
        statusCode: 400,
      });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return errorResponse({
        code: "INVALID_REQUEST",
        message: "Request body must be a JSON object.",
        statusCode: 400,
      });
    }

    const validation = validateSourceCode(body.sourceCode);
    if (!validation.ok) {
      return errorResponse(validation.error);
    }

    const result = await analyzeContract(validation.value);

    if (!result.ok) {
      return errorResponse(result.error);
    }

    return NextResponse.json(
      {
        success: true,
        analysis: result.analysis,
      },
      { status: 200 }
    );
  } catch {
    // Never expose internal stack traces to the client
    return NextResponse.json(
      { success: false, error: { code: "UNKNOWN", message: "An unexpected error occurred." } },
      { status: 500 }
    );
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
