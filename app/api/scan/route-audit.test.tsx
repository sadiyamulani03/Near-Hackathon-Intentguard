import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "./route";

async function postScan(sourceCode: string): Promise<Response> {
  const request = new Request("http://localhost/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceCode }),
  });
  return POST(request);
}

const reentrancySource = `
contract Test {
  mapping(address => uint256) public balances;
  function withdraw(uint256 amount) public {
    msg.sender.call("");
    balances[msg.sender] = balances[msg.sender] - amount;
  }
}
`;

describe("POST /api/scan - static analysis fallback", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.NEAR_AI_KEY;
  });

  afterEach(() => {
    delete process.env.NEAR_AI_KEY;
  });

  it("returns 200 with static results when NEAR AI key is missing", async () => {
    const res = await postScan(reentrancySource);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.analysis.engine).toBe("static");
    expect(body.analysis.findings.length).toBeGreaterThan(0);

    const reentrancy = body.analysis.findings.find((f: { ruleId?: string }) => f.ruleId === "REENTRANCY-01");
    expect(reentrancy).toBeDefined();
    if (reentrancy) {
      expect(reentrancy.line).toBeDefined();
      expect(reentrancy.column).toBeDefined();
      expect(reentrancy.evidence).toBeDefined();
      expect(reentrancy.recommendation).toBeDefined();
      expect(reentrancy.proof).toBeDefined();
    }
  });

  it("returns static results that include ruleId, line, column, proof", async () => {
    const res = await postScan(reentrancySource);
    const body = await res.json();

    const finding = body.analysis.findings[0];
    expect(finding.ruleId).toBeDefined();
    expect(typeof finding.line).toBe("number");
    expect(typeof finding.column).toBe("number");
    expect(finding.proof).toBeDefined();
    expect(finding.evidence).toBeDefined();
    expect(finding.recommendation).toBeDefined();
  });

  it("includes static disclaimer in limitations", async () => {
    const res = await postScan(reentrancySource);
    const body = await res.json();

    const hasStaticDisclaimer = body.analysis.limitations.some((l: string) =>
      l.includes("Deterministic static-analysis")
    );
    expect(hasStaticDisclaimer).toBe(true);
  });

  it("returns 400 for empty source code", async () => {
    const res = await postScan("");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("EMPTY_INPUT");
  });

  it("returns 413 for oversized source code", async () => {
    const big = "x".repeat(64 * 1024 + 1);
    const res = await postScan(big);
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INPUT_TOO_LARGE");
  });

  it("returns static results for malformed Solidity", async () => {
    const broken = "contract Broken { function foo() public { if (true { } }";
    const res = await postScan(broken);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.analysis.engine).toBe("static");
    expect(body.analysis.riskLevel).toBe("INSUFFICIENT_DATA");
  });

  it("returns 200 for safe contract with no findings", async () => {
    const safe = "contract Safe { uint256 public x; function set(uint256 v) public { x = v; } }";
    const res = await postScan(safe);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.analysis.engine).toBe("static");
    expect(body.analysis.findings.length).toBe(0);
    expect(body.analysis.summary).toContain("does not guarantee");
  });
});
