import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "./route";

const originalFetch = globalThis.fetch;

const mockTransactionResponse = {
  jsonrpc: "2.0",
  id: "dontcare",
  result: {
    status: { SuccessValue: "" },
    transaction: {
      signer_id: "alice.near",
      receiver_id: "bob.near",
      actions: [
        {
          type: "Transfer",
          deposit: "1000000000000000000000000",
        },
        {
          type: "FunctionCall",
          deposit: "0",
          gas: "300000000000000",
          method_name: "ft_transfer",
          args: "{}",
        },
      ],
    },
    receipts_outcome: [
      {
        outcome: {
          gas_burnt: "250000000000000",
          tokens_burnt: "1000000000000000000",
        },
      },
    ],
  },
};

async function postTransaction(body: { txHash?: string; senderAccountId?: string }): Promise<Response> {
  const request = new Request("http://localhost/api/near-transaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(request);
}

describe("POST /api/near-transaction", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns 200 with transaction analysis for existing transaction", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockTransactionResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const res = await postTransaction({ txHash: "abc123def456", senderAccountId: "alice.near" });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.analysis.exists).toBe(true);
    expect(body.analysis.txHash).toBe("abc123def456");
    expect(body.analysis.transaction?.status).toBe("success");
    expect(body.analysis.transaction?.signerId).toBe("alice.near");
    expect(body.analysis.transaction?.receiverId).toBe("bob.near");
    expect(body.analysis.riskIndicators).toBeDefined();
    expect(body.analysis.positiveSignals).toBeDefined();
    expect(body.analysis.limitations).toBeDefined();
    expect(body.analysis.rpcSource).toBe("https://rpc.mainnet.near.org");
    expect(body.analysis.timestamp).toBeDefined();
  });

  it("returns 200 with transaction not found analysis", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: "dontcare",
          error: { code: -32602, message: "Transaction not found" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const res = await postTransaction({ txHash: "nonexistent123", senderAccountId: "alice.near" });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.analysis.exists).toBe(false);
    expect(body.analysis.transaction).toBeNull();
    expect(body.analysis.riskIndicators.length).toBeGreaterThan(0);
  });

  it("returns 502 when RPC is unavailable", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network error"));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const res = await postTransaction({ txHash: "abc123def456", senderAccountId: "alice.near" });
    expect(res.status).toBe(502);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("RPC_ERROR");
  });

  it("returns 400 for missing txHash", async () => {
    const request = new Request("http://localhost/api/near-transaction", {
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

  it("returns 400 for invalid txHash format", async () => {
    const res = await postTransaction({ txHash: "invalid", senderAccountId: "alice.near" });
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_REQUEST");
  });

  it("returns 400 for invalid senderAccountId format", async () => {
    const res = await postTransaction({ txHash: "abc123def456", senderAccountId: "INVALID" });
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_REQUEST");
  });

  it("returns 400 for empty txHash", async () => {
    const res = await postTransaction({ txHash: "", senderAccountId: "alice.near" });
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_REQUEST");
  });

  it("works without senderAccountId", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockTransactionResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const res = await postTransaction({ txHash: "abc123def456" });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
