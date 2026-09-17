# Migrações do banco

O `schema.sql` da raiz é o **baseline histórico** (o schema inteiro em um arquivo
só). A partir daqui, toda mudança de banco vira um arquivo novo:

```
migrations/0001_init.sql      ← cópia exata do schema.sql (não editar)
migrations/0002_pedidos.sql   ← exemplo de próxima mudança
migrations/0003_admin_rbac.sql
```

Regras:

1. **Nunca edite uma migration já aplicada** — crie a próxima.
2. Nome sempre `NNNN_descricao.sql`, com 4 dígitos e em ordem.
3. Toda migration deve ser **idempotente** (`create table if not exists`,
   `drop policy if exists` antes de `create policy`) — é o padrão que o
   `schema.sql` já segue.
4. O que toca em RLS/função sensível precisa de teste (ver Etapa 1 do plano).

## Aplicar

```bash
export SUPABASE_DB_URL="postgresql://postgres:[SENHA]@db.SEU-PROJETO.supabase.co:5432/postgres"
./db/migrate.sh          # aplica só o que ainda não foi aplicado
./db/verify-migrations.sh  # confere se o baseline continua íntegro
```

O controle do que já foi aplicado fica na tabela `public._migrations`.
