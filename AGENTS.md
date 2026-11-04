# Nuxt Image Cropper

## Project and sources of truth

This is the published `nuxt-image-cropper` Nuxt 4 module, not a standalone app.
It uses Nuxt Kit/module-builder, Vue 3, Nuxt UI 4, VueUse, Tailwind CSS 4, and
`vue-advanced-cropper`. Check `package.json` and `pnpm-lock.yaml` for versions.

- `src/module.ts`: module metadata, dependencies, auto-imports, and CSS registration.
- `src/runtime/app/`: consumer components, composables, types, utilities, and CSS.
- `playground/`: the consumer integration used for development and browser checks.
- `test/fixtures/basic/`: minimal module-installation and SSR fixture.
- `src/docs/USAGE.md` and `README.md`: consumer documentation; verify examples against source.

User instructions and this guide take precedence over vendored skill defaults.
Installed versions, local types/source, and repository configuration are authoritative.
Use the Nuxt MCP with version `4.x` and Nuxt UI MCP for version-matched documentation.
The installed Antfu `nuxt` skill describes Nuxt 5 prerelease behavior: do not apply
Nuxt 5/Nitro 3 APIs, directory migrations, or dependency upgrades as incidental cleanup.

## Public contracts and runtime

- Preserve the `imageCropper` config key, compatibility metadata, and module dependencies.
- Preserve `ImageCropper`, `ImageCropperDialog`, `ImageCropperDropzone`,
  `ImageCropperPreview`, `useImageCropperFile`, and auto-imported `ImageCropperResult`.
- Treat props, events, slots, exposed methods, and output types as consumer APIs.
  Update documentation and appropriate tests when intentionally changing them.
- Keep result fields: `file`, `blob`, `dataUrl`, `coordinates`, `image`, `width`,
  `height`, and `mimeType`. Outputs support JPEG, PNG, and WebP. Accepting HEIC/HEIF
  files does not establish that a browser can decode them.
- Keep browser-only components named `.client.vue`; avoid accessing `window`,
  `document`, canvas, or browser constructors during server evaluation.
- Keep CSS injection idempotent and resolve packaged runtime files with Nuxt Kit.
- Preserve file validation, typed errors, export failures, and object-URL cleanup.
  Reuse VueUse's URL lifecycle handling rather than introducing leaking URLs.
- Use composables for reusable state and `shallowRef` for opaque browser objects.
  Use relative runtime imports and the existing `cn` helper for class merging.
- Image processing is client-side. Uploading belongs to the consuming application.

## Code style

Follow `.editorconfig` and `eslint.config.mjs`, including when a skill differs:

- Two spaces, LF, double quotes, semicolons, and multiline trailing commas.
- Stroustrup braces: `else` and `catch` begin on the next line.
- Vue components use `<script setup lang="ts">` and typed component contracts.
- Use longform `v-slot`, not `#slot` shorthand.
- Keep changes focused; preserve existing user edits and avoid unrelated formatting.

## Skills and tools

Canonical project skills are in `.agents/skills/`; Claude Code uses relative links
under `.claude/skills/`. Read only skills and references relevant to the task:

- Module registration, Kit, runtime packaging: `nuxt-modules`, then `nuxt` as needed.
- Documentation/API research: `source-driven-development` and the Nuxt/Nuxt UI MCPs.
- Consumer contracts: `api-and-interface-design`, `deprecation-and-migration`.
- Behavior changes: `test-driven-development`, `debugging-and-error-recovery`.
- Browser interactions: `browser-testing-with-devtools` when a browser tool is available.
- Reviews: `code-review-and-quality`, `security-and-hardening`, `performance-optimization`.
- Consumer docs and design rationale: `documentation-and-adrs`.
- Architecture and dependency navigation: `graphify` and its MCP.

For Graphify, use `node scripts/graphify.mjs` commands from `docs/agent-setup.md`.
Use an existing graph to navigate; verify results in current source before edits.
Rebuild a missing/stale graph explicitly with `build`; do not rebuild on every read.
The project default is deterministic `--code-only` extraction without an LLM/API key.
Vue SFC script/import edges do not imply complete template or runtime coverage.
Respect `.graphifyignore`. Never index secrets, vendor skills, or generated output.
Use the pinned isolated tool; do not run a skill's global upgrade, system pip,
`--break-system-packages`, Git hook installer, or instruction-file installer.
This project does not install or enable claude-mem or automatic session capture.

## Verification

Use pnpm; do not create another package-manager lockfile.

| Change | Checks |
| --- | --- |
| Agent setup/docs only | Validate config syntax, skill links/references, and affected MCP tools. |
| Runtime or module code | `pnpm dev:prepare`, `pnpm lint`, `pnpm test`, `pnpm test:types`. |
| Registration, CSS, consumer integration | Also `pnpm dev:build`. |
| Module packaging or exports | Also `pnpm prepack`; inspect the generated package. |

The current Vitest test checks only that the SSR fixture renders `<div>basic</div>`.
Passing it does not verify cropping, canvas export, validation, or browser interactions.
For affected UI behavior, check select/drop, crop/confirm, dimensions/MIME, invalid
files, cancel/reopen, and URL cleanup in the playground; add meaningful regression
coverage where appropriate. Report checks actually run and pre-existing failures.
Do not create implementation-mirroring tests for simple documentation/config edits.

## Working boundaries

Preserve existing local changes, especially `.npmrc`. Never display or copy registry
tokens, environment credentials, or private files into docs, graphs, memory, or logs.
Keep `dist/`, `.nuxt/`, `.output/`, caches, and `graphify-out/` untracked.
Do not change global client configuration or install global dependencies for this setup.
Never use `pnpm release` for validation: it publishes to npm and pushes Git tags.
Do not publish, push, or change public APIs unless the current task authorizes it.
