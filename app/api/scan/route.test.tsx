import { describe, it, expect } from "vitest";
import { POST } from "./route";

async function postScan(sourceCode: string): Promise<Response> {
  const request = new Request("http://localhost/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceCode }),
  });
  return POST(request);
}

describe("POST /api/scan with static analysis fallback", () => {
  it("returns 200 with static results when NEAR AI is unavailable", async () => {
    delete process.env.NEAR_AI_KEY;

    const source = `
contract Test {
  mapping(address => uint256) public balances;
  function withdraw(uint256 amount) public {
    msg.sender.call("");
    balances[msg.sender] = balances[msg.sender] - amount;
  }
}
`;

    const res = await postScan(source);
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

  it("returns 200 with hybrid results when AI succeeds", async () => {
    process.env.NEAR_AI_KEY = "test-key";

    const source = "contract Test {}";
    const res = await postScan(source);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.analysis.engine).toBeDefined();
    expect(["static", "hybrid"]).toContain(body.analysis.engine);
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
});
