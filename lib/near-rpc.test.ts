import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  queryAccount,
  getTransaction,
  formatYoctoNear,
  formatGas,
} from "./near-rpc";

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

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("near-rpc - queryAccount", () => {
  it("returns account data for existing account", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockAccountResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const result = await queryAccount("alice.near", "mainnet");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.account_id).toBe("alice.near");
      expect(result.network).toBe("mainnet");
      expect(result.rpcSource).toBe("https://rpc.mainnet.near.org");
    }
  });

  it("returns ACCOUNT_NOT_FOUND for non-existent account", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: "dontcare",
          error: { code: -32602, message: "Account alice.near does not exist" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const result = await queryAccount("nonexistent.near", "mainnet");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("ACCOUNT_NOT_FOUND");
    }
  });

  it("returns ACCOUNT_NOT_FOUND for actual NEAR RPC error format", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: "dontcare",
          error: {
            name: "HANDLER_ERROR",
            cause: { name: "UNKNOWN_ACCOUNT" },
            code: -32000,
            message: "Server error",
            data: "account nonexistent.near does not exist while viewing",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const result = await queryAccount("nonexistent.near", "mainnet");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("ACCOUNT_NOT_FOUND");
    }
  });

  it("does not classify generic RPC errors as account-not-found", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: "dontcare",
          error: {
            name: "HANDLER_ERROR",
            cause: { name: "SOME_OTHER_ERROR" },
            code: -32000,
            message: "Server error",
            data: "some other error",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const result = await queryAccount("alice.near", "mainnet");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).not.toBe("ACCOUNT_NOT_FOUND");
      expect(result.code).toBe("RPC_UNAVAILABLE");
    }
  });

  it("returns RPC_UNAVAILABLE when fetch fails", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network error"));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const result = await queryAccount("alice.near", "mainnet");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("RPC_UNAVAILABLE");
    }
  });

  it("returns RPC_UNAVAILABLE on timeout", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("AbortError"));
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const result = await queryAccount("alice.near", "mainnet");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("RPC_UNAVAILABLE");
    }
  });
});

describe("near-rpc - getTransaction", () => {
  it("returns transaction data for existing transaction", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockTransactionResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const result = await getTransaction(
      "abc123",
      "alice.near",
      "mainnet"
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.transaction.signer_id).toBe("alice.near");
      expect(result.data.transaction.receiver_id).toBe("bob.near");
      expect(result.network).toBe("mainnet");
    }
  });

  it("returns TRANSACTION_NOT_FOUND for non-existent transaction", async () => {
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

    const result = await getTransaction("nonexistent", "alice.near", "mainnet");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("TRANSACTION_NOT_FOUND");
    }
  });
});

describe("near-rpc - format helpers", () => {
  it("formats yocto NEAR to NEAR", () => {
    expect(formatYoctoNear("10000000000000000000000000")).toBe("10");
  });

  it("formats gas to TGas", () => {
    expect(formatGas("300000000000000")).toBe("300 TGas");
  });
});
