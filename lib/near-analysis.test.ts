import { describe, it, expect } from "vitest";
import {
  analyzeAccount,
  analyzeTransaction,
} from "./near-analysis";

const existingAccountData = {
  account_id: "alice.near",
  amount: "10000000000000000000000000",
  locked: "5000000000000000000000000000",
  storage_usage: 50000,
  storage_paid_at: "170000000000000000",
  block_height: 12345678,
  block_hash: "ABC123",
  code_hash: "11111111111111111111111111111111",
};

const zeroBalanceAccountData = {
  account_id: "empty.near",
  amount: "0",
  storage_usage: 1000,
  block_height: 12345678,
  block_hash: "ABC123",
  code_hash: "11111111111111111111111111111111",
};

const contractAccountData = {
  account_id: "contract.near",
  amount: "500000000000000000000000000000",
  storage_usage: 200000,
  block_height: 12345678,
  block_hash: "ABC123",
  code_hash: "ABCDEF1234567890ABCDEF1234567890",
};

const successfulTransactionData = {
  status: { SuccessValue: "" },
  transaction: {
    signer_id: "alice.near",
    receiver_id: "bob.near",
    actions: [
      { type: "Transfer", deposit: "1000000000000000000000000" },
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
};

const failedTransactionData = {
  status: {
    Failure: {
      ActionError: { kind: "ReceiverDoesNotExist" },
    },
  },
  transaction: {
    signer_id: "alice.near",
    receiver_id: "nonexistent.near",
    actions: [{ type: "Transfer", deposit: "5000000000000000000000000" }],
  },
  receipts_outcome: [
    {
      outcome: {
        gas_burnt: "100000000000000",
        tokens_burnt: "0",
      },
    },
  ],
};

const timestamp = "2024-01-01T00:00:00.000Z";
const rpcSource = "https://rpc.mainnet.near.org";

describe("analyzeAccount", () => {
  it("returns analysis for existing account with balance", () => {
    const result = analyzeAccount(
      "alice.near",
      existingAccountData,
      "mainnet",
      rpcSource,
      timestamp
    );
    expect(result.exists).toBe(true);
    expect(result.accountId).toBe("alice.near");
    expect(result.account?.amountNear).toBe("10");
    expect(result.riskIndicators.length).toBeGreaterThanOrEqual(0);
    expect(result.positiveSignals.length).toBeGreaterThan(0);
    expect(result.limitations.length).toBeGreaterThan(0);
  });

  it("returns analysis for zero balance account", () => {
    const result = analyzeAccount(
      "empty.near",
      zeroBalanceAccountData,
      "mainnet",
      rpcSource,
      timestamp
    );
    expect(result.exists).toBe(true);
    const balanceFinding = result.riskIndicators.find(
      (f) => f.ruleId === "NEAR-ACCOUNT-02"
    );
    expect(balanceFinding).toBeDefined();
    if (balanceFinding) {
      expect(balanceFinding.title).toBe("Zero NEAR Balance");
    }
  });

  it("returns analysis for contract account", () => {
    const result = analyzeAccount(
      "contract.near",
      contractAccountData,
      "mainnet",
      rpcSource,
      timestamp
    );
    expect(result.exists).toBe(true);
    expect(result.account?.codeHash).toBe("ABCDEF1234567890ABCDEF1234567890");
    const contractFinding = result.riskIndicators.find(
      (f) => f.ruleId === "NEAR-ACCOUNT-03"
    );
    expect(contractFinding).toBeDefined();
    if (contractFinding) {
      expect(contractFinding.title).toBe("Contract Code Deployed");
    }
  });

  it("returns analysis for non-existent account", () => {
    const result = analyzeAccount(
      "nonexistent.near",
      null,
      "mainnet",
      rpcSource,
      timestamp
    );
    expect(result.exists).toBe(false);
    expect(result.riskIndicators.length).toBeGreaterThan(0);
    const existenceFinding = result.riskIndicators.find(
      (f) => f.ruleId === "NEAR-ACCOUNT-01"
    );
    expect(existenceFinding).toBeDefined();
    if (existenceFinding) {
      expect(existenceFinding.title).toBe("Account Not Found");
    }
  });

  it("does not label new accounts as malicious", () => {
    const result = analyzeAccount(
      "new.near",
      zeroBalanceAccountData,
      "mainnet",
      rpcSource,
      timestamp
    );
    const criticalFindings = result.riskIndicators.filter(
      (f) => f.severity === "CRITICAL"
    );
    expect(criticalFindings.length).toBe(0);
  });
});

describe("analyzeTransaction", () => {
  it("returns analysis for successful transaction", () => {
    const result = analyzeTransaction(
      "abc123",
      successfulTransactionData,
      "mainnet",
      rpcSource,
      timestamp
    );
    expect(result.exists).toBe(true);
    expect(result.transaction?.status).toBe("success");
    expect(result.transaction?.signerId).toBe("alice.near");
    expect(result.transaction?.receiverId).toBe("bob.near");
    expect(result.transaction?.actions.length).toBe(2);
  });

  it("returns analysis for failed transaction", () => {
    const result = analyzeTransaction(
      "def456",
      failedTransactionData,
      "mainnet",
      rpcSource,
      timestamp
    );
    expect(result.exists).toBe(true);
    expect(result.transaction?.status).toBe("failure");
    const failureFinding = result.riskIndicators.find(
      (f) => f.ruleId === "NEAR-TX-01"
    );
    expect(failureFinding).toBeDefined();
    if (failureFinding) {
      expect(failureFinding.title).toBe("Transaction Execution Failed");
      expect(failureFinding.severity).toBe("MEDIUM");
    }
  });

  it("returns analysis for non-existent transaction", () => {
    const result = analyzeTransaction(
      "nonexistent",
      null,
      "mainnet",
      rpcSource,
      timestamp
    );
    expect(result.exists).toBe(false);
    expect(result.riskIndicators.length).toBeGreaterThan(0);
    const existenceFinding = result.riskIndicators.find(
      (f) => f.ruleId === "NEAR-TX-01"
    );
    expect(existenceFinding).toBeDefined();
    if (existenceFinding) {
      expect(existenceFinding.title).toBe("Transaction Not Found");
    }
  });

  it("detects transfer actions", () => {
    const result = analyzeTransaction(
      "abc123",
      successfulTransactionData,
      "mainnet",
      rpcSource,
      timestamp
    );
    const transferFinding = result.riskIndicators.find(
      (f) => f.ruleId === "NEAR-TX-02"
    );
    expect(transferFinding).toBeDefined();
  });

  it("detects function call actions", () => {
    const result = analyzeTransaction(
      "abc123",
      successfulTransactionData,
      "mainnet",
      rpcSource,
      timestamp
    );
    const fcFinding = result.riskIndicators.find(
      (f) => f.ruleId === "NEAR-TX-03"
    );
    expect(fcFinding).toBeDefined();
    if (fcFinding) {
      expect(fcFinding.evidence).toContain("ft_transfer");
    }
  });

  it("all verified fact indicators have isVerifiedFact=true", () => {
    const result = analyzeTransaction(
      "abc123",
      successfulTransactionData,
      "mainnet",
      rpcSource,
      timestamp
    );
    for (const finding of result.riskIndicators) {
      expect(finding.isVerifiedFact).toBe(true);
    }
  });

  it("does not claim confirmed exploitability", () => {
    const result = analyzeTransaction(
      "def456",
      failedTransactionData,
      "mainnet",
      rpcSource,
      timestamp
    );
    for (const finding of result.riskIndicators) {
      const lower = (finding.title + " " + finding.description).toLowerCase();
      expect(lower).not.toContain("is vulnerable");
      expect(lower).not.toContain("is exploitable");
      expect(lower).not.toContain("confirmed");
    }
  });
});
