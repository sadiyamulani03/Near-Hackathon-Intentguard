export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type Confidence = "LOW" | "MEDIUM" | "HIGH";

import { AccountView, TransactionView } from "./near-rpc";

export interface RiskIndicator {
  ruleId: string;
  title: string;
  severity: Severity;
  confidence: Confidence;
  description: string;
  evidence: string;
  recommendation: string;
  isVerifiedFact: boolean;
}

export interface AccountAnalysisResult {
  accountId: string;
  network: string;
  account: {
    accountId: string;
    amount: string;
    amountNear: string;
    locked?: string;
    lockedNear?: string;
    storageUsage: number;
    codeHash?: string;
    blockHeight: number;
    blockHash: string;
  } | null;
  exists: boolean;
  riskIndicators: RiskIndicator[];
  positiveSignals: string[];
  limitations: string[];
  rpcSource: string;
  timestamp: string;
}

export interface TransactionAnalysisResult {
  txHash: string;
  network: string;
  transaction: {
    status: "success" | "failure";
    statusDetail: string;
    signerId: string;
    receiverId: string;
    actions: Array<{
      type: string;
      deposit?: string;
      depositNear?: string;
      gas?: string;
      gasTgas?: string;
      methodName?: string;
    }>;
    gasBurnt?: string;
    gasBurntTgas?: string;
    tokensBurnt?: string;
    tokensBurntNear?: string;
  } | null;
  exists: boolean;
  riskIndicators: RiskIndicator[];
  positiveSignals: string[];
  limitations: string[];
  rpcSource: string;
  timestamp: string;
}

const ONE_NEAR_YOCTO = BigInt("1000000000000000000000000");
const ONE_TGAS = BigInt(10 ** 12);

const ACCOUNT_EXISTENCE_RULE = "NEAR-ACCOUNT-01";
const ACCOUNT_BALANCE_RULE = "NEAR-ACCOUNT-02";
const ACCOUNT_CONTRACT_RULE = "NEAR-ACCOUNT-03";
const ACCOUNT_STORAGE_RULE = "NEAR-ACCOUNT-04";

const TX_EXECUTION_RULE = "NEAR-TX-01";
const TX_TRANSFER_RULE = "NEAR-TX-02";
const TX_FUNCTION_CALL_RULE = "NEAR-TX-03";
const TX_GAS_RULE = "NEAR-TX-04";

export function analyzeAccount(
  accountId: string,
  accountData: AccountView | null,
  network: string,
  rpcSource: string,
  timestamp: string
): AccountAnalysisResult {
  const findings: RiskIndicator[] = [];
  const positiveSignals: string[] = [];
  const limitations: string[] = [];

  const exists = accountData !== null;

  if (!exists) {
    findings.push({
      ruleId: ACCOUNT_EXISTENCE_RULE,
      title: "Account Not Found",
      severity: "INFO",
      confidence: "HIGH",
      description: `Account "${accountId}" does not exist on ${network} or is not indexed by the queried RPC node.`,
      evidence: `Account lookup for "${accountId}" returned no result.`,
      recommendation: "Verify the account ID is correct and the account exists on the selected network.",
      isVerifiedFact: true,
    });
    limitations.push("Account does not exist on the queried network. No further analysis possible.");
  } else {
    positiveSignals.push(`Account "${accountId}" exists on ${network}.`);
    limitations.push("Analysis is based on RPC node data and may not reflect real-time account state.");

    const amountYocto = BigInt(accountData.amount || "0");
    const amountNear = (amountYocto / ONE_NEAR_YOCTO).toString();
    const lockedYocto = accountData.locked ? BigInt(accountData.locked) : null;
    const lockedNear = lockedYocto ? (lockedYocto / ONE_NEAR_YOCTO).toString() : undefined;

    // Balance indicator
    if (amountYocto === BigInt(0)) {
      findings.push({
        ruleId: ACCOUNT_BALANCE_RULE,
        title: "Zero NEAR Balance",
        severity: "INFO",
        confidence: "HIGH",
        description: "Account has zero NEAR balance.",
        evidence: `Balance: 0 yoctoNEAR (${accountData.amount}).`,
        recommendation: "No action required. Zero balance is normal for newly created or non-transacting accounts.",
        isVerifiedFact: true,
      });
    } else if (amountYocto < BigInt(10 ** 23)) {
      // Less than 0.1 NEAR
      findings.push({
        ruleId: ACCOUNT_BALANCE_RULE,
        title: "Minimal NEAR Balance",
        severity: "INFO",
        confidence: "HIGH",
        description: "Account holds a minimal NEAR balance.",
        evidence: `Balance: ${amountNear} NEAR.`,
        recommendation: "No action required. Low balance alone is not a risk indicator.",
        isVerifiedFact: true,
      });
    } else {
      positiveSignals.push(`Account holds ${amountNear} NEAR.`);
    }

    // Locked balance indicator
    if (lockedYocto && lockedYocto > BigInt(0)) {
      positiveSignals.push(`Account has ${lockedNear} NEAR locked (staking or vesting).`);
    }

    // Contract deployment indicator
    const isContract = accountData.code_hash &&
      accountData.code_hash !== "11111111111111111111111111111111";
    if (isContract) {
      findings.push({
        ruleId: ACCOUNT_CONTRACT_RULE,
        title: "Contract Code Deployed",
        severity: "INFO",
        confidence: "HIGH",
        description: "Account has deployed contract code.",
        evidence: `Code hash: ${accountData.code_hash}.`,
        recommendation: "No action required. Contract accounts are normal on NEAR.",
        isVerifiedFact: true,
      });
    } else {
      positiveSignals.push("Account is a standard user account (no contract deployed).");
    }

    // Storage usage indicator
    if (accountData.storage_usage > 100000) {
      findings.push({
        ruleId: ACCOUNT_STORAGE_RULE,
        title: "High Storage Usage",
        severity: "INFO",
        confidence: "MEDIUM",
        description: "Account uses significant storage.",
        evidence: `Storage used: ${accountData.storage_usage} bytes.`,
        recommendation: "No action required. High storage usage indicates account activity or data storage.",
        isVerifiedFact: true,
      });
    }
  }

  const result: AccountAnalysisResult = {
    accountId,
    network,
    account: exists ? {
      accountId: accountData!.account_id,
      amount: accountData!.amount,
      amountNear: exists ? (BigInt(accountData!.amount || "0") / ONE_NEAR_YOCTO).toString() : "0",
      locked: accountData!.locked,
      lockedNear: accountData!.locked ? (BigInt(accountData!.locked) / ONE_NEAR_YOCTO).toString() : undefined,
      storageUsage: accountData!.storage_usage,
      codeHash: accountData!.code_hash,
      blockHeight: accountData!.block_height,
      blockHash: accountData!.block_hash,
    } : null,
    exists,
    riskIndicators: findings,
    positiveSignals,
    limitations,
    rpcSource,
    timestamp,
  };

  return result;
}

export function analyzeTransaction(
  txHash: string,
  txData: TransactionView | null,
  network: string,
  rpcSource: string,
  timestamp: string
): TransactionAnalysisResult {
  const findings: RiskIndicator[] = [];
  const positiveSignals: string[] = [];
  const limitations: string[] = [];

  const exists = txData !== null;

  let txStatus: "success" | "failure" = "failure";
  let txStatusDetail: string = "Unknown";

  if (!exists) {
    findings.push({
      ruleId: TX_EXECUTION_RULE,
      title: "Transaction Not Found",
      severity: "INFO",
      confidence: "HIGH",
      description: `Transaction "${txHash}" was not found on ${network}.`,
      evidence: `Transaction lookup for "${txHash}" returned no result.`,
      recommendation: "Verify the transaction hash is correct and the transaction exists on the selected network.",
      isVerifiedFact: true,
    });
    limitations.push("Transaction does not exist on the queried network. No further analysis possible.");
  } else {
    positiveSignals.push(`Transaction "${txHash}" exists on ${network}.`);

    const status = txData.status;
    const isSuccess = "SuccessValue" in status || "SuccessReceiptId" in status;
    const isFailure = "Failure" in status;

    const tx = txData.transaction;
    const signerId = tx.signer_id;
    const receiverId = tx.receiver_id;
    const actions = tx.actions || [];

    // Execution status
    if (isFailure) {
      const failureDetail = status.Failure?.ActionError?.kind || "unknown";
      findings.push({
        ruleId: TX_EXECUTION_RULE,
        title: "Transaction Execution Failed",
        severity: "MEDIUM",
        confidence: "HIGH",
        description: "Transaction failed during execution.",
        evidence: `Status: Failure (${failureDetail}). Signer: ${signerId}. Receiver: ${receiverId}.`,
        recommendation: "Review the transaction actions and error details. A failed transaction did not modify state.",
        isVerifiedFact: true,
      });
    } else if (isSuccess) {
      positiveSignals.push("Transaction executed successfully.");
      txStatus = "success";
      txStatusDetail = "Success";
    } else {
      findings.push({
        ruleId: TX_EXECUTION_RULE,
        title: "Unknown Transaction Status",
        severity: "INFO",
        confidence: "MEDIUM",
        description: "Transaction status could not be determined from RPC response.",
        evidence: `Status object: ${JSON.stringify(status).slice(0, 200)}.`,
        recommendation: "No action required. Status format may vary by RPC node version.",
        isVerifiedFact: true,
      });
    }

    // Signer and receiver
    positiveSignals.push(`Signer: ${signerId}. Receiver: ${receiverId}.`);

    // Analyze actions
    let totalDepositYocto = BigInt(0);
    let hasTransfer = false;
    let hasFunctionCall = false;
    let maxGasBurnt = BigInt(0);
    const methodNames: string[] = [];

    for (const action of actions) {
      if (action.type === "Transfer") {
        hasTransfer = true;
        if (action.deposit) {
          totalDepositYocto += BigInt(action.deposit);
        }
      }
      if (action.type === "FunctionCall") {
        hasFunctionCall = true;
        if (action.method_name) {
          methodNames.push(action.method_name);
        }
        if (action.deposit) {
          totalDepositYocto += BigInt(action.deposit);
        }
      }
      if (action.gas) {
        const g = BigInt(action.gas);
        if (g > maxGasBurnt) maxGasBurnt = g;
      }
    }

    // Gas burnt from receipts
    if (txData.receipts_outcome) {
      for (const ro of txData.receipts_outcome) {
        if (ro.outcome.gas_burnt) {
          const g = BigInt(ro.outcome.gas_burnt);
          if (g > maxGasBurnt) maxGasBurnt = g;
        }
      }
    }

    // Transfer indicator
    if (hasTransfer) {
      const depositNear = (totalDepositYocto / ONE_NEAR_YOCTO).toString();
      if (totalDepositYocto > BigInt(10 ** 25)) {
        // More than 10 NEAR
        findings.push({
          ruleId: TX_TRANSFER_RULE,
          title: "Large NEAR Transfer",
          severity: "INFO",
          confidence: "HIGH",
          description: `Transaction transfers ${depositNear} NEAR.`,
          evidence: `Total deposit across actions: ${totalDepositYocto} yoctoNEAR (${depositNear} NEAR).`,
          recommendation: "No action required. Large transfers are normal on NEAR.",
          isVerifiedFact: true,
        });
      } else {
        findings.push({
          ruleId: TX_TRANSFER_RULE,
          title: "NEAR Transfer",
          severity: "INFO",
          confidence: "HIGH",
          description: `Transaction transfers ${depositNear} NEAR.`,
          evidence: `Total deposit across actions: ${totalDepositYocto} yoctoNEAR (${depositNear} NEAR).`,
          recommendation: "No action required. Transfers are standard NEAR operations.",
          isVerifiedFact: true,
        });
      }
    }

    // Function call indicator
    if (hasFunctionCall) {
      const methods = methodNames.length > 0 ? methodNames.join(", ") : "unknown";
      findings.push({
        ruleId: TX_FUNCTION_CALL_RULE,
        title: "Function Call(s)",
        severity: "INFO",
        confidence: "HIGH",
        description: `Transaction calls contract method(s): ${methods}.`,
        evidence: `Receiver: ${receiverId}. Methods: ${methods}.`,
        recommendation: "No action required. Function calls are standard NEAR operations.",
        isVerifiedFact: true,
      });
    }

    // Gas indicator
    if (maxGasBurnt > BigInt(0)) {
      const gasTgas = (maxGasBurnt / ONE_TGAS).toString();
      if (maxGasBurnt > BigInt(100 * 10 ** 12)) {
        // More than 100 TGas
        findings.push({
          ruleId: TX_GAS_RULE,
          title: "High Gas Usage",
          severity: "INFO",
          confidence: "MEDIUM",
          description: `Transaction used ${gasTgas} TGas.`,
          evidence: `Maximum gas burnt: ${maxGasBurnt.toString()} yoctoGas (${gasTgas} TGas).`,
          recommendation: "No action required. High gas usage indicates complex computation.",
          isVerifiedFact: true,
        });
      }
    }
  }

  const result: TransactionAnalysisResult = {
    txHash,
    network,
    transaction: exists ? {
      status: txStatus,
      statusDetail: txStatusDetail,
      signerId: txData.transaction.signer_id,
      receiverId: txData.transaction.receiver_id,
      actions: (txData.transaction.actions || []).map((a) => ({
        type: a.type,
        deposit: a.deposit,
        depositNear: a.deposit ? (BigInt(a.deposit) / ONE_NEAR_YOCTO).toString() : undefined,
        gas: a.gas,
        gasTgas: a.gas ? (BigInt(a.gas) / ONE_TGAS).toString() : undefined,
        methodName: a.method_name,
      })),
      gasBurnt: txData.receipts_outcome?.[0]?.outcome.gas_burnt,
      gasBurntTgas: txData.receipts_outcome?.[0]?.outcome.gas_burnt
        ? (BigInt(txData.receipts_outcome[0].outcome.gas_burnt) / ONE_TGAS).toString()
        : undefined,
      tokensBurnt: txData.receipts_outcome?.[0]?.outcome.tokens_burnt,
      tokensBurntNear: txData.receipts_outcome?.[0]?.outcome.tokens_burnt
        ? (BigInt(txData.receipts_outcome[0].outcome.tokens_burnt) / ONE_NEAR_YOCTO).toString()
        : undefined,
    } : null,
    exists,
    riskIndicators: findings,
    positiveSignals,
    limitations,
    rpcSource,
    timestamp,
  };

  return result;
}
