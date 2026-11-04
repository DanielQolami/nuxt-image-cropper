import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const graph = fileURLToPath(new URL("../graphify-out/graph.json", import.meta.url));
const [action, ...extra] = process.argv.slice(2);
const packageSpec = "graphifyy[mcp]==0.9.102";

const commands = {
  build: ["graphify", "extract", root, "--code-only"],
  query: ["graphify", "query", ...extra, "--graph", graph],
  mcp: ["graphify-mcp", graph],
};

if (!Object.hasOwn(commands, action) || (action === "query" && extra.length !== 1)
  || (action !== "query" && extra.length > 0)) {
  console.error("Usage: node scripts/graphify.mjs build | query \"question\" | mcp");
  process.exit(1);
}

if (action !== "build" && !existsSync(graph)) {
  console.error("Graph missing. Run `node scripts/graphify.mjs build` from the project root first.");
  process.exit(1);
}

const child = spawn("uvx", ["--from", packageSpec, ...commands[action]], {
  cwd: root,
  stdio: "inherit",
  shell: false,
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("error", (error) => {
  console.error(error.code === "ENOENT"
    ? "uvx is missing. Install uv and ensure uvx is on your agent client's PATH; see docs/agent-setup.md."
    : `Unable to start Graphify: ${error.message}`);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal === "SIGINT" ? 130 : signal === "SIGTERM" ? 143 : 1);
});
