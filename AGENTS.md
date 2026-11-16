# Instructions for coding agents

Before changing this repository, read [`docs/research/README.md`](docs/research/README.md) and its linked project brief, technical baseline, security/privacy, dataset/evaluation, roadmap and source notes.

## Project goal

Build the AI Voice & Video Scam Checker as a defensive, educational triage tool. It must help users pause and verify suspicious media; it must not claim to prove identity, prove fraud, or make consequential decisions for a person.

## Required behavior

- Inspect the existing backend/frontend and preserve the current stack where practical. Do not scaffold a second app before inventorying the repository.
- Treat the research docs as the current product/security baseline. `PROJECT_BLUEPRINT.md` is an earlier draft and contains proposals that still require validation.
- Keep the mock/demo pipeline visibly labeled `demo`. Never present mock output, uncalibrated logits, or an arbitrary score as a real probability.
- Keep URL fetching, third-party media APIs, public deployment and real user media disabled until their separate threat, privacy, cost, licensing and egress controls are reviewed.
- Process uploads as untrusted data. Enforce size/duration/resource limits and isolate media parsers/workers; do not interpolate client values into shell commands.
- Minimize retention and logging. Never place real media, transcripts, credentials, restricted datasets or model weights in Git.
- Verify current upstream documentation, versions and license before adding a tool/model/dataset/API. Record source, version, license and limitations.
- Work only with authorized data and targets. Do not create voice-cloning or impersonation capabilities.
- State what actually changed and what was actually verified. Do not report checks or benchmark results that were not run.

## Handoff

Use [`docs/research/ROADMAP.md`](docs/research/ROADMAP.md) to sequence work and assign clear file ownership when using Empryo roles. Preserve the `mode`, uncertainty and provenance contract in [`docs/research/TECHNICAL_BASELINE.md`](docs/research/TECHNICAL_BASELINE.md).
