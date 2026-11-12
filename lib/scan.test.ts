import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { type OpenAI as OpenAIClient } from "openai";
import {
  validateSourceCode,
  analyzeContract,
  isValidSeverity,
  isValidRiskLevel,
  mapAiRiskToFrontend,
} from "@/lib/scan";

const mockCreate = vi.fn();

const makeClient = () => ({
  chat: {
    completions: {
      create: mockCreate,
    },
  },
});

const makeTypedClient = () => makeClient() as unknown as OpenAIClient;

beforeEach(() => {
  mockCreate.mockReset();
  delete process.env.NEAR_AI_KEY;
});

afterEach(() => {
  delete process.env.NEAR_AI_KEY;
});

const validSource = "contract Test { function foo() public {} }";

describe("validateSourceCode", () => {
  it("rejects empty input", () => {
    const r = validateSourceCode("");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("EMPTY_INPUT");
  });

  it("rejects non-string", () => {
    const r = validateSourceCode(null as unknown as string);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("EMPTY_INPUT");
  });

  it("rejects oversized input", () => {
    const big = "x".repeat(64 * 1024 + 1);
    const r = validateSourceCode(big);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("INPUT_TOO_LARGE");
  });

  it("accepts valid input", () => {
    const r = validateSourceCode("contract Test {}");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe("contract Test {}");
  });
});

describe("severity/risk validators", () => {
  it("validates severities", () => {
    expect(isValidSeverity("HIGH")).toBe(true);
    expect(isValidSeverity("BOGUS")).toBe(false);
  });

  it("validates risk levels", () => {
    expect(isValidRiskLevel("CRITICAL")).toBe(true);
    expect(isValidRiskLevel("INSUFFICIENT_DATA")).toBe(true);
    expect(isValidRiskLevel("BOGUS")).toBe(false);
  });

  it("maps risk to frontend", () => {
    expect(mapAiRiskToFrontend("CRITICAL")).toBe("critical");
    expect(mapAiRiskToFrontend("HIGH")).toBe("critical");
    expect(mapAiRiskToFrontend("MEDIUM")).toBe("warning");
    expect(mapAiRiskToFrontend("LOW")).toBe("informational");
    expect(mapAiRiskToFrontend("INSUFFICIENT_DATA")).toBe("informational");
  });
});

describe("analyzeContract", () => {
  it("returns static results when NEAR_AI_KEY is missing (no AI)", async () => {
    const r = await analyzeContract(validSource);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.analysis.engine).toBe("static");
      expect(r.analysis.findings.length).toBeGreaterThanOrEqual(0);
    }
  });

  it("returns static results when AI API throws", async () => {
    process.env.NEAR_AI_KEY = "test-key";
    mockCreate.mockRejectedValue(new Error("upstream down"));
    const r = await analyzeContract(validSource, { client: makeTypedClient() });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.analysis.engine).toBe("static");
    }
  });

  it("returns static results when AI returns malformed output", async () => {
    process.env.NEAR_AI_KEY = "test-key";
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "not json at all" } }],
    });
    const r = await analyzeContract(validSource, { client: makeTypedClient() });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.analysis.engine).toBe("static");
    }
  });

  it("returns hybrid results when AI succeeds with valid output", async () => {
    process.env.NEAR_AI_KEY = "test-key";
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({
        riskLevel: "HIGH",
        summary: "Reentrancy risk detected.",
        findings: [
          {
            title: "Reentrancy",
            severity: "HIGH",
            description: "External call before state update.",
            evidence: "withdraw()",
            recommendation: "Use checks-effects-interactions.",
            confidence: "HIGH",
          },
        ],
        positiveSignals: ["Ownable used"],
        limitations: ["No test suite provided"],
        disclaimer: "AI-assisted analysis is not a formal security audit.",
      }) } }],
    });
    const r = await analyzeContract(validSource, { client: makeTypedClient() });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.analysis.engine).toBe("hybrid");
      expect(r.analysis.riskLevel).toBe("HIGH");
      expect(r.analysis.findings[0].title).toBe("Reentrancy");
    }
  });

  it("includes static findings with ruleId, line, column, and proof", async () => {
    const reentrancySource = `
contract VulnerableVault {
  mapping(address => uint256) public balances;
  function withdraw(uint256 amount) public {
    msg.sender.call("");
    balances[msg.sender] = balances[msg.sender] - amount;
  }
}
`;
    const r = await analyzeContract(reentrancySource);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const reentrancyFinding = r.analysis.findings.find((f) => f.ruleId === "REENTRANCY-01");
      expect(reentrancyFinding).toBeDefined();
      if (reentrancyFinding) {
        expect(reentrancyFinding.ruleId).toBe("REENTRANCY-01");
        expect(reentrancyFinding.line).toBeGreaterThan(0);
        expect(reentrancyFinding.column).toBeGreaterThanOrEqual(0);
        expect(reentrancyFinding.proof).toBeDefined();
        expect(reentrancyFinding.evidence).toBeDefined();
        expect(reentrancyFinding.recommendation).toBeDefined();
      }
    }
  });

  it("returns EMPTY_INPUT for empty source", async () => {
    process.env.NEAR_AI_KEY = "test-key";
    const r = await analyzeContract("");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("EMPTY_INPUT");
  });
});
