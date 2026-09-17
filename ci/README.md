# CI (GitHub Actions)

O workflow está pronto em **`ci/ci.yml`**, mas **não está ativo**: o token usado
por este ambiente não tem a permissão `workflows`, então o GitHub recusa o push
de qualquer arquivo em `.github/workflows/`.

## Ativar (2 opções)

**Opção A — pelo terminal (recomendada):**

```bash
mkdir -p .github/workflows
cp ci/ci.yml .github/workflows/ci.yml
git add .github/workflows/ci.yml
git commit -m "ci: ativa o workflow"
git push
```

**Opção B — pelo site do GitHub:**
*Actions → New workflow → set up a workflow yourself* e cole o conteúdo de
`ci/ci.yml`.

## O que o workflow roda

```
npm ci
npm run check          # sintaxe de todos os .js/.mjs
npm run lint           # ESLint (0 erros)
npm run format:check   # Prettier nos arquivos de ferramenta
npm test               # 43 verificações de UI (jsdom + Supabase simulado)
bash db/verify-migrations.sh
```

Enquanto o CI não estiver ativo, rode `npm run verify` localmente antes de cada
push — é exatamente a mesma sequência.
