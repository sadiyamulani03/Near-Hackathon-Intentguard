import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "./route";

const originalFetch = globalThis.fetch;

const mockAccountResponse = {
  jsonrpc: "2.0",
  id: "dontcare",
  result: {
    account_id: "alice.near",
    amount: "10000000000000000000000000",
    locked: "5000000000000000000000000000",
    storage_usage: 50000,
    storage_paid_at: "170000000000000000",
    block_height: 12345678,
    block_hash: "ABC123",
    code_hash: "11111111111111111111111111111111",
  },
};

async function postAccount(accountId: string): Promise<Response> {
  const request = new Request("http://localhost/api/near-account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accountId }),
  });
  return POST(request);
}

describe("POST /api/near-account", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns 200 with account analysis for existing account", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockAccountResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const res = await postAccount("alice.near");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.analysis.exists).toBe(true);
    expect(body.analysis.accountId).toBe("alice.near");
    expect(body.analysis.account?.amountNear).toBe("10");
    expect(body.analysis.riskIndicators).toBeDefined();
    expect(body.analysis.positiveSignals).toBeDefined();
    expect(body.analysis.limitations).toBeDefined();
    expect(body.analysis.rpcSource).toBe("https://rpc.mainnet.near.org");
    expect(body.analysis.timestamp).toBeDefined();
  });

  it("returns 200 with account not found analysis", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: "dontcare",
          error: { code: -32602, message: "Account nonexistent.near does not exist" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const res = await postAccount("nonexistent.near");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.analysis.exists).toBe(false);
    expect(body.analysis.account).toBeNull();
    expect(body.analysis.riskIndicators.length).toBeGreaterThan(0);
  });

  it("returns 502 when RPC is unavailable", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network error"));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const res = await postAccount("alice.near");
    expect(res.status).toBe(502);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("RPC_ERROR");
  });

  it("returns 400 for missing accountId", async () => {
    const request = new Request("http://localhost/api/near-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(request);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_REQUEST");
  });

  it("returns 400 for invalid account ID format", async () => {
    const res = await postAccount("INVALID");
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_REQUEST");
  });

  it("returns 400 for empty accountId", async () => {
    const res = await postAccount("");
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_REQUEST");
  });

  it("returns 405 for GET method", async () => {
    const request = new Request("http://localhost/api/near-account", {
      method: "GET",
    });
    const res = await POST(request);
    // GET is handled by the GET handler which returns 405
    expect(res.status).toBe(405);
  });
});
