# AgileFlow

**English** | [中文](README.zh-CN.md)

<p align="center">
  <strong>Make AI hand over a delivery pack you can verify, trace, and take over—not just code that looks finished.</strong>
</p>

<p align="center">
  A staged delivery skill and CLI for AI coding agents.<br>
  Speak once in plain language; it handles routing, delegation, artifacts, gates, and resumable state.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@agileflow/cli"><img src="https://img.shields.io/npm/v/@agileflow/cli.svg?style=flat-square&color=cb3837" alt="npm"></a>
  <a href="skills/agileflow/templates/validate-atlas-gate.md"><img src="https://img.shields.io/badge/gates-9%20hard-brightgreen?style=flat-square" alt="9 hard gates"></a>
  <img src="https://img.shields.io/badge/routing-/af-7c3aed?style=flat-square" alt="semantic routing">
  <img src="https://img.shields.io/badge/flow-extensible-2563eb?style=flat-square" alt="extensible flow">
  <img src="https://img.shields.io/badge/agents-multi--role-0891b2?style=flat-square" alt="multi-agent">
  <img src="https://img.shields.io/badge/runtime-receipts-f97316?style=flat-square" alt="runtime receipts">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT"></a>
</p>

```bash
npx @agileflow/cli@latest init
/af build an order API with WeChat and Alipay refunds — you decide the rest
```

> **Important:** AgileFlow is not just a prompt pack.
>
> **AgileFlow = `/af` semantic routing + extensible `flow.yaml` + multi-agent roles + 9 hard gates + Run-scoped receipts + an `atlas/` evidence pack.**

**Jump to:** [Demo](#what-a-session-looks-like) · [Problems](#problems-it-solves) · [Quick start](#start-in-1-minute) · [Four moves](#four-hard-moves) · [Compare](#vs-openspec-and-superpowers) · [Deeper](#deeper-mechanisms-and-extension)

---

## What a session looks like

```text
You  /af build an order API with WeChat and Alipay refunds — you decide the rest
AI   → Routes to full delivery pipeline
     → AF_DECIDE=ai (fewer stops; docs and gates stay full)
     → Starts a Run, enters af-req
     → Subagent lands requirements/REQ-*.md (BDD AC)
     → req-confirm green → solution / contracts on disk
     → write-code green → only then business code
     → Per-task ## 结果 (commands that really ran + exit codes)
     → Acceptance report PASS / FAIL
You  Open atlas/ — evidence pack ready to hand off

Later /af
AI   → Reads flow.yaml · env · todo · active Run, resumes from checkpoint
```

> `/af` is a **chat doorplate** for the agent — **not** a shell command. Use `npx @agileflow/cli`, not bare `npx agileflow` (unrelated package on npm).

---

## Problems it solves

| Typical AI coding | AgileFlow |
|-------------------|-----------|
| Requirements only in chat | Lands `REQ-*.md` + BDD AC |
| Code first, missing design | No `write-code` green → no business code |
| Verbal “we tested it” | Checks real commands, exit codes, reports |
| Checked tasks, missing files | Cross-checks todo · T docs · proof · acceptance |
| Who did what is unclear | `agileflow-dispatch.json` ledger |
| Chat dies, work dies | Resume via `todo + env + Run` |
| Stale PASS after edits | Receipts bind content digests; invalidate on change |

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

If you did not say “you decide”, the agent asks first:

| Mode | Effect |
|------|--------|
| **You decide** | `AF_DECIDE=ai`: continue in-session after green gates |
| **I'll decide** | `AF_DECIDE=user`: pause at key stages for your OK |

Quality bar is identical. “You decide” cuts stops only — **not** docs, tests, or gates.

Project-only install:

```bash
cd YOUR_PROJECT
npx @agileflow/cli@latest init --root .   # → {project}/skills/ (single copy, shared by all hosts)
npx @agileflow/cli gate --bootstrap-scaffold --root .
```

Bare `/af` → read progress and resume.

---

## Four hard moves

### 1. `/af` semantic routing

No need to memorize stages.

| You say | Default route |
|---------|---------------|
| “Build a refund API” | Full: req → model? → sol → dev → test |
| “Fix login timeout” / “add this unit test” | Quick track |
| “Explore the bottleneck first” | Explore branch |
| Bare `/af` / “continue” | Resume |

Power users still jump with `/af-req` `/af-sol` `/af-dev` `/af-test`; doorplates cannot skip `flow.yaml` deps or gates.

### 2. Extensible `flow.yaml`

`atlas/flow.yaml` is the project execution graph: custom steps, depends, parallel waves, outputs.  
`prompt` may be a short name (`req`/`model`/`sol`/`dev`), `null` (orchestrator-direct), or a **path to an existing role file** (e.g. `atlas/role/role-security.md`).  
After flow changes: run `update --step-skills-only` to refresh `/af-*` doorplates, then **abandon the old Run + start a new one** — stale PASS cannot sneak through.

### 3. Hard gates + Run-scoped receipts

Nine gates; done = `exit 0`.  
PASS binds `runId`, step attempt, `flow` digest, and artifact digests. Edit artifacts, rewind, or change flow → old receipts die.  
`gate` only verifies — **it never fabricates evidence for the agent**.

### 4. `atlas/` evidence pack + multi-agent ledger

Orchestrator routes; Subagents write body; dispatch lands in `agileflow-dispatch.json`.  
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
| You leave with | Living `specs/` | Plan + code discipline | **`atlas/` + sign-off + Run receipts + ledger** |

Not mutually exclusive: OpenSpec for long-lived specs, Superpowers for execution craft, AgileFlow for the delivery boundary.

---

## Who it's for · who it's not

**For:** handoff to clients / QA / the next engineer / audit; work spanning requirements · APIs · impl · acceptance; a shared machine definition of “done”; long runs that must survive closed chats.

**Not for:** one-shot Q&A; one-line copy tweaks; teams unwilling to keep any in-repo delivery docs; expecting a substitute for test frameworks, CI, or product judgment.

AgileFlow is a **delivery protocol and validation layer** for agents — not a cloud task platform.

---

## Deeper: mechanisms and extension

### Why “fake done” is hard

Formal flow creates `atlas/runs/<runId>/`. Each stage closes the loop:

```text
Subagent output → artifact scan → log (doorplate) → gate → run gate-status → step sync
```

- Green gate = valid PASS for **this Run / attempt / flow / artifacts** — not “it was green once.”
- With an active Run, only Runtime JSONL receipts count; legacy Markdown PASS cannot backfill.
- Secrets, approvals, real devices go to `humanTodo.md` — never fake PASS.

<details>
<summary>Nine hard gates</summary>

| Gate | Blocks |
|------|--------|
| `init-confirm` | Brownfield without inventory |
| `req-confirm` | Incomplete REQ / scope / BDD AC |
| `mod-confirm` | Incomplete or silently skipped modeling |
| `sol-confirm` | Missing architecture, contracts, boundaries, or todo |
| `dev-step1-literal` | Empty development design |
| `write-code` | Business code before req/sol ready |
| `dev-complete` | Checked tasks without run proof |
| `test-entry` | Missing test entry / smoke |
| `req-trace` | Broken REQ → F → T → AC → report chain |

</details>

### How multi-agent splits work

Current session = orchestrator: read flow, dispatch, run gates, advance state.  
req / model / sol / dev bodies come from role Subagents; dispatch is written to `agileflow-dispatch.json`.  
Hosts without Subagents enter explicit degraded mode — **quality gates do not relax**.

### Extending it

| Layer | Where | What you get |
|-------|-------|--------------|
| Steps | `atlas/flow.yaml` | Security review, design review, … |
| Depends / parallel | `depends` · `outputs` | Waves and artifact waits |
| Roles / prompts | `prompt` + `atlas/role/*.md` | Short name, orchestrator-direct, or a prompt path |
| Doorplates | `update --step-skills-only` | Materialize new `af-*` steps as host `/af-*` skills |
| Validation | gate / validator | Team “done” as non-zero exit |

**Three `prompt` forms:**

| `prompt` | Who runs / what is loaded |
|----------|---------------------------|
| `req` / `model` / `sol` / `dev` | Subagent; default layers, or project override `atlas/role/role-{key}.md` |
| `null` | Orchestrator-direct; reads the matching `phases/*.md` for the step id |
| `atlas/role/role-xxx.md` | Subagent; **file must already exist** (team custom role) |

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

After editing flow, **refresh doorplates** so hosts get `/af-security-review`:

```bash
npx @agileflow/cli@latest update --step-skills-only --root .
# → creates/updates .cursor|claude|…/skills/af-security-review/SKILL.md
# → removes doorplates for custom steps deleted from flow
```

Then rotate the Run (flow changes cannot reuse old PASS):

```bash
npx @agileflow/cli run abandon --reason "added security review step" --root .
npx @agileflow/cli run start --change security-review --step af-req --root .
```

> **Flow change = `update --step-skills-only` (doorplates) + abandon old Run + start new Run.**  
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
