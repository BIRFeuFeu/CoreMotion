#!/usr/bin/env bash
# Confere a integridade das migrations sem precisar de banco:
#   1. o baseline (0001_init.sql) continua idêntico ao schema.sql
#   2. os nomes seguem o padrão NNNN_*.sql, sem repetir número
set -euo pipefail
cd "$(dirname "$0")/.."

if diff -q migrations/0001_init.sql schema.sql >/dev/null; then
  echo "  ✔  migrations/0001_init.sql é idêntico ao schema.sql"
else
  echo "  ✘  migrations/0001_init.sql DIFERE do schema.sql" >&2
  echo "     O baseline não pode ser editado — crie uma migration nova." >&2
  exit 1
fi

nums=""
for f in migrations/*.sql; do
  n="$(basename "$f")"
  case "$n" in
    [0-9][0-9][0-9][0-9]_*.sql) ;;
    *) echo "  ✘  nome fora do padrão NNNN_descricao.sql: $n" >&2; exit 1 ;;
  esac
  num="${n%%_*}"
  case " $nums " in *" $num "*) echo "  ✘  número de migration duplicado: $num" >&2; exit 1 ;; esac
  nums="$nums $num"
done
echo "  ✔  $(ls migrations/*.sql | wc -l | tr -d ' ') migration(s) com nomes válidos"
