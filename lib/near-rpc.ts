const NEAR_RPC_URLS = [
  "https://rpc.mainnet.near.org",
  "https://rpc.testnet.near.org",
];

const RPC_TIMEOUT_MS = 10000;

export type Network = "mainnet" | "testnet";

interface JsonRpcResponse<T = unknown> {
  jsonrpc: string;
  id: string;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
    name?: string;
    cause?: { name?: string; info?: unknown };
  };
}

export interface AccountView {
  account_id: string;
  amount: string;
  locked?: string;
  storage_usage: number;
  storage_paid_at?: string;
  block_height: number;
  block_hash: string;
  code_hash?: string;
}

export interface TransactionView {
  status: {
    SuccessValue?: string;
    Failure?: { ActionError?: { kind: string } };
    [key: string]: unknown;
  };
  transaction: {
    signer_id: string;
    receiver_id: string;
    actions: Array<{
      type: string;
      deposit?: string;
      gas?: string;
      method_name?: string;
      args?: string;
    }>;
  };
  receipts_outcome: Array<{
    outcome: {
      gas_burnt?: string;
      tokens_burnt?: string;
      logs?: string[];
      status?: unknown;
    };
  }>;
}

class NearRpcError extends Error {
  constructor(public code: number | string, message: string) {
    super(message);
    this.name = "NearRpcError";
  }
}

async function nearRpcCall<T = unknown>(
  method: string,
  params: unknown,
  url: string
): Promise<JsonRpcResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "dontcare",
        method,
        params,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new NearRpcError(
        `HTTP_${response.status}`,
        `RPC request failed with HTTP ${response.status}`
      );
    }

    const data = (await response.json()) as JsonRpcResponse<T>;
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof NearRpcError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new NearRpcError("TIMEOUT", "RPC request timed out");
    }
    throw new NearRpcError("UNKNOWN", err instanceof Error ? err.message : String(err));
  }
}

function isAccountNotFoundError(response: JsonRpcResponse): boolean {
  if (!response.error) return false;
  const msg = response.error.message.toLowerCase();
  const data = String(response.error.data || "").toLowerCase();
  return (
    msg.includes("does not exist") ||
    msg.includes("not found") ||
    response.error.code === -32602 ||
    response.error.cause?.name === "UNKNOWN_ACCOUNT" ||
    data.includes("does not exist")
  );
}

export async function queryAccount(
  accountId: string,
  network: Network = "mainnet"
): Promise<{
  ok: true;
  data: AccountView;
  network: Network;
  rpcSource: string;
} | { ok: false; error: string; code: string; rpcSource: string }> {
  const urlMap: Record<Network, string> = {
    mainnet: "https://rpc.mainnet.near.org",
    testnet: "https://rpc.testnet.near.org",
  };
  const url = urlMap[network];

  let lastError: string | null = null;

  try {
    const response = await nearRpcCall<AccountView>("query", {
      request_type: "view_account",
      finality: "final",
      account_id: accountId,
    }, url);

    if (response.error) {
      if (isAccountNotFoundError(response)) {
        return { ok: false, error: "ACCOUNT_NOT_FOUND", code: "ACCOUNT_NOT_FOUND", rpcSource: url };
      }
      lastError = response.error.message;
    } else if (response.result) {
      return { ok: true, data: response.result, network, rpcSource: url };
    }
  } catch (err) {
    lastError = err instanceof Error ? err.message : String(err);
  }

  return { ok: false, error: lastError || "RPC_UNAVAILABLE", code: "RPC_UNAVAILABLE", rpcSource: url };
}

export async function getTransaction(
  txHash: string,
  senderAccountId?: string,
  network: Network = "mainnet"
): Promise<{
  ok: true;
  data: TransactionView;
  network: Network;
  rpcSource: string;
} | { ok: false; error: string; code: string; rpcSource: string }> {
  const urlMap: Record<Network, string> = {
    mainnet: "https://rpc.mainnet.near.org",
    testnet: "https://rpc.testnet.near.org",
  };
  const url = urlMap[network];

  let lastError: string | null = null;

  const params: unknown[] = [txHash];
  if (senderAccountId) {
    params.push(senderAccountId);
  }

  try {
    const response = await nearRpcCall<TransactionView>("tx", params, url);

    if (response.error) {
      const msg = response.error.message.toLowerCase();
      if (msg.includes("not found") || msg.includes("does not exist")) {
        return { ok: false, error: "TRANSACTION_NOT_FOUND", code: "TRANSACTION_NOT_FOUND", rpcSource: url };
      }
      lastError = response.error.message;
    } else if (response.result) {
      return { ok: true, data: response.result, network, rpcSource: url };
    }
  } catch (err) {
    lastError = err instanceof Error ? err.message : String(err);
  }

  return { ok: false, error: lastError || "RPC_UNAVAILABLE", code: "RPC_UNAVAILABLE", rpcSource: url };
}

export function formatYoctoNear(yoctoAmount: string): string {
  const near = BigInt(yoctoAmount) / BigInt("1000000000000000000000000");
  return near.toString();
}

export function formatGas(gas: string): string {
  const g = BigInt(gas) / BigInt(10 ** 12);
  return g.toString() + " TGas";
}
