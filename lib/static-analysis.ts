import {
  parse,
  type ASTNode,
  type ContractDefinition,
  type FunctionDefinition,
  type StateVariableDeclaration,
  type ModifierInvocation,
  type FunctionCall,
  type MemberAccess,
  type Identifier,
  type BinaryOperation,
  type Location,
  type ExpressionStatement,
  type IfStatement,
  type EmitStatement,
  type VariableDeclarationStatement,
} from "solidity-parser-antlr";

export type RuleId =
  | "REENTRANCY-01"
  | "TX_ORIGIN-01"
  | "UNCHECKED_LOWLEVEL-01"
  | "DELEGATECALL-01"
  | "SELFDESTRUCT-01";

export interface SourceLocation {
  line: number;
  column: number;
}

export interface StaticFinding {
  ruleId: RuleId;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  confidence: "LOW" | "MEDIUM" | "HIGH";
  description: string;
  evidence: string;
  recommendation: string;
  location: SourceLocation;
  proof: string;
}

export interface StaticAnalysisResult {
  findings: StaticFinding[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "INSUFFICIENT_DATA";
  summary: string;
  limitations: string[];
  positiveSignals: string[];
}

const MAX_SOURCE_CHARS = 64 * 1024;

function preprocessCallOptions(source: string): string {
  // Convert Solidity call options syntax .call{OPTIONS}(ARGS) to parseable .call.value(X).gas(Y)(ARGS)
  // Handles: .call{value: amount}(data), .call{gas: limit}(data), .call{value: amount, gas: limit}(data)
  return source.replace(
    /\.call\s*\{([^}]*)\}\s*\(/g,
    (_match, optionsStr) => {
      const options = optionsStr.split(",").map((o: string) => o.trim());
      let valueArg: string | null = null;
      let gasArg: string | null = null;
      for (const opt of options) {
        const colonIdx = opt.indexOf(":");
        if (colonIdx === -1) continue;
        const key = opt.slice(0, colonIdx).trim();
        const val = opt.slice(colonIdx + 1).trim();
        if (key === "value") valueArg = val;
        if (key === "gas") gasArg = val;
      }
      let result = ".call";
      if (gasArg) result += `.gas(${gasArg})`;
      if (valueArg) result += `.value(${valueArg})`;
      result += "(";
      return result;
    }
  );
}

const REENTRANCY_GUARD_NAMES = new Set([
  "nonReentrant",
  "ReentrancyGuard",
  "onlyOwner",
  "onlyAdmin",
  "onlyGovernance",
  "onlyRole",
  "authorized",
  "ownerOnly",
]);

function getLoc(node: { loc?: Location }): SourceLocation | null {
  if (!node.loc) return null;
  return { line: node.loc.start.line, column: node.loc.start.column };
}

function getSnippet(source: string, node: { range?: [number, number] }): string {
  if (!node.range) return "";
  const [start, end] = node.range;
  const s = Math.max(0, start - 1);
  const e = Math.min(source.length, end + 1);
  return source.slice(s, e);
}

function isIdentifier(node: unknown): node is Identifier {
  return (
    typeof node === "object" &&
    node !== null &&
    (node as { type?: string }).type === "Identifier"
  );
}

function getIdentifierName(node: unknown): string | null {
  if (isIdentifier(node)) return node.name;
  return null;
}

function isMemberAccess(node: unknown, memberName: string): node is MemberAccess {
  return (
    typeof node === "object" &&
    node !== null &&
    (node as { type?: string }).type === "MemberAccess" &&
    (node as MemberAccess).memberName === memberName
  );
}

function isFunctionCall(node: unknown): node is FunctionCall {
  return (
    typeof node === "object" &&
    node !== null &&
    (node as { type?: string }).type === "FunctionCall"
  );
}

function isBinaryOperation(node: unknown, operator?: string): node is BinaryOperation {
  return (
    typeof node === "object" &&
    node !== null &&
    (node as { type?: string }).type === "BinaryOperation" &&
    (!operator || (node as BinaryOperation).operator === operator)
  );
}

function isExpressionStatement(node: unknown): node is ExpressionStatement {
  return (
    typeof node === "object" &&
    node !== null &&
    (node as { type?: string }).type === "ExpressionStatement"
  );
}

function isIfStatement(node: unknown): node is IfStatement {
  return (
    typeof node === "object" &&
    node !== null &&
    (node as { type?: string }).type === "IfStatement"
  );
}

function isEmitStatement(node: unknown): node is EmitStatement {
  return (
    typeof node === "object" &&
    node !== null &&
    (node as { type?: string }).type === "EmitStatement"
  );
}

function isVariableDeclarationStatement(node: unknown): node is VariableDeclarationStatement {
  return (
    typeof node === "object" &&
    node !== null &&
    (node as { type?: string }).type === "VariableDeclarationStatement"
  );
}

function isUnaryOperation(node: unknown): boolean {
  return (
    typeof node === "object" &&
    node !== null &&
    (node as { type?: string }).type === "UnaryOperation"
  );
}

function collectChildren(node: unknown): ASTNode[] {
  const result: ASTNode[] = [];
  if (!node || typeof node !== "object") return result;
  const obj = node as Record<string, unknown>;
  for (const [, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === "object" && (item as { type?: string }).type) {
          result.push(item as ASTNode);
        }
      }
    } else if (value && typeof value === "object" && (value as { type?: string }).type) {
      result.push(value as ASTNode);
    }
  }
  return result;
}

function walkAll(node: ASTNode | null | undefined): ASTNode[] {
  const result: ASTNode[] = [];
  if (!node) return result;
  result.push(node);
  for (const child of collectChildren(node)) {
    result.push(...walkAll(child));
  }
  return result;
}

function findFunctions(ast: ASTNode): FunctionDefinition[] {
  const result: FunctionDefinition[] = [];
  const all = walkAll(ast);
  for (const node of all) {
    if (node.type === "FunctionDefinition") result.push(node);
  }
  return result;
}

function getFunctionModifiers(fn: FunctionDefinition): string[] {
  return (fn.modifiers || []).map((m) => (m as ModifierInvocation).name);
}

function hasReentrancyGuard(fn: FunctionDefinition): boolean {
  const modifiers = getFunctionModifiers(fn);
  for (const m of modifiers) {
    if (REENTRANCY_GUARD_NAMES.has(m)) return true;
  }
  return false;
}

function isExternalCall(node: unknown): boolean {
  if (!isFunctionCall(node)) return false;
  const fc = node as FunctionCall;
  const expr = fc.expression;
  // Direct member access
  if (
    isMemberAccess(expr, "call") ||
    isMemberAccess(expr, "delegatecall") ||
    isMemberAccess(expr, "staticcall") ||
    isMemberAccess(expr, "send") ||
    isMemberAccess(expr, "transfer")
  ) {
    return true;
  }
  // Pre-processed call options chain: .call.value(...)(...) or .call.gas(...).value(...)(...)
  let current: unknown = expr;
  while (
    current !== null &&
    typeof current === "object" &&
    (current as { type?: string }).type === "MemberAccess"
  ) {
    const ma = current as MemberAccess;
    if (
      ma.memberName === "call" ||
      ma.memberName === "delegatecall" ||
      ma.memberName === "staticcall" ||
      ma.memberName === "send" ||
      ma.memberName === "transfer"
    ) {
      return true;
    }
    current = ma.expression;
  }
  return false;
}

function getLowLevelCallName(node: unknown): string | null {
  if (!isFunctionCall(node)) return null;
  const fc = node as FunctionCall;
  const expr = fc.expression;
  if (
    isMemberAccess(expr, "call") ||
    isMemberAccess(expr, "delegatecall") ||
    isMemberAccess(expr, "staticcall") ||
    isMemberAccess(expr, "send") ||
    isMemberAccess(expr, "transfer")
  ) {
    return (expr as MemberAccess).memberName;
  }
  // Pre-processed call options chain: .call.value(...)(...) or .call.gas(...).value(...)(...)
  let current: unknown = expr;
  while (
    current !== null &&
    typeof current === "object" &&
    (current as { type?: string }).type === "MemberAccess"
  ) {
    const ma = current as MemberAccess;
    if (
      ma.memberName === "call" ||
      ma.memberName === "delegatecall" ||
      ma.memberName === "staticcall" ||
      ma.memberName === "send" ||
      ma.memberName === "transfer"
    ) {
      return ma.memberName;
    }
    current = ma.expression;
  }
  return null;
}

function findExternalCallsInBlock(block: unknown): Array<{ node: ASTNode; name: string; loc: SourceLocation | null }> {
  const results: Array<{ node: ASTNode; name: string; loc: SourceLocation | null }> = [];
  if (!block || typeof block !== "object") return results;
  const all = walkAll(block as ASTNode);
  for (const node of all) {
    if (isExternalCall(node)) {
      const fc = node as FunctionCall;
      const name = getLowLevelCallName(node) || getIdentifierName(fc.expression) || "external call";
      results.push({ node, name, loc: getLoc(node) });
    }
  }
  return results;
}

function isStateVariableAssignment(left: unknown, stateVars: Set<string>): boolean {
  if (!left || typeof left !== "object") return false;
  // Direct identifier: x = ...
  if (isIdentifier(left)) {
    const name = (left as Identifier).name;
    if (name && stateVars.has(name)) return true;
  }
  // IndexAccess: balances[msg.sender] = ...
  if ((left as { type?: string }).type === "IndexAccess") {
    const idx = left as { base?: unknown };
    const baseName = getIdentifierName(idx.base);
    if (baseName && stateVars.has(baseName)) return true;
  }
  return false;
}

function findStateUpdatesInBlock(
  block: unknown,
  stateVars: Set<string>,
): Array<{ node: ASTNode; varName: string; loc: SourceLocation | null; op: string }> {
  const results: Array<{ node: ASTNode; varName: string; loc: SourceLocation | null; op: string }> = [];
  if (!block || typeof block !== "object") return results;
  const all = walkAll(block as ASTNode);
  for (const node of all) {
    if (isExpressionStatement(node)) {
      const es = node as ExpressionStatement;
      if (isBinaryOperation(es.expression)) {
        const bin = es.expression as BinaryOperation;
        const left = bin.left;
        if (isStateVariableAssignment(left, stateVars)) {
          const varName = isIdentifier(left)
            ? (left as Identifier).name!
            : getIdentifierName((left as { base?: unknown }).base!)!;
          results.push({ node, varName, loc: getLoc(node), op: bin.operator });
          continue;
        }
      }
      // Unary operations: count++, count--
      if (isUnaryOperation(es.expression)) {
        const uni = es.expression as { argument?: unknown; operator?: string };
        const arg = uni.argument;
        if (isStateVariableAssignment(arg, stateVars)) {
          const varName = isIdentifier(arg)
            ? (arg as Identifier).name!
            : getIdentifierName((arg as { base?: unknown }).base!)!;
          results.push({ node, varName, loc: getLoc(node), op: uni.operator ?? "++/--" });
          continue;
        }
      }
    }
    // VariableDeclarationStatement with delete: delete count
    if (isVariableDeclarationStatement(node)) {
      const vds = node as VariableDeclarationStatement;
      // Check for delete statement pattern
      if (vds.initialValue === undefined) {
        for (const v of vds.variables) {
          const vd = v as { name?: string };
          const name = vd.name;
          if (name && stateVars.has(name)) {
            results.push({ node, varName: name, loc: getLoc(node), op: "delete" });
          }
        }
      }
    }
  }
  return results;
}

function findTxOriginUsages(node: unknown): Array<{ node: ASTNode; loc: SourceLocation | null }> {
  const results: Array<{ node: ASTNode; loc: SourceLocation | null }> = [];
  const all = walkAll(node as ASTNode);
  for (const n of all) {
    if (isMemberAccess(n, "origin")) {
      const ma = n as MemberAccess;
      const exprName = getIdentifierName(ma.expression);
      if (exprName === "tx") {
        results.push({ node: n, loc: getLoc(n) });
      }
    }
  }
  return results;
}

function findLowLevelCalls(node: unknown): Array<{ node: ASTNode; name: string; loc: SourceLocation | null }> {
  const results: Array<{ node: ASTNode; name: string; loc: SourceLocation | null }> = [];
  const all = walkAll(node as ASTNode);
  for (const n of all) {
    const name = getLowLevelCallName(n);
    if (name) {
      results.push({ node: n as ASTNode, name, loc: getLoc(n) });
    }
  }
  return results;
}

function findSelfdestruct(node: unknown): Array<{ node: ASTNode; loc: SourceLocation | null }> {
  const results: Array<{ node: ASTNode; loc: SourceLocation | null }> = [];
  const all = walkAll(node as ASTNode);
  for (const n of all) {
    if (isFunctionCall(n)) {
      const fc = n as FunctionCall;
      const expr = fc.expression;
      if (isIdentifier(expr) && (expr as Identifier).name === "selfdestruct") {
        results.push({ node: n as ASTNode, loc: getLoc(n) });
      }
    }
  }
  return results;
}

function nodeContainsCall(node: unknown, callNode: FunctionCall): boolean {
  if (!node || typeof node !== "object") return false;
  if (node === callNode) return true;
  const obj = node as Record<string, unknown>;
  for (const [, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (nodeContainsCall(item, callNode)) return true;
      }
    } else if (value && typeof value === "object") {
      if (nodeContainsCall(value, callNode)) return true;
    }
  }
  return false;
}

function isResultChecked(callNode: FunctionCall, fnBody: unknown): boolean {
  if (!fnBody || typeof fnBody !== "object") return false;
  const all = walkAll(fnBody as ASTNode);
  for (const n of all) {
    // Pattern 1: assignment - bool success = target.call(...) or x = target.call(...)
    if (n.type === "BinaryOperation" && n.operator === "=") {
      const bin = n as BinaryOperation;
      if (bin.right === callNode) return true;
    }
    // Pattern 2: variable declaration with initializer - bool success = target.call(...)
    if (n.type === "VariableDeclarationStatement") {
      const vds = n as { initialValue?: unknown };
      if (vds.initialValue === callNode) return true;
    }
    // Pattern 3: require(target.call(...), "msg")
    if (n.type === "FunctionCall") {
      const fc = n as FunctionCall;
      const expr = fc.expression;
      if (expr && typeof expr === "object" && getIdentifierName(expr) === "require") {
        for (const arg of fc.arguments) {
          if (arg === callNode) return true;
        }
      }
    }
    // Pattern 4: if (target.call(...)) { ... }
    if (n.type === "IfStatement") {
      const iff = n as { condition?: unknown };
      if (iff.condition && nodeContainsCall(iff.condition, callNode)) return true;
    }
    // Pattern 5: while / for condition containing the call
    if (n.type === "WhileStatement" || n.type === "ForStatement") {
      const loop = n as { conditionExpression?: unknown };
      if (loop.conditionExpression && nodeContainsCall(loop.conditionExpression, callNode)) return true;
    }
  }
  return false;
}

function hasAccessControlGuard(fn: FunctionDefinition): boolean {
  const modifiers = getFunctionModifiers(fn);
  const guardNames = new Set(["onlyOwner", "onlyAdmin", "onlyGovernance", "onlyRole", "authorized", "ownerOnly"]);
  for (const m of modifiers) {
    if (guardNames.has(m)) return true;
  }
  return false;
}

function isTxOriginInAuthorizationContext(
  originNode: ASTNode,
  fnBody: unknown,
): boolean {
  if (!fnBody || typeof fnBody !== "object") return false;
  const all = walkAll(fnBody as ASTNode);

  // Find all EmitStatements - tx.origin inside emit is informational, not authorization
  const emitStatements = all.filter((n) => isEmitStatement(n));
  for (const emit of emitStatements) {
    if (nodeContainsCall(emit as ASTNode, originNode as unknown as FunctionCall)) {
      // Actually we need to check if originNode is contained in emit, not if emit contains a FunctionCall
      // Let's use a different approach: check if originNode is a descendant of emit
      if (isNodeDescendantOf(originNode, emit)) {
        return false; // informational, not authorization
      }
    }
  }

  // Check if originNode is inside a require() call
  for (const n of all) {
    if (n.type === "FunctionCall") {
      const fc = n as FunctionCall;
      const expr = fc.expression;
      if (expr && typeof expr === "object" && getIdentifierName(expr) === "require") {
        for (const arg of fc.arguments) {
          if (isNodeDescendantOf(originNode, arg)) {
            return true; // authorization
          }
        }
      }
    }
  }

  // Check if originNode is inside an if() condition
  for (const n of all) {
    if (isIfStatement(n)) {
      const iff = n as IfStatement;
      if (iff.condition && isNodeDescendantOf(originNode, iff.condition)) {
        return true; // authorization
      }
    }
  }

  // Check if originNode is part of tx.origin == msg.sender comparison
  for (const n of all) {
    if (isBinaryOperation(n, "==") || isBinaryOperation(n, "!=")) {
      const bin = n as BinaryOperation;
      const leftName = getIdentifierName(bin.left);
      const rightName = getIdentifierName(bin.right);
      // Check if one side is tx.origin and other is msg.sender
      if (
        (leftName === "tx" && rightName === "msg") ||
        (rightName === "tx" && leftName === "msg")
      ) {
        // Need to verify it's actually tx.origin, not just tx and msg as identifiers
        if (isNodeDescendantOf(originNode, n)) {
          return true; // authorization comparison
        }
      }
    }
  }

  return false;
}

function isNodeDescendantOf(node: ASTNode, ancestor: ASTNode): boolean {
  // Walk from ancestor and check if node is found among its descendants
  const descendants = walkAll(ancestor);
  return descendants.includes(node);
}

export function analyzeStatically(sourceCode: string): StaticAnalysisResult {
  const findings: StaticFinding[] = [];
  const limitations: string[] = [];
  const positiveSignals: string[] = [];

  if (!sourceCode || sourceCode.length === 0) {
    return {
      findings: [],
      riskLevel: "INSUFFICIENT_DATA",
      summary: "No source code provided for static analysis.",
      limitations: ["Empty source code cannot be analyzed."],
      positiveSignals: [],
    };
  }

  if (sourceCode.length > MAX_SOURCE_CHARS) {
    return {
      findings: [],
      riskLevel: "INSUFFICIENT_DATA",
      summary: `Source code exceeds ${Math.floor(MAX_SOURCE_CHARS / 1024)} KB limit.`,
      limitations: ["Source code too large for static analysis."],
      positiveSignals: [],
    };
  }

  let ast: ASTNode;
  let usedTolerantParse = false;
  let usedCallOptionsPreprocess = false;
  try {
    ast = parse(sourceCode, { loc: true, range: true });
  } catch {
    const preprocessed = preprocessCallOptions(sourceCode);
    if (preprocessed !== sourceCode) {
      try {
        ast = parse(preprocessed, { loc: true, range: true });
        usedCallOptionsPreprocess = true;
      } catch {
        try {
          ast = parse(sourceCode, { loc: true, range: true, tolerant: true });
          usedTolerantParse = true;
        } catch {
          return {
            findings: [],
            riskLevel: "INSUFFICIENT_DATA",
            summary: "Unable to parse Solidity source code. Static analysis could not be performed.",
            limitations: ["Source code contains syntax errors or is not valid Solidity."],
            positiveSignals: [],
          };
        }
      }
    } else {
      try {
        ast = parse(sourceCode, { loc: true, range: true, tolerant: true });
        usedTolerantParse = true;
      } catch {
        return {
          findings: [],
          riskLevel: "INSUFFICIENT_DATA",
          summary: "Unable to parse Solidity source code. Static analysis could not be performed.",
          limitations: ["Source code contains syntax errors or is not valid Solidity."],
          positiveSignals: [],
        };
      }
    }
  }

  if (usedCallOptionsPreprocess) {
    limitations.push(
      "Solidity call options syntax (call{value: ...}) was pre-processed for analysis. Line numbers may be approximate."
    );
  }

  if (usedTolerantParse) {
    limitations.push(
      "Parser used tolerant mode: some modern Solidity syntax may not have been fully analyzed. Results may be incomplete.",
    );
    return {
      findings: [],
      riskLevel: "INSUFFICIENT_DATA",
      summary: "Source code contains syntax errors or uses unsupported syntax. Static analysis may be incomplete.",
      limitations,
      positiveSignals: [],
    };
  }

  const contracts = walkAll(ast).filter((n) => n.type === "ContractDefinition") as ContractDefinition[];

  if (contracts.length === 0) {
    positiveSignals.push("No contract definitions found in source.");
    return {
      findings: [],
      riskLevel: "LOW",
      summary: "No Solidity contracts detected in the submitted source code.",
      limitations: ["No contract definitions were found to analyze."],
      positiveSignals,
    };
  }

  const allFunctions = findFunctions(ast);

  if (allFunctions.length === 0 && contracts.length > 0) {
    return {
      findings: [],
      riskLevel: "INSUFFICIENT_DATA",
      summary: "Contracts detected but no valid function definitions found. Source may be malformed.",
      limitations: ["No valid function bodies were parsed for analysis."],
      positiveSignals: [],
    };
  }

  for (const contract of contracts) {
    const contractStateVars = new Set(
      walkAll(contract)
        .filter((n) => n.type === "StateVariableDeclaration")
        .flatMap((n) => {
          const svd = n as StateVariableDeclaration;
          return svd.variables.map((v) => {
            const vd = v as { name?: string };
            return vd.name;
          });
        })
        .filter(Boolean) as string[]
    );

    const contractFunctions = walkAll(contract).filter((n) => n.type === "FunctionDefinition") as FunctionDefinition[];

    for (const fn of contractFunctions) {
      const modifiers = getFunctionModifiers(fn);
      const fnBody = fn.body;

      // Rule A: Reentrancy (REENTRANCY-01)
      if (fnBody) {
        const externalCalls = findExternalCallsInBlock(fnBody);
        const stateUpdates = findStateUpdatesInBlock(fnBody, contractStateVars);
        const hasGuard = hasReentrancyGuard(fn);

        for (const call of externalCalls) {
          const callLine = call.loc?.line ?? 0;
          const updateAfterCall = stateUpdates.find((u) => u.loc && u.loc.line >= callLine);

          if (updateAfterCall) {
            const callName = call.name;
            const varName = updateAfterCall.varName;
            const snippet = getSnippet(sourceCode, call.node);
            const guardAdjusted = hasGuard;
            findings.push({
              ruleId: "REENTRANCY-01",
              title: guardAdjusted
                ? "Potential Reentrancy: External Call Before State Update (mitigated by guard)"
                : "Potential Reentrancy: External Call Before State Update",
              severity: guardAdjusted ? "MEDIUM" : "HIGH",
              confidence: guardAdjusted ? "LOW" : "MEDIUM",
              description:
                `An external call (${callName}) is made before a state variable (${varName}) is updated in the same function. This violates the checks-effects-interactions pattern and may allow reentrancy attacks if the external call invokes an untrusted contract.`,
              evidence: snippet,
              recommendation:
                "Reorder operations so that all state updates occur before external calls. Use the checks-effects-interactions pattern: validate inputs, update state, then interact with external contracts. Consider using ReentrancyGuard from OpenZeppelin.",
              location: call.loc ?? { line: 0, column: 0 },
              proof: guardAdjusted
                ? `External call "${callName}" at line ${call.loc?.line ?? "?"} precedes state update to "${varName}" at line ${updateAfterCall.loc?.line ?? "?"} in function "${fn.name ?? "unknown"}". Function has reentrancy guard "${modifiers.join(", ")}", which may mitigate but does not eliminate the risk.`
                : `External call "${callName}" at line ${call.loc?.line ?? "?"} precedes state update to "${varName}" at line ${updateAfterCall.loc?.line ?? "?"} in function "${fn.name ?? "unknown"}".`,
            });
          }
        }
      }

      // Rule B: tx.origin authentication (TX_ORIGIN-01)
      if (fnBody) {
        const origins = findTxOriginUsages(fnBody);
        for (const origin of origins) {
          const isAuth = isTxOriginInAuthorizationContext(origin.node, fnBody);
          if (!isAuth) continue; // Skip informational uses (events, logging, etc.)

          const snippet = getSnippet(sourceCode, origin.node);
          findings.push({
            ruleId: "TX_ORIGIN-01",
            title: "Use of tx.origin for Authorization",
            severity: "HIGH",
            confidence: "MEDIUM",
            description:
              "tx.origin is used in an authorization or access-control condition. tx.origin always refers to the original account that initiated the transaction, not the immediate caller. If a contract uses tx.origin for access control, a user can be tricked into calling a malicious contract that forwards the call, bypassing the intended authorization.",
            evidence: snippet,
            recommendation:
              "Replace tx.origin with msg.sender for authorization checks. msg.sender refers to the immediate caller and is the correct identity to use for access control. Only use tx.origin when you specifically need the original transaction initiator (rare).",
            location: origin.loc ?? { line: 0, column: 0 },
            proof: `tx.origin referenced in authorization context at line ${origin.loc?.line ?? "?"} in function "${fn.name ?? "unknown"}".`,
          });
        }
      }

      // Rule C: Unchecked low-level calls (UNCHECKED_LOWLEVEL-01)
      if (fnBody) {
        const lowLevelCalls = findLowLevelCalls(fnBody);
        for (const lc of lowLevelCalls) {
          if (lc.name === "delegatecall") continue; // handled by rule D
          const isChecked = isResultChecked(lc.node as FunctionCall, fnBody);
          if (!isChecked) {
            const snippet = getSnippet(sourceCode, lc.node);
            findings.push({
              ruleId: "UNCHECKED_LOWLEVEL-01",
              title: "Unchecked Low-Level Call Return Value",
              severity: "HIGH",
              confidence: "HIGH",
              description:
                "A low-level call (.call, .send, or .transfer) is made without checking its return value. If the call fails, execution continues silently, which can lead to unexpected behavior, failed state changes, or loss of funds.",
              evidence: snippet,
              recommendation:
                "Always check the return value of low-level calls. Use require(addr.call{value: amount}(data), \"Error message\") to revert on failure. For .send and .transfer, check the boolean return value before proceeding.",
              location: lc.loc ?? { line: 0, column: 0 },
              proof: `Low-level call ".${lc.name}()" at line ${lc.loc?.line ?? "?"} in function "${fn.name ?? "unknown"}" has its return value unchecked.`,
            });
          }
        }
      }

      // Rule D: Dangerous delegatecall (DELEGATECALL-01)
      if (fnBody) {
        const delegatecalls = findLowLevelCalls(fnBody).filter((c) => c.name === "delegatecall");
        for (const dc of delegatecalls) {
          const snippet = getSnippet(sourceCode, dc.node);
          const isUserControlled = isDelegatecallTargetUserControlled(dc.node as FunctionCall, fnBody);
          findings.push({
            ruleId: "DELEGATECALL-01",
            title: isUserControlled
              ? "Potentially Unsafe delegatecall with User-Controlled Target"
              : "Potentially Unsafe delegatecall with Fixed Target",
            severity: isUserControlled ? "HIGH" : "MEDIUM",
            confidence: isUserControlled ? "HIGH" : "MEDIUM",
            description:
              "delegatecall executes code from another contract in the context of the current contract, using the current contract's storage and msg.sender. If the target address is user-controlled or points to an untrusted contract, it can lead to complete contract compromise, including storage overwrites and fund theft. Even fixed targets should be audited carefully, as the target contract's code may be upgradeable or malicious.",
            evidence: snippet,
            recommendation:
              "Avoid delegatecall with user-controlled addresses. If delegatecall is necessary, restrict the target address to a whitelisted, immutable contract. Consider using libraries with explicit function signatures instead of delegatecall where possible. Audit the target contract thoroughly even if the address is fixed.",
            location: dc.loc ?? { line: 0, column: 0 },
            proof: isUserControlled
              ? `delegatecall at line ${dc.loc?.line ?? "?"} in function "${fn.name ?? "unknown"}" with user-controlled target address.`
              : `delegatecall at line ${dc.loc?.line ?? "?"} in function "${fn.name ?? "unknown"}" with fixed target address. Fixed targets still require audit of the target contract code.`,
          });
        }
      }

      // Rule E: Unprotected selfdestruct (SELFDESTRUCT-01)
      if (fnBody) {
        const selfdestructs = findSelfdestruct(fnBody);
        for (const sd of selfdestructs) {
          const hasGuard = hasAccessControlGuard(fn);
          const severity = hasGuard ? "MEDIUM" : "HIGH";
          const confidence = hasGuard ? "LOW" : "MEDIUM";
          const snippet = getSnippet(sourceCode, sd.node);
          findings.push({
            ruleId: "SELFDESTRUCT-01",
            title: "Unprotected selfdestruct",
            severity,
            confidence,
            description:
              "selfdestruct destroys the contract and sends its remaining balance to a target address. If accessible without proper access control, anyone can destroy the contract and potentially steal its funds or break dependent contracts.",
            evidence: snippet,
            recommendation:
              "Protect selfdestruct with an access-control modifier (e.g., onlyOwner). Ensure that only authorized addresses can trigger contract destruction. Consider whether selfdestruct is truly necessary, as it permanently removes the contract from the blockchain.",
            location: sd.loc ?? { line: 0, column: 0 },
            proof: `selfdestruct() at line ${sd.loc?.line ?? "?"} in function "${fn.name ?? "unknown"}"${hasGuard ? " with access-control modifiers: " + modifiers.join(", ") : " without detectable access-control guard."}`,
          });
        }
      }

      // Check for access control presence as positive signal
      if (modifiers.length > 0) {
        const hasOwnable = modifiers.some((m) => m === "onlyOwner" || m === "ownerOnly");
        if (hasOwnable) positiveSignals.push("Access control (onlyOwner) detected.");
      }
    }
  }

  // Compute risk level
  let riskLevel: StaticAnalysisResult["riskLevel"] = "LOW";
  const hasCritical = findings.some((f) => f.severity === "CRITICAL");
  const hasHigh = findings.some((f) => f.severity === "HIGH");
  const hasMedium = findings.some((f) => f.severity === "MEDIUM");

  if (hasCritical) riskLevel = "CRITICAL";
  else if (hasHigh) riskLevel = "HIGH";
  else if (hasMedium) riskLevel = "MEDIUM";

  if (findings.length === 0) {
    positiveSignals.push("No detectable static-analysis patterns matched.");
  }

  const summary =
    findings.length === 0
      ? "No security patterns detected by static analysis. This does not guarantee the contract is secure."
      : `Static analysis detected ${findings.length} pattern(s) requiring review.`;

  limitations.push(
    "Static analysis cannot detect all vulnerability classes (e.g., business logic, oracle manipulation, front-running)."
  );
  limitations.push(
    "Findings are potential patterns, not confirmed vulnerabilities. Manual review is recommended."
  );
  limitations.push(
    "False positives are possible; not every flagged pattern is exploitable in context."
  );

  return { findings, riskLevel, summary, limitations, positiveSignals };
}

function isDelegatecallTargetUserControlled(
  callNode: FunctionCall,
  fnBody: unknown,
): boolean {
  const fc = callNode as FunctionCall;
  const expr = fc.expression;
  if (!isMemberAccess(expr, "delegatecall")) return false;

  const base = expr.expression;
  if (!base) return true; // No base expression, treat as user-controlled

  // If base is a function parameter (e.g., address target), it's user-controlled
  if (isIdentifier(base)) {
    const baseName = (base as Identifier).name;
    if (!baseName) return true;
    // Check if baseName matches a function parameter name
    const params = walkAll(fnBody as ASTNode).filter(
      (n) => n.type === "VariableDeclaration" && (n as { name?: string }).name === baseName
    );
    if (params.length > 0) return true;
  }

  // Base is not a function parameter. It may be a state variable, constant,
  // or other expression. We cannot be certain it is safe, so flag it but
  // with adjusted severity. Return false to indicate "not clearly user-controlled."
  return false;
}

export function validateSourceSize(sourceCode: unknown): { ok: true; value: string } | { ok: false; error: { code: string; message: string; statusCode: number } } {
  if (typeof sourceCode !== "string" || sourceCode.length === 0) {
    return { ok: false, error: { code: "EMPTY_INPUT", message: "Contract source code is required.", statusCode: 400 } };
  }
  if (sourceCode.length > MAX_SOURCE_CHARS) {
    return { ok: false, error: { code: "INPUT_TOO_LARGE", message: `Source code exceeds ${Math.floor(MAX_SOURCE_CHARS / 1024)} KB limit.`, statusCode: 413 } };
  }
  return { ok: true, value: sourceCode };
}
