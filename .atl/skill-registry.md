# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| When creating a GitHub issue, reporting a bug, or requesting a feature | issue-creation | C:/Users/AgustinNotebook/.config/opencode/skills/issue-creation/SKILL.md |
| When creating a pull request, opening a PR, or preparing changes for review | branch-pr | C:/Users/AgustinNotebook/.config/opencode/skills/branch-pr/SKILL.md |
| When writing Go tests, using teatest, or adding test coverage | go-testing | C:/Users/AgustinNotebook/.config/opencode/skills/go-testing/SKILL.md |
| When user says "judgment day", "review adversarial", "dual review", etc. | judgment-day | C:/Users/AgustinNotebook/.config/opencode/skills/judgment-day/SKILL.md |
| When user asks to create a new skill, add agent instructions, or document patterns for AI | skill-creator | C:/Users/AgustinNotebook/.config/opencode/skills/skill-creator/SKILL.md |
| When user says "update skills", "skill registry", or after installing/removing skills | skill-registry | C:/Users/AgustinNotebook/.config/opencode/skills/skill-registry/SKILL.md |
| When user wants to initialize SDD in a project | sdd-init | C:/Users/AgustinNotebook/.config/opencode/skills/sdd-init/SKILL.md |
| When orchestrator launches you to explore a feature or investigate the codebase | sdd-explore | C:/Users/AgustinNotebook/.config/opencode/skills/sdd-explore/SKILL.md |
| When orchestrator launches you to create or update a proposal for a change | sdd-propose | C:/Users/AgustinNotebook/.config/opencode/skills/sdd-propose/SKILL.md |
| When orchestrator launches you to write or update specs for a change | sdd-spec | C:/Users/AgustinNotebook/.config/opencode/skills/sdd-spec/SKILL.md |
| When orchestrator launches you to write or update the technical design for a change | sdd-design | C:/Users/AgustinNotebook/.config/opencode/skills/sdd-design/SKILL.md |
| When orchestrator launches you to create or update the task breakdown for a change | sdd-tasks | C:/Users/AgustinNotebook/.config/opencode/skills/sdd-tasks/SKILL.md |
| When orchestrator launches you to implement tasks from a change | sdd-apply | C:/Users/AgustinNotebook/.config/opencode/skills/sdd-apply/SKILL.md |
| When orchestrator launches you to verify implementation matches specs | sdd-verify | C:/Users/AgustinNotebook/.config/opencode/skills/sdd-verify/SKILL.md |
| When orchestrator launches you to archive a completed change | sdd-archive | C:/Users/AgustinNotebook/.config/opencode/skills/sdd-archive/SKILL.md |
| When orchestrator launches you to onboard a user through the full SDD cycle | sdd-onboard | C:/Users/AgustinNotebook/.config/opencode/skills/sdd-onboard/SKILL.md |

## Compact Rules

### issue-creation
- Always use conventional commits: feat|fix|docs|style|refactor|test|chore(scope): description
- Check existing issues before creating new ones
- For bugs: include reproduction steps, expected vs actual behavior, environment details
- For features: describe the user problem and desired outcome, not just the technical solution
- Label appropriately: bug|feature|enhancement|documentation|question

### branch-pr
- Branch naming: type/ticket-id-description (e.g., feat/NUTR-123-add-user-validation)
- Keep PRs small and focused — one feature or fix per PR
- Include summary, motivation, and key changes in PR description
- Never force-push to main/master or shared branches
- Use conventional commit format for merge commit message

### go-testing
- Use teatest for TUI/Bubbletea testing
- Table-driven tests for multiple scenarios
- Use realistic test data builders, not hardcoded values
- Mock external dependencies at the boundary (HTTP, DB, file system)
- Test behavior, not implementation — avoid testing internal state directly

### judgment-day
- Launch two independent blind judges simultaneously
- Each judge gets identical context and performs blind review
- Synthesize findings after both complete before showing fixes
- Re-judge after fixes; escalate after 2 failed iterations
- Both judges must pass before the change proceeds

### skill-creator
- SKILL.md must have: name, description (with Trigger:), license, metadata (author, version)
- Use YAML frontmatter format
- Include rules section with specific, actionable constraints
- Compact rules block (5-15 lines) for delegator injection
- Test the skill by running it in a real scenario before finalizing

### sdd-init
- Detect stack from package.json, go.mod, pyproject.toml, etc.
- Detect testing infrastructure: runner, layers (unit/integration/e2e), coverage, lint, typecheck
- Resolve strict_tdd from: system prompt marker > openspec config > default (enable if runner exists)
- Mode: engram (no files), openspec (files only), hybrid (both), none (ephemeral)
- Always persist testing capabilities as separate observation
- Engram mode: upserts with topic_key sdd-init/{project-name}

### sdd-explore
- Investigate before committing to a change
- Clarify requirements through probing questions
- Identify affected modules and potential ripple effects
- Look for existing solutions in the codebase before proposing new code
- Use mem_search to check for prior work on the topic

### sdd-propose
- Include: intent (why), scope (what), approach (how)
- Identify affected modules/packages
- Include rollback plan for risky changes
- Get explicit approval before proceeding to design/spec

### sdd-spec
- Use Given/When/Then format for scenarios
- Use RFC 2119 keywords (MUST, SHALL, SHOULD, MAY)
- Cover happy path AND error/edge cases
- Each scenario should be independently executable
- Refer to shared types from @nutrifit/shared when applicable

### sdd-design
- Include sequence diagrams for complex flows
- Document architecture decisions with rationale
- Cover both frontend and backend changes
- Loading relevant coding skills for project stack (React 19, NestJS, etc.)
- Show how the change affects existing Clean Architecture boundaries

### sdd-tasks
- Group tasks by phase: infrastructure, implementation, testing
- Use hierarchical numbering (1.1, 1.2, etc.)
- Keep tasks small enough to complete in one session
- Identify which tasks need test infrastructure and which are pure implementation

### sdd-apply
- Follow existing code patterns and conventions
- Load relevant coding skills for the project stack
- Respect Clean Architecture boundaries (domain/application/infrastructure/presentation)
- Use Spanish naming for frontend code (variables, functions, hooks, components)
- Backend: absolute imports rooted at src/...; Frontend: use @/ alias
- Run lint and build checks before marking done

### sdd-verify
- Run tests if infrastructure exists
- Compare implementation against every spec scenario
- Verify error handling works as specified
- Check that changes don't break existing functionality (regression)
- Validate both frontend and backend if change is cross-cutting

### sdd-archive
- Sync delta specs to main specs (update the canonical spec)
- Generate a summary report of what was done
- Warn before merging destructive deltas (large removals)
- Archive completed change in openspec/changes/archive/ (openspec mode)

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| AGENTS.md (root) | C:/Users/AgustinNotebook/Desktop/nutrifit/AGENTS.md | Monorepo conventions, workspace structure, commands |
| AGENTS.md (frontend) | C:/Users/AgustinNotebook/Desktop/nutrifit/apps/frontend/AGENTS.md | Frontend-specific: Spanish naming, hook-first, React Query, testing patterns |

Read the convention files listed above for project-specific patterns and rules. All referenced paths have been extracted — no need to read index files to discover more.