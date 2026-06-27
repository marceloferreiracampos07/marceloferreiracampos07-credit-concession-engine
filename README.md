# PCP — Rule Engine

A **clean-architecture, domain-driven rule engine** built with **TypeScript**, **Express**, and **Zod**. It evaluates dynamic credit-approval rules stored as Abstract Syntax Trees (AST) in JSON format, returning deterministic `APPROVED` / `REJECTED` verdicts without a single hardcoded business condition.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Three-Layer Protection Model](#three-layer-protection-model)
- [AST Rule Format](#ast-rule-format)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Test Scenarios](#test-scenarios)
- [Tech Stack](#tech-stack)

---

## Overview

The engine receives a **loan evaluation payload** from the API layer, fetches the tenant-specific **AST rule** from the data layer, and recursively evaluates the tree to produce a verdict.

```
API Payload  →  Border Validation (Zod)  →  Fetch Rule (AST)  →  Evaluate Tree  →  APPROVED | REJECTED
```

Key design principles:
- **Zero hardcode**: all business logic lives in the AST stored in the database.
- **Fail-fast**: execution halts at the first failed layer and returns a clean rejection payload.
- **Immutability**: the engine performs a pure read-only traversal over the input payload.
- **Isolation**: malformed rules are caught at the use-case boundary — no 500 errors, no server crashes.

---

## Architecture

The module follows **Clean Architecture** with clear separation of concerns:

```
src/module/Rule-engine/
│
├── dtos/           # Input/output data contracts (Zod schema + TypeScript types)
├── repositories/   # Repository interface (IRuleRepository)
├── types/          # AST type definitions (RuleNode, operators)
├── validators/     # Layer 1 — Border validation logic
├── USecase/        # Core use case — orchestrates all three layers
└── test/           # Vitest unit tests (5 scenarios)
```

The `EvaluateRuleUseCase` is framework-agnostic. It depends only on the `IRuleRepository` interface, which can be backed by any data source (SQL, NoSQL, in-memory mock).

---

## Three-Layer Protection Model

### Layer 1 — Border Validation (Syntactic)
Executed via Zod schema before any business logic runs.

| Rule | Detail |
|------|--------|
| `tenantId` | Required, trimmed, non-empty string |
| `loanAmount` | Required positive number (> 0) |
| `client.score` | Required non-negative number (>= 0) |
| `client.income` | Required positive number (> 0) |

Any violation throws a structured `VALIDATION_ERROR` and immediately returns `REJECTED`.

---

### Layer 2 — Semantic Validation (Business)
The AST tree is traversed before execution to verify structural integrity.

- **Operator whitelist**: only `AND`, `OR`, `>`, `<`, `=`, `!=` are accepted.
- **Variable anchoring**: all dynamic payload references **must** start with `$` (e.g. `$client.score`). Missing prefix returns rejected, preventing code injection.
- **Node structure**: comparison nodes must contain exactly 2 elements in their array.

---

### Layer 3 — Core Execution Engine
Recursive, read-only traversal of the AST with short-circuit evaluation.

| Operator | Behaviour |
|----------|-----------|
| `AND` | Returns `false` on first falsy child (short-circuit) |
| `OR` | Returns `true` on first truthy child (short-circuit) |
| `>` `<` `=` `!=` | Resolves `$path` references via null-safe deep-get, then compares |

If a payload path does not exist, the engine fails gracefully and returns `REJECTED`.

---

## AST Rule Format

Rules are stored as JSON and support arbitrarily nested logical and comparison nodes.

**Example — credit approval rule:**
```json
{
  "AND": [
    { ">": ["$client.score", 600] },
    { "<": ["$loanAmount", "$client.income"] }
  ]
}
```

**Example — nested rule (AND containing OR):**
```json
{
  "AND": [
    { "<": ["$loanAmount", 6000] },
    {
      "OR": [
        { ">": ["$client.score", 600] },
        { ">": ["$client.income", 5000] }
      ]
    }
  ]
}
```

**Supported operators:**

| Type | Operators |
|------|-----------|
| Logical | `AND`, `OR` |
| Comparison | `>`, `<`, `=`, `!=` |

---

## Project Structure

```
pcp/
├── src/
│   └── module/
│       └── Rule-engine/
│           ├── dtos/
│           │   ├── evaluate-rule-input.dto.ts   # Zod schema + EvaluateRuleInput type
│           │   └── evaluate-rule-output.dto.ts  # EvaluateRuleOutput type
│           ├── repositories/
│           │   └── irule.repository.ts          # IRuleRepository interface
│           ├── types/
│           │   └── rule-ast.types.ts            # RuleNode, ComparisonNode, LogicalNode
│           ├── validators/
│           │   └── border-validation.ts         # Generic Zod border validation helper
│           ├── USecase/
│           │   └── evaluate-rule.usecase.ts     # EvaluateRuleUseCase (orchestrator)
│           └── test/
│               └── evaluate-rule.usecase.spec.ts # 5 Vitest test scenarios
├── .gitignore
├── package.json
└── README.md
```

---

## Getting Started

**Prerequisites:** Node.js >= 18

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd pcp

# 2. Install dependencies
npm install
```

---

## Running Tests

```bash
npm test
```

Tests are powered by **Vitest** and run entirely in-memory — no database or external services required.

---

## Test Scenarios

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Payload satisfies all conditions in a simple `AND` rule | `APPROVED` |
| 2 | Payload satisfies `AND` containing a nested `OR` | `APPROVED` |
| 3 | Payload is missing a required field (`client`) | `REJECTED` |
| 4 | Rule contains an invalid operator (`XOR`) | `REJECTED` |
| 5 | Short-circuit: first condition of `AND` fails immediately | `REJECTED` |

---

## Tech Stack

| Tool | Role |
|------|------|
| **TypeScript** | Static typing across the entire codebase |
| **Express 5** | HTTP framework (routing layer) |
| **Zod 4** | Runtime schema validation (border protection) |
| **Vitest** | Unit testing framework |
