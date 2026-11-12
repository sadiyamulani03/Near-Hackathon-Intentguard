import { describe, it, expect } from "vitest";
import {
  analyzeStatically,
  type StaticFinding,
} from "./static-analysis";

const reentrancyVulnerable = `
contract VulnerableVault {
  mapping(address => uint256) public balances;

  function withdraw(uint256 amount) public {
    msg.sender.call("");
    balances[msg.sender] = balances[msg.sender] - amount;
  }
}
`;

const reentrancySafe = `
contract SafeVault {
  mapping(address => uint256) public balances;

  function withdraw(uint256 amount) public {
    balances[msg.sender] = balances[msg.sender] - amount;
    msg.sender.call("");
  }
}
`;

const txOriginVulnerable = `
contract OwnerOnly {
  address public owner;

  function isOwner() public view returns (bool) {
    return tx.origin == owner;
  }

  function withdraw() public {
    if (tx.origin == owner) {
      owner.transfer(address(this).balance);
    }
  }
}
`;

const uncheckedCall = `
contract Unchecked {
  function sendFunds(address target) public {
    target.call("");
  }
}
`;

const checkedCall = `
contract Checked {
  function sendFunds(address target) public {
    require(target.call(""), "Call failed");
  }
}
`;

const delegatecallUsage = `
contract DelegateExample {
  function delegate(address target) public {
    target.delegatecall(abi.encodeWithSignature("foo()"));
  }
}
`;

const selfdestructUnprotected = `
contract Destructible {
  function kill() public {
    selfdestruct(msg.sender);
  }
}
`;

const selfdestructProtected = `
contract Destructible {
  address public owner;

  modifier onlyOwner() {
    _;
  }

  function kill() public onlyOwner {
    selfdestruct(msg.sender);
  }
}
`;

const reentrancyVulnerableCallOptions = `
contract VulnerableCallOptions {
  mapping(address => uint256) public balances;

  function withdraw(uint256 amount) public {
    msg.sender.call{value: amount}("");
    balances[msg.sender] = balances[msg.sender] - amount;
  }
}
`;

const uncheckedCallOptions = `
contract UncheckedCallOptions {
  function sendFunds(address target) public {
    target.call{value: 100}("");
  }
}
`;

const malformedSolidity = `
contract Broken {
  function foo() public {
    if (true {
  }
}
`;

const falsePositiveSafe = `
contract Simple {
  uint256 public x;

  function set(uint256 val) public {
    x = val;
  }

  function get() public view returns (uint256) {
    return x;
  }
}
`;

const safeNoExternalCalls = `
contract Safe {
  mapping(address => uint256) public balances;

  function deposit() public payable {
    balances[msg.sender] = balances[msg.sender] + msg.value;
  }
}
`;

function findFinding(findings: StaticFinding[], ruleId: string): StaticFinding | undefined {
  return findings.find((f) => f.ruleId === ruleId);
}

describe("static analysis - reentrancy", () => {
  it("detects external call before state update", () => {
    const result = analyzeStatically(reentrancyVulnerable);
    const finding = findFinding(result.findings, "REENTRANCY-01");
    expect(finding).toBeDefined();
    if (finding) {
      expect(finding.severity).toBe("HIGH");
      expect(finding.confidence).toBe("MEDIUM");
      expect(finding.location.line).toBeGreaterThan(0);
      expect(finding.evidence).toContain(".call");
      expect(finding.ruleId).toBe("REENTRANCY-01");
    }
  });

  it("detects reentrancy with call{value:} options syntax", () => {
    const result = analyzeStatically(reentrancyVulnerableCallOptions);
    const finding = findFinding(result.findings, "REENTRANCY-01");
    expect(finding).toBeDefined();
    if (finding) {
      expect(finding.severity).toBe("HIGH");
      expect(finding.confidence).toBe("MEDIUM");
      expect(finding.evidence).toContain(".call");
    }
    expect(result.limitations.length).toBeGreaterThan(0);
  });

  it("does not flag checks-effects-interactions safe ordering", () => {
    const result = analyzeStatically(reentrancySafe);
    const finding = findFinding(result.findings, "REENTRANCY-01");
    expect(finding).toBeUndefined();
  });
});

describe("static analysis - tx.origin", () => {
  it("detects tx.origin in authorization", () => {
    const result = analyzeStatically(txOriginVulnerable);
    const finding = findFinding(result.findings, "TX_ORIGIN-01");
    expect(finding).toBeDefined();
    if (finding) {
      expect(finding.severity).toBe("HIGH");
      expect(finding.confidence).toBe("MEDIUM");
      expect(finding.evidence).toContain("tx.origin");
      expect(finding.proof).toContain("tx.origin");
    }
  });
});

describe("static analysis - unchecked low-level calls", () => {
  it("detects unchecked .call()", () => {
    const result = analyzeStatically(uncheckedCall);
    const finding = findFinding(result.findings, "UNCHECKED_LOWLEVEL-01");
    expect(finding).toBeDefined();
    if (finding) {
      expect(finding.severity).toBe("HIGH");
      expect(finding.confidence).toBe("HIGH");
      expect(finding.evidence).toContain(".call");
    }
  });

  it("detects unchecked .call{value:} options syntax", () => {
    const result = analyzeStatically(uncheckedCallOptions);
    const finding = findFinding(result.findings, "UNCHECKED_LOWLEVEL-01");
    expect(finding).toBeDefined();
    if (finding) {
      expect(finding.severity).toBe("HIGH");
      expect(finding.confidence).toBe("HIGH");
      expect(finding.evidence).toContain(".call");
    }
  });

  it("does not flag checked .call()", () => {
    const result = analyzeStatically(checkedCall);
    const finding = findFinding(result.findings, "UNCHECKED_LOWLEVEL-01");
    expect(finding).toBeUndefined();
  });
});

describe("static analysis - delegatecall", () => {
  it("detects delegatecall usage", () => {
    const result = analyzeStatically(delegatecallUsage);
    const finding = findFinding(result.findings, "DELEGATECALL-01");
    expect(finding).toBeDefined();
    if (finding) {
      expect(finding.severity).toBe("MEDIUM");
      expect(finding.evidence).toContain("delegatecall");
    }
  });
});

describe("static analysis - selfdestruct", () => {
  it("detects unprotected selfdestruct", () => {
    const result = analyzeStatically(selfdestructUnprotected);
    const finding = findFinding(result.findings, "SELFDESTRUCT-01");
    expect(finding).toBeDefined();
    if (finding) {
      expect(finding.severity).toBe("HIGH");
      expect(finding.confidence).toBe("MEDIUM");
      expect(finding.proof).toContain("without detectable access-control guard");
    }
  });

  it("detects protected selfdestruct with lower severity", () => {
    const result = analyzeStatically(selfdestructProtected);
    const finding = findFinding(result.findings, "SELFDESTRUCT-01");
    expect(finding).toBeDefined();
    if (finding) {
      expect(finding.severity).toBe("MEDIUM");
      expect(finding.confidence).toBe("LOW");
      expect(finding.proof).toContain("with access-control modifiers");
    }
  });
});

describe("static analysis - malformed input", () => {
  it("handles malformed Solidity gracefully", () => {
    const result = analyzeStatically(malformedSolidity);
    expect(result.riskLevel).toBe("INSUFFICIENT_DATA");
    expect(result.findings).toHaveLength(0);
    expect(result.limitations.length).toBeGreaterThan(0);
  });

  it("handles empty input", () => {
    const result = analyzeStatically("");
    expect(result.riskLevel).toBe("INSUFFICIENT_DATA");
  });
});

describe("static analysis - false positive edge cases", () => {
  it("does not flag safe contracts with no external calls", () => {
    const result = analyzeStatically(safeNoExternalCalls);
    const reentrancy = findFinding(result.findings, "REENTRANCY-01");
    const txOrigin = findFinding(result.findings, "TX_ORIGIN-01");
    const unchecked = findFinding(result.findings, "UNCHECKED_LOWLEVEL-01");
    expect(reentrancy).toBeUndefined();
    expect(txOrigin).toBeUndefined();
    expect(unchecked).toBeUndefined();
  });

  it("does not flag simple safe contract", () => {
    const result = analyzeStatically(falsePositiveSafe);
    expect(result.findings).toHaveLength(0);
  });
});

describe("static analysis - finding structure", () => {
  it("every finding has required fields", () => {
    const result = analyzeStatically(reentrancyVulnerable);
    for (const f of result.findings) {
      expect(f.ruleId).toBeDefined();
      expect(f.title).toBeDefined();
      expect(f.severity).toBeDefined();
      expect(f.confidence).toBeDefined();
      expect(f.description).toBeDefined();
      expect(f.evidence).toBeDefined();
      expect(f.recommendation).toBeDefined();
      expect(f.location.line).toBeGreaterThan(0);
      expect(f.location.column).toBeGreaterThanOrEqual(0);
      expect(f.proof).toBeDefined();
    }
  });

  it("every finding has a stable rule ID", () => {
    const result = analyzeStatically(reentrancyVulnerable);
    const ruleIds = result.findings.map((f) => f.ruleId);
    const validRuleIds = [
      "REENTRANCY-01",
      "TX_ORIGIN-01",
      "UNCHECKED_LOWLEVEL-01",
      "DELEGATECALL-01",
      "SELFDESTRUCT-01",
    ];
    for (const id of ruleIds) {
      expect(validRuleIds).toContain(id);
    }
  });

  it("risk level is consistent with findings", () => {
    const result = analyzeStatically(reentrancyVulnerable);
    expect(result.riskLevel).toBe("HIGH");
    expect(result.summary).toBeDefined();
    expect(result.limitations.length).toBeGreaterThan(0);
  });
});
