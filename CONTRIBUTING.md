# Contributing Guide

## 1. Introduction

Thank you for your interest in contributing to this project. We welcome high-quality contributions from maintainers, first-time contributors, and domain experts alike.

This repository is maintained with a strong focus on reliability, reproducibility, and contributor ergonomics. The goal of this guide is to make your first contribution straightforward and to keep review cycles efficient for everyone involved.

## 2. I Have a Question

Please do **not** open GitHub Issues for general usage questions.

The issue tracker is reserved for:
- Reproducible bug reports.
- Actionable feature requests.

For questions, architecture discussions, troubleshooting help, or implementation advice, use one of the following channels:
- GitHub Discussions (preferred for project-specific Q&A).
- Stack Overflow (tag your question appropriately, for example with JavaScript/Chrome extension tags).
- Any officially documented community channel maintained by project maintainers.

When asking a question, include context such as your environment, what you already tried, and expected outcomes.

## 3. Reporting Bugs

High-quality bug reports reduce triage time and improve fix velocity.

### Search Duplicates First

Before opening a bug report:
1. Search existing open issues.
2. Search recently closed issues.
3. If a matching issue exists, add reproducible details there instead of opening a new one.

### Bug Report Requirements

A complete bug report must include all of the following:

1. Environment details
   - Operating system and version.
   - Browser version (for extension workflows).
   - Project/app version or commit SHA.
   - Relevant runtime/tool versions (Node.js, Python, package managers).

2. Reproduction algorithm
   - Provide deterministic, step-by-step reproduction instructions.
   - Include exact input payloads, configuration values, and sequence of actions.
   - Minimize noise; reduce to the smallest failing case.

3. Expected vs actual behavior
   - Clearly state what should happen.
   - Clearly state what actually happened.
   - Include error logs, screenshots, stack traces, or console output when applicable.

4. Scope and impact
   - Describe severity and business/user impact.
   - Mention whether this is a regression and identify the last known good version if possible.

### Bug Report Template (Recommended)

Use this minimal structure in your issue body:

```markdown
## Summary

## Environment
- OS:
- Browser:
- Project version/commit:
- Node/Python versions:

## Steps to Reproduce
1.
2.
3.

## Expected Behavior

## Actual Behavior

## Logs / Screenshots

## Additional Context
```

## 4. Suggesting Enhancements

Enhancement proposals should be solution-aware, evidence-based, and measurable.

### What to Include

1. Problem statement
   - Explain the specific pain point, limitation, or operational bottleneck.

2. Justification
   - Explain why this enhancement matters now.
   - Clarify technical and product impact.

3. Use cases
   - Provide concrete real-world examples.
   - Include input/output expectations and edge cases.

4. Proposed direction
   - Offer one or more implementation approaches.
   - Call out trade-offs (complexity, performance, compatibility, maintenance).

5. Acceptance criteria
   - Define objective criteria to confirm the enhancement is complete.

Enhancements without clear use cases or problem definition are likely to be closed as “needs more information.”

## 5. Local Development / Setup

### Fork and Clone

1. Fork the repository on GitHub.
2. Clone your fork locally:

```bash
git clone https://github.com/<your-username>/AdOps-Txt-Scanner.git
cd AdOps-Txt-Scanner
```

3. Add upstream remote:

```bash
git remote add upstream https://github.com/<upstream-org>/AdOps-Txt-Scanner.git
git remote -v
```

### Dependencies

This project has no mandatory package install step for runtime; it is a browser extension with plain JavaScript/HTML/CSS.

Recommended local tooling for contributors:

```bash
# Optional but recommended for local validation
node --version
python --version
```

### Environment Variables

There is currently no `.env.example` and no required environment variable contract.

If you introduce environment variables in future contributions:
1. Add a `.env.example` file.
2. Document each variable, allowed values, and defaults in `README.md`.
3. Never commit secrets.

### Running Locally

1. Open Chrome extensions page:

```text
chrome://extensions/
```

2. Enable Developer Mode.
3. Click “Load unpacked”.
4. Select the repository root folder.
5. Open the extension popup and validate your changes manually.

Recommended quick checks:

```bash
node --check popup.js
python -m json.tool manifest.json > /dev/null
```

## 6. Pull Request Process

### Branching Strategy

Use dedicated topic branches from the latest `main`:
- `feature/<short-kebab-description>`
- `bugfix/<issue-number-or-short-kebab-description>`
- `docs/<short-kebab-description>`
- `refactor/<short-kebab-description>`

Examples:
- `feature/dark-mode-persistence`
- `bugfix/123-timeout-handling`
- `docs/update-contributing-guide`

### Commit Messages

This project follows Conventional Commits:
- `feat: add batched retry strategy`
- `fix: prevent csv export on empty result set`
- `docs: expand README testing section`
- `refactor: simplify url probing order`
- `test: add parser edge case coverage`

Keep commits atomic and logically grouped.

### Upstream Synchronization

Before opening a PR:

```bash
git fetch upstream
git checkout main
git rebase upstream/main
git checkout <your-branch>
git rebase main
```

Resolve conflicts locally and rerun all checks.

### PR Description Requirements

Every PR must include:
1. Linked issue(s) (for example: `Closes #42`).
2. Problem context and design rationale.
3. Summary of changes by file/module.
4. Testing evidence (commands + results).
5. Backward compatibility notes.
6. Screenshots/GIFs for visible UI changes.

PRs missing this information may be returned for completion before review proceeds.

## 7. Styleguides

### General Quality Standards

- Keep changes minimal, focused, and reversible.
- Prefer explicit, readable code over implicit behavior.
- Avoid unrelated refactors in feature/bugfix PRs.
- Preserve existing project naming and layout conventions.

### Linters and Formatters

This repository currently does not enforce a centralized linter/formatter config.

Until formal tooling is added, follow these conventions:
- JavaScript: modern ES syntax with consistent semicolon usage and clear naming.
- HTML/CSS: semantic structure, predictable class naming, and minimal specificity spikes.
- Markdown: concise sections, accurate command snippets, and reproducible instructions.

If you add lint/format tooling (for example ESLint/Prettier), include config files and update both `README.md` and this guide.

### Architectural and Naming Conventions

- Keep scanner logic deterministic and side effects localized.
- Preserve normalized result object shape unless versioned migration is documented.
- Prefer descriptive function names (`checkDomainSmart`, `countValidLines`) aligned with existing style.
- Keep UI state transitions explicit (`Ready`, `Processing`, `Completed`).

## 8. Testing

All non-trivial changes must include relevant tests or equivalent validation proof.

### Required Validation for Every PR

Run at minimum:

```bash
node --check popup.js
python -m json.tool manifest.json > /dev/null
git status --short
```

### Additional Expectations

- Bug fixes must include a regression test scenario (automated when available, otherwise a reproducible manual checklist in PR body).
- Feature work must include edge-case validation.
- UI changes must include before/after screenshots or a short screen recording.

If you introduce a formal test framework, document exact unit/integration commands in both `README.md` and your PR.

## 9. Code Review Process

After opening a PR, the review process follows these stages:

1. Maintainer triage
   - A maintainer checks scope, completeness, and adherence to contribution requirements.

2. Technical review
   - At least one maintainer reviews architecture, correctness, readability, and risk.
   - Sensitive or cross-cutting changes may require additional reviewer(s).

3. Revision cycle
   - Address all reviewer comments directly in follow-up commits.
   - Mark conversations as resolved only after fixes are pushed.
   - Request re-review when updates are complete.

4. Approval and merge
   - Minimum required approvals: **1 maintainer approval**.
   - Additional approval may be required for high-risk changes.
   - Squash-merge is preferred unless maintainers request otherwise.

5. Post-merge
   - Confirm release notes/changelog updates if applicable.
   - Monitor for regressions and follow up quickly if issues are reported.

Thanks again for contributing. Thoughtful, well-tested contributions are what keep this project healthy and dependable.
