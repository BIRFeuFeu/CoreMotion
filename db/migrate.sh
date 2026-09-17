#!/usr/bin/env bash
# Aplica as migrations de migrations/ em ordem, controlando o que já rodou
# na tabela public._migrations. Precisa de psql no PATH.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "ERRO: defina SUPABASE_DB_URL" >&2
  echo "  Supabase Dashboard > Project Settings > Database > Connection string (URI)" >&2
  exit 1
fi
command -v psql >/dev/null || { echo "ERRO: psql não encontrado no PATH" >&2; exit 1; }

psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -c \
  "create table if not exists public._migrations (name text primary key, applied_at timestamptz default now());"

for f in migrations/*.sql; do
  name="$(basename "$f")"
  applied="$(psql "$SUPABASE_DB_URL" -Atc "select count(*) from public._migrations where name = '$name'")"
  if [ "$applied" != "0" ]; then
    echo "  ·  $name (já aplicada)"
    continue
  fi
  echo "  →  aplicando $name"
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -f "$f"
  psql "$SUPABASE_DB_URL" -q -c "insert into public._migrations (name) values ('$name');"
  echo "     ok"
done

echo "Migrations em dia."
