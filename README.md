# AgileFlow

**English** | [中文](README.zh-CN.md)

<p align="center">
  <strong>Make AI hand over a delivery pack you can verify, trace, and take over—not just code that looks finished.</strong>
</p>

<p align="center">
  A staged delivery skill and CLI for AI coding agents.<br>
  Say what you need; it chooses the workflow, saves delivery artifacts, verifies results, and resumes interrupted work.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@agileflow/cli"><img src="https://img.shields.io/npm/v/@agileflow/cli.svg?style=flat-square&color=cb3837" alt="npm"></a>
  <a href="skills/agileflow/templates/validate-atlas-gate.md"><img src="https://img.shields.io/badge/checks-9%20automatic-brightgreen?style=flat-square" alt="9 automatic checks"></a>
  <img src="https://img.shields.io/badge/routing-/af-7c3aed?style=flat-square" alt="semantic routing">
  <img src="https://img.shields.io/badge/flow-extensible-2563eb?style=flat-square" alt="extensible flow">
  <img src="https://img.shields.io/badge/agents-multi--role-0891b2?style=flat-square" alt="multi-agent">
  <img src="https://img.shields.io/badge/runtime-receipts-f97316?style=flat-square" alt="runtime receipts">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT"></a>
</p>

```bash
npx @agileflow/cli@latest init
/af build an order API with WeChat and Alipay refunds — handle the rest
```

> **Important:** AgileFlow is not just a prompt pack.
>
> **AgileFlow = one `/af` entry point + an adaptable delivery workflow + automatic quality checks + a resumable `atlas/` delivery pack.**

**Jump to:** [Demo](#what-a-session-looks-like) · [Problems](#problems-it-solves) · [Quick start](#start-in-1-minute) · [Core capabilities](#four-core-capabilities) · [Compare](#vs-openspec-and-superpowers) · [Advanced](#advanced-how-it-works-and-how-to-extend-it)

---

## What a session looks like

```text
You  /af build an order API with WeChat and Alipay refunds — handle the rest
AI   → Recognizes a new feature that needs full delivery
     → Clarifies requirements and acceptance criteria
     → Defines API contracts, failure cases, and development tasks
     → Checks that the plan is complete, then starts coding
     → Runs tests and records the actual commands and results
     → Reports what passed and anything that still needs a person
You  Open atlas/ — requirements, design, implementation notes, and test results are ready to hand off

Later /af
AI   → Reads saved progress and continues from the last checkpoint
```

> `/af` is a **chat command** for the agent — **not** a shell command. Use `npx @agileflow/cli`, not bare `npx agileflow` (an unrelated npm package).

---

## Problems it solves

| Typical AI coding | AgileFlow |
|-------------------|-----------|
| Requirements only in chat | Lands `REQ-*.md` + BDD AC |
| Code first, missing design | No `write-code` green → no business code |
| Verbal “we tested it” | Checks real commands, exit codes, reports |
| Checked tasks, missing files | Cross-checks todo · T docs · proof · acceptance |
| Multi-agent work is hard to trace | Saves assignments and execution records |
| Chat closes, work is lost | Saves progress and resumes from the checkpoint |
| Old success is reused after edits | Results bind to file contents and are rechecked after changes |

You leave with more than “code + done”:

```text
code
+ confirmable requirements
+ reviewable design and contracts
+ per-task design notes and run proof
+ traceable acceptance reports
+ recoverable flow state
= a handoff-ready delivery pack
```

---

## Start in 1 minute

Requires Node.js 20+.

```bash
# User-level: install once for Cursor / Claude / Codex / Qoder / WorkBuddy / CodeBuddy
npx @agileflow/cli@latest init
```

Reload the host, then in chat:

```text
/af build a user login API
```

If you did not specify who should make decisions, the agent asks first:

| What you say | Effect |
|--------------|--------|
| **Handle the rest** | The agent continues after automatic checks and minimizes interruptions |
| **Let me confirm key decisions** | The agent pauses for you at requirements, solution, and other key decisions |

The quality bar is identical. Delegating decisions reduces interruptions; it **does not remove documentation or skip tests**.

Project-only install:

```bash
cd YOUR_PROJECT
npx @agileflow/cli@latest init --root .   # → {project}/skills/ (single copy, shared by all hosts)
npx @agileflow/cli gate --bootstrap-scaffold --root .
```

Bare `/af` → read progress and resume.

---

## Four core capabilities

### 1. `/af` semantic routing

No need to memorize stages.

| You say | Default route |
|---------|---------------|
| “Build a refund API” | Full delivery: requirements → solution → development → acceptance |
| “Fix login timeout” / “add this unit test” | Handle the focused task directly |
| “Explore the bottleneck first” | Analyze and recommend without changing code |
| Bare `/af` / “continue” | Resume |

Advanced users can still jump to `/af-req`, `/af-sol`, `/af-dev`, or `/af-test`; direct stage commands do not bypass prerequisites or automatic checks.

### 2. Extensible `flow.yaml`

`atlas/flow.yaml` is the project execution graph: custom steps, depends, parallel waves, outputs.  
Most users never need to edit it. For custom workflows, `prompt` may be a short name (`req`/`model`/`sol`/`dev`), `null` (handled by the current agent), or a **path to an existing role file** (for example, `atlas/role/role-security.md`).

After flow changes, run `update --step-skills-only` to refresh `/af-*` commands, then **abandon the old Run + start a new one** so the new workflow is checked from the start.

### 3. Automatic quality checks

Nine checks cover requirements, solution, implementation evidence, and acceptance. All must pass before the task is complete.

Each successful result binds to the current task, workflow version, and file contents. Editing artifacts, rewinding a stage, or changing the flow invalidates old results.

Checks only verify existing evidence — **they never invent evidence for the agent**.

### 4. An `atlas/` delivery pack with execution history

`atlas/` stores requirements, design, tasks, acceptance results, and multi-agent execution history.

Close the IDE and still hand off. Auditors can answer: **how was this requirement proven?**

---

## Pipeline at a glance

```text
idea ─▶ req ─▶ model? ─▶ sol ─▶ dev (design→code→proof) ─▶ test ─▶ handoff
           │        │       │              │
           ▼        ▼       ▼              ▼
        BDD AC   domain   contracts     ## 结果 really ran
```

```text
atlas/
├── flow.yaml / agileflow.env / todo.md
├── requirements/ · model/ · solution/ · dev/ · tests/
├── humanTodo.md · agileflow-dispatch.json
└── runs/<runId>/              # artifact registry + JSONL receipts
```

Philosophy → [majorflow.md](majorflow.md) · Execution → [SKILL.md](skills/agileflow/SKILL.md) · Install details → [QUICKSTART.md](skills/agileflow/QUICKSTART.md)

---

## vs OpenSpec and Superpowers

They help you **think clearly and write correctly**. AgileFlow owns **whether finished work left evidence the machine will accept**.

| | OpenSpec | Superpowers | **AgileFlow** |
|---|----------|-------------|---------------|
| Owns | How specs evolve | How plans execute (TDD) | **Whether the delivery pack is complete and evidenced** |
| “Done” | Soft alignment | Skills + review | **CLI hard-block; `exit 0` to advance** |
| You leave with | Living `specs/` | Plan + code discipline | **`atlas/` delivery pack + acceptance results + execution history** |

Not mutually exclusive: OpenSpec for long-lived specs, Superpowers for execution craft, AgileFlow for the delivery boundary.

---

## Who it's for · who it's not

**For:** handoff to clients / QA / the next engineer / audit; work spanning requirements · APIs · impl · acceptance; a shared machine definition of “done”; long runs that must survive closed chats.

**Not for:** one-shot Q&A; one-line copy tweaks; teams unwilling to keep any in-repo delivery docs; expecting a substitute for test frameworks, CI, or product judgment.

AgileFlow is a **delivery protocol and validation layer** for agents — not a cloud task platform.

---

## Advanced: how it works and how to extend it

### Why “fake done” is hard

Formal flow creates `atlas/runs/<runId>/`. Each stage closes the loop:

```text
Role-agent output → register files → record execution → run checks → save results → advance progress
```

- A passed check is valid for **this Run / attempt / flow / artifacts** — not merely “it passed once.”
- With an active Run, only Runtime JSONL receipts count; legacy Markdown PASS cannot backfill.
- Secrets, approvals, real devices go to `humanTodo.md` — never fake PASS.

<details>
<summary>Nine automatic checks and their internal names</summary>

| Gate | Blocks |
|------|--------|
| `init-confirm` | Brownfield target without confirmed scoped inventory |
| `req-confirm` | Incomplete REQ / scope / BDD AC |
| `mod-confirm` | Incomplete or silently skipped modeling |
| `sol-confirm` | Missing architecture, contracts, boundaries, or todo |
| `dev-step1-literal` | Empty development design |
| `write-code` | Business code before req/sol ready |
| `dev-complete` | Checked tasks without run proof |
| `test-entry` | Missing test entry / smoke |
| `req-trace` | Broken REQ → F → T → AC → report chain |

</details>

### How multiple agents collaborate

The current session coordinates the work: it reads the workflow, assigns tasks, runs checks, and advances progress.

Requirement, modeling, solution, and development content comes from the corresponding role agents; execution is recorded in `agileflow-dispatch.json`.

Hosts without sub-agent support explicitly report degraded operation — **quality standards do not relax**.

### Extending it

| Layer | Where | What you get |
|-------|-------|--------------|
| Steps | `atlas/flow.yaml` | Security review, design review, … |
| Depends / parallel | `depends` · `outputs` | Waves and artifact waits |
| Roles / prompts | `prompt` + `atlas/role/*.md` | Short name, current-agent execution, or a prompt path |
| Chat commands | `update --step-skills-only` | Make new `af-*` steps available as host `/af-*` commands |
| Validation | gate / validator | Team “done” as non-zero exit |

**Three `prompt` forms:**

| `prompt` | Who runs / what is loaded |
|----------|---------------------------|
| `req` / `model` / `sol` / `dev` | Corresponding role agent; default instructions, or project override `atlas/role/role-{key}.md` |
| `null` | Current agent; reads the matching `phases/*.md` for the step id |
| `atlas/role/role-xxx.md` | Corresponding role agent; **file must already exist** (team custom role) |

Example: insert a security review with a custom role file:

```yaml
# Write atlas/role/role-security.md first, then wire it into flow
steps:
  - id: af-security-review
    mode: strict
    prompt: atlas/role/role-security.md
    depends:
      - atlas/solution/
    outputs:
      - atlas/logs/security-review.md
```

After editing flow, **refresh chat commands** so hosts get `/af-security-review`:

```bash
npx @agileflow/cli@latest update --step-skills-only --root .
# → creates/updates .cursor|claude|…/skills/af-security-review/SKILL.md
# → removes commands for custom steps deleted from flow
```

Then rotate the Run (flow changes cannot reuse old PASS):

```bash
npx @agileflow/cli run abandon --reason "added security review step" --root .
npx @agileflow/cli run start --change security-review --step af-req --root .
```

> **Flow change = `update --step-skills-only` (refresh commands) + abandon old Run + start new Run.**
>
> Edit yaml without update → no new `/af-*` in chat. Update without a new Run → receipts may still bind the old `flowDigest`.

New steps / depends / output paths: edit `flow.yaml`.  
Content checks, command proof, or cross-doc trace: extend a validator — prompts alone are not enough.  
Orchestration, `write-code` prerequisites, and Runtime receipt rules do not vanish when you extend.

<details>
<summary>Common CLI</summary>

```bash
npx @agileflow/cli@latest init
npx @agileflow/cli@latest update --step-skills-only --root .
npx @agileflow/cli run status --json --root .
npx @agileflow/cli gate --gate write-code --root .
npx @agileflow/cli run gate-status --gate req-confirm --json --root .
npx @agileflow/cli gate --list-gates --root .
npx @agileflow/cli run abandon --reason "flow changed" --root .
npx @agileflow/cli run start --change refund-v2 --step af-req --root .
```

WorkBuddy → `~/.workbuddy/skills/`; CodeBuddy → `~/.codebuddy/skills/`. `--tools workbuddy` or `codebuddy` installs **both**.

</details>

### Docs map

| Want | Doc |
|------|-----|
| Methodology | [majorflow.md](majorflow.md) |
| Agent execution rules | [SKILL.md](skills/agileflow/SKILL.md) |
| Install and hosts | [QUICKSTART.md](skills/agileflow/QUICKSTART.md) |
| Gate details | [validate-atlas-gate.md](skills/agileflow/templates/validate-atlas-gate.md) |
| Troubleshooting | [TROUBLESHOOTING.md](skills/agileflow/TROUBLESHOOTING.md) |
| E2E retest | [AGENT-RETEST.md](AGENT-RETEST.md) |

Product source lives in `skills/agileflow/`. npm: [`@agileflow/cli`](https://www.npmjs.com/package/@agileflow/cli).

---

## License

MIT · [Issues](https://github.com/aiKeeo/AgileFlow/issues) / PRs welcome.
