/* Configuração do ESLint (flat config, ESLint 9).
   -------------------------------------------------
   O projeto é um conjunto de scripts clássicos que compartilham o
   escopo global do navegador (auth.js usa `sb`, que é declarado em
   supabase-client.js, etc.). Para o `no-undef` funcionar de verdade,
   coletamos automaticamente todas as declarações de topo dos .js da
   raiz e as registramos como globals — assim a lista nunca fica
   desatualizada quando alguém cria uma função nova. */
import { readFileSync, readdirSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import globals from "globals";

const ROOT = fileURLToPath(new URL(".", import.meta.url));

function projectGlobals() {
  const found = {};
  for (const name of readdirSync(ROOT)) {
    if (extname(name) !== ".js" || name === "config.local.js") continue;
    const src = readFileSync(join(ROOT, name), "utf8");
    for (const m of src.matchAll(/^(?:async\s+)?function\s+([A-Za-z0-9_$]+)/gm))
      found[m[1]] = "writable";
    for (const m of src.matchAll(/^(?:const|let|var)\s+([A-Za-z0-9_$]+)/gm))
      found[m[1]] = "writable";
  }
  return found;
}

const regrasCompartilhadas = {
  // erros que quase sempre são bug de verdade
  "no-dupe-keys": "error",
  "no-dupe-args": "error",
  "no-dupe-class-members": "error",
  "no-unreachable": "error",
  "no-const-assign": "error",
  "no-func-assign": "error",
  "no-self-assign": "error",
  "no-unsafe-negation": "error",
  "no-import-assign": "error",
  "valid-typeof": "error",
  "use-isnan": "error",
  "getter-return": "error",
  "no-compare-neg-zero": "error",
  "no-cond-assign": ["error", "except-parens"],
  "no-undef": "error",
  "no-empty": ["warn", { allowEmptyCatch: true }],
};

// Nos scripts do app, `no-unused-vars` só gera falso positivo: db.js declara
// funções que o script.js usa, e o ESLint analisa arquivo por arquivo. A
// checagem que realmente importa nesse contexto é o `no-undef` (acima), que
// pega nome digitado errado e variável inexistente.
const regrasApp = { ...regrasCompartilhadas, "no-unused-vars": "off" };
const regrasNode = {
  ...regrasCompartilhadas,
  "no-unused-vars": ["warn", { args: "none", caughtErrors: "none", varsIgnorePattern: "^_" }],
};

export default [
  { ignores: ["node_modules/**", "coverage/**", "dist/**", "config.local.js"] },
  {
    // scripts do app (escopo global do navegador)
    files: ["*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: { ...globals.browser, ...projectGlobals() },
    },
    rules: regrasApp,
  },
  {
    // ferramenta de desenvolvimento (Node)
    files: ["**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: regrasNode,
  },
];
