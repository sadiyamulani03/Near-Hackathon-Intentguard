import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ScanPage from "./page";

const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("ScanPage contract scanning", () => {
  it("renders the empty state when no input is provided", () => {
    render(<ScanPage />);
    expect(screen.getByText(/ready to scan/i)).toBeDefined();
  });

  it("shows an error banner when the analysis service fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: false, error: { code: "PROVIDER_FAILURE", message: "boom" } }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      })
    );
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    render(<ScanPage />);

    const textarea = screen.getByLabelText(/contract source code/i);
    fireEvent.input(textarea, { target: { value: "contract Test {}" } });

    const button = screen.getByRole("button", { name: /analyze/i });
    fireEvent.click(button);

    await new Promise((r) => setTimeout(r, 0));

    expect(screen.getByText(/analysis unavailable/i)).toBeDefined();
    expect(screen.getByText(/boom/i)).toBeDefined();
  });

  it("displays findings when the analysis succeeds", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          analysis: {
            riskLevel: "HIGH",
            summary: "Reentrancy risk detected.",
            findings: [],
            positiveSignals: [],
            limitations: [],
            disclaimer: "AI-assisted analysis is not a formal security audit.",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    render(<ScanPage />);

    const textarea = screen.getByLabelText(/contract source code/i);
    fireEvent.input(textarea, { target: { value: "contract Test {}" } });

    const button = screen.getByRole("button", { name: /analyze/i });
    fireEvent.click(button);

    await new Promise((r) => setTimeout(r, 0));

    expect(screen.getByText(/overall risk: high/i)).toBeDefined();
    expect(screen.getByText(/reentrancy risk detected/i)).toBeDefined();
  });
});
