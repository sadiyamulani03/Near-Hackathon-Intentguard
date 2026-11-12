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
  it("returns NOT_CONFIGURED when NEAR_AI_KEY is missing and no client injected", async () => {
    const r = await analyzeContract(validSource);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("NOT_CONFIGURED");
  });

  it("returns EMPTY_INPUT for empty source", async () => {
    process.env.NEAR_AI_KEY = "test-key";
    const r = await analyzeContract("");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("EMPTY_INPUT");
  });

  it("returns provider failure when the AI API throws", async () => {
    process.env.NEAR_AI_KEY = "test-key";
    mockCreate.mockRejectedValue(new Error("upstream down"));
    const r = await analyzeContract(validSource, { client: makeTypedClient() });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe("PROVIDER_FAILURE");
      expect(r.error.statusCode).toBe(502);
    }
  });

  it("returns malformed output when JSON is invalid", async () => {
    process.env.NEAR_AI_KEY = "test-key";
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "not json at all" } }],
    });
    const r = await analyzeContract(validSource, { client: makeTypedClient() });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("MALFORMED_OUTPUT");
  });

  it("returns valid analysis for well-formed model output", async () => {
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
      expect(r.analysis.riskLevel).toBe("HIGH");
      expect(r.analysis.findings).toHaveLength(1);
      expect(r.analysis.findings[0].title).toBe("Reentrancy");
    }
  });
});
