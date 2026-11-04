# Agent setup

This repository supports Codex and Claude Code with 13 shared skills and three
project MCP servers. `AGENTS.md` is authoritative; `CLAUDE.md` imports it.
claude-mem, session-capture hooks, and Git hooks are not installed.

## Prerequisites and activation

- Use Node.js 22.20+ for skills CLI 1.7.6, plus Git and npm for skill maintenance.
  This is an agent-tool requirement, not a change to the module's CI Node version.
- Install [uv](https://docs.astral.sh/uv/getting-started/installation/) and ensure
  `node` and `uvx` are on the agent client's PATH. Graphify needs Python 3.10+.
- First-time downloads need GitHub, the npm registry, PyPI, and
  `files.pythonhosted.org`. The latter hosts Python wheels, not just metadata.
- Launch `codex` or `claude` from the repository root. Trust the repository to load
  Codex's project configuration; review Claude's project MCP prompt normally.
  Restart an existing agent session to discover newly installed skills and MCPs.

Check `codex mcp list` and Claude's `/mcp` after restarting. Codex configuration is
in `.codex/config.toml`; Claude configuration is in `.mcp.json`. Matching `nuxt`
and `nuxt-ui` names override user definitions without editing global settings.
Claude's Graphify entry supports `CLAUDE_PROJECT_DIR` with a root-directory fallback.

| MCP | Purpose |
| --- | --- |
| `nuxt` — `https://nuxt.com/mcp` | Official documentation; request Nuxt `4.x`. |
| `nuxt-ui` — `https://ui.nuxt.com/mcp` | Components used by the cropper UI. |
| `graphify` — local stdio | Query this checkout's code graph. |

The Addy browser skill can use a browser MCP already provided by your client.
This setup does not install an additional browser server.

## Graphify

The launcher uses `uvx --from 'graphifyy[mcp]==0.9.102'`. uv caches an isolated
environment; it does not upgrade the existing global Graphify installation.

```bash
# Create the graph, or refresh it after changing source.
node scripts/graphify.mjs build

# Query without starting an agent client.
node scripts/graphify.mjs query "How does the module register cropper components?"

# Usually started automatically by the MCP client; reserves stdout for MCP.
node scripts/graphify.mjs mcp
```

Build uses deterministic `graphify extract <root> --code-only`: no API key, paid
inference, document/image extraction, cloud graph, or automatic community labeling.
Existing extraction caches can be reused. The server reads an absolute graph path
resolved from the launcher's location and reloads graph changes.

`.graphifyignore` excludes credentials, `.npmrc`, agent skills/configuration,
dependencies, build output, locks, and the graph's own artifacts. `graphify-out/`
is untracked and regenerated per checkout. Never use `--no-gitignore` or remove
credential exclusions merely to increase graph coverage.

During initial setup, the Python wheel host could not resolve. An initial graph
was built and queried using the pinned upstream source and the existing Python
dependencies, without changing the global installation. YAML extraction was
unavailable in that fallback. The configured isolated MCP runtime still needs a
successful wheel download before its end-to-end connection can be verified.

If the graph is missing, the launcher exits with a build instruction rather than
silently indexing on startup. If a Python wheel download fails, restore access to
PyPI and `files.pythonhosted.org`, rerun `build`, then restart the MCP connection.
Do not substitute an unpinned global installation to start the configured server.
Graph edges are navigation aids: verify current source, and do not assume Vue
template relationships, canvas behavior, or YAML coverage from graph results.

## Skills and pinned sources

Canonical skills are committed under `.agents/skills/`, with relative symlinks in
`.claude/skills/`. A fresh checkout needs no installation command to load them.
Do not flatten or replace the symlinks with machine-specific absolute paths.

`skills-lock.json` locks the 12 skills installed by skills CLI 1.7.6. Graphify uses
an upstream packaged skill named `skill-agents.md`, rather than a discoverable
`SKILL.md`, so it is vendored separately and pinned in `.agents/sources.json`.
That manifest also records all upstream revisions and the Addy reference location.

| Source | Revision | Installed content |
| --- | --- | --- |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | `301b02b12bff98e4688e6984af6556802322bbde` | Selected 10 skills and shared root references. |
| [antfu/skills](https://github.com/antfu/skills) | `7de210b51c8d48cc405a4eac3e17cbb1396c653b` | `nuxt`; Nuxt 5 examples require checking against this module's Nuxt 4. |
| [onmax/nuxt-skills](https://github.com/onmax/nuxt-skills) | `2e74504f3151b18bf81e8a62cb7f1fa9edb532a4` | `nuxt-modules`. |
| [Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify) | `59b5ab1151e031fb42e39cfc9a50bf96f2d57ae0` | Generic agents skill and reference sidecars; runtime pinned to `0.9.102`. |

License notices are retained under `.agents/licenses/`; upstream skill frontmatter
and source attribution remain intact. Addy's shared `.agents/references/` must
remain alongside `skills/`: its `../../references/` paths depend on that layout.
Claude resolves these through the canonical symlink targets; the relative
`.claude/references` alias also supports tools that normalize paths lexically.

## Maintenance

For a deliberate update, inspect the upstream changes, resolve a full commit SHA,
then use a pinned URL and explicit clients/skills. Do not use blanket `--all`,
global installation, or an unreviewed `skills update` across this repository.

```bash
npm exec --yes --package skills@1.7.6 -- skills add \
  https://github.com/addyosmani/agent-skills/tree/301b02b12bff98e4688e6984af6556802322bbde \
  --skill source-driven-development api-and-interface-design test-driven-development \
  browser-testing-with-devtools debugging-and-error-recovery code-review-and-quality \
  security-and-hardening performance-optimization deprecation-and-migration documentation-and-adrs \
  --agent codex claude-code --yes

npm exec --yes --package skills@1.7.6 -- skills add \
  https://github.com/antfu/skills/tree/7de210b51c8d48cc405a4eac3e17cbb1396c653b \
  --skill nuxt --agent codex claude-code --yes

npm exec --yes --package skills@1.7.6 -- skills add \
  https://github.com/onmax/nuxt-skills/tree/2e74504f3151b18bf81e8a62cb7f1fa9edb532a4 \
  --skill nuxt-modules --agent codex claude-code --yes

npm exec --yes --package skills@1.7.6 -- skills list --agent codex claude-code
```

When changing Addy's revision, also copy that revision's repository-root
`references/` to `.agents/references/` and refresh its license notice. The skills
CLI does not copy those shared files.

To restore or update Graphify's skill, check out the manifest's exact upstream
revision in a temporary directory. Copy `graphify/skill-agents.md` to
`.agents/skills/graphify/SKILL.md` and the complete
`graphify/skills/agents/references/` directory beside it. Retain Graphify's
`LICENSE`, `LICENSE-MIT`, and `NOTICE`, update `.graphify_version` and provenance,
and keep the Claude link pointing to `../../.agents/skills/graphify`.
Do not run platform instruction/hook installers over the curated root guides.

After updates, verify both clients discover all 13 skills, resolve every local
support-file link, review lockfile/provenance changes, and rebuild the graph only
if needed. A skills CLI `untracked` label for Graphify means it is maintained by
the separate provenance manifest, not that it is absent from Git.

## Credentials

Never copy `.npmrc` or environment credentials into skills, docs, graphs, or logs.
The pre-existing registry token displayed during inspection needs replacement in
your npm account: revoke it and create a replacement through your account's token
settings. Prefer an environment-backed registry credential for future setup.
Account token rotation is separate from these repository files; `.npmrc` is left
unchanged to preserve your existing local changes.
