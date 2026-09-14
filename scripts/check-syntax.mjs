/* Verifica a sintaxe de todos os scripts do projeto.
   Roda `node --check` em cada arquivo — é o mesmo parser do Node,
   então pega qualquer erro de parse antes de chegar no navegador. */
import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SKIP = new Set(["node_modules", ".git", "coverage", "dist"]);

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if ([".js", ".mjs"].includes(extname(name))) acc.push(full);
  }
  return acc;
}

const files = walk(ROOT).sort();
let failed = 0;

for (const file of files) {
  const rel = file.slice(ROOT.length);
  const res = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (res.status === 0) {
    console.log(`  ok    ${rel}`);
  } else {
    failed++;
    console.log(`  ERRO  ${rel}\n${res.stderr}`);
  }
}

console.log(`\n${files.length - failed}/${files.length} arquivos com sintaxe válida`);
process.exit(failed ? 1 : 0);
