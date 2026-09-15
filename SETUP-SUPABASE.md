# Configurando o CoreMotion no Supabase (staging → produção)

> Guia passo a passo para **criar o projeto, aplicar as migrations e configurar o front**.
> As "novas modificações" são as migrations `0001` (baseline), `0002` (storage) e
> `0003` (privacidade) que estão em `migrations/`.
> Tempo estimado: ~20 min. Você precisa de uma conta em https://supabase.com.

---

## 0. Pré-requisitos

- Conta no Supabase.
- `psql` instalado (para aplicar as migrations via terminal).
  - macOS: `brew install libpq` · Ubuntu/Debian: `sudo apt install postgresql-client`
  - Alternativa sem `psql`: usar o **SQL Editor** do painel (veja o passo 5B).
- O repositório clonado e com dependências: `npm install`.

---

## 1. Criar o projeto de staging

1. Acesse https://supabase.com/dashboard → **New project**.
2. Preencha:
   - **Name**: `coremotion-dev`
   - **Database Password**: escolha uma senha forte e **guarde-a** (vai ser usada no passo 4).
   - **Region**: a mais próxima de você (ex.: `South America (São Paulo)`).
3. Clique em **Create new project** e aguarde (~2 min) o provisionamento.

> Repita depois para o projeto de produção (`coremotion-prod`), se quiser ambientes separados.

---

## 2. Anotar as 3 credenciais do projeto

No painel do projeto recém-criado:

| O que pegar | Onde fica no painel |
|---|---|
| **URL do projeto** | Project Settings (engrenagem) → **API** → *Project URL* → algo como `https://SEU-REF.supabase.co` |
| **anon public key** | Project Settings → **API** → *Project API keys* → **anon / public** |
| **Connection string do banco** | Project Settings → **Database** → **Connection string** → aba **URI** (copie e troque `[YOUR-PASSWORD]` pela senha do passo 1) |

> A **anon key é pública por desenho** (ela vai no navegador de todo visitante). Quem
> protege os dados é o RLS do banco. Não use a `service_role` no front.

---

## 3. Configurar o front (config.local.js)

O arquivo `config.local.js` **vence** o `config.js` e **não é commitado** (está no
`.gitignore`). Crie-o a partir do modelo:

```bash
cp config.local.example.js config.local.js
```

Edite `config.local.js` com a URL e a anon key do **staging**:

```js
window.COREMOTION_CONFIG_LOCAL = {
  url: "https://SEU-REF.supabase.co",
  anonKey: "COLE-AQUI-A-ANON-KEY",
};
```

> O servidor de desenvolvimento (`npm start`) cria um `config.local.js` de exemplo se
> ele não existir — mas **não sobrescreve** um que já exista. Então pode criar antes.

---

## 4. Aplicar as migrations no banco (método recomendado: terminal)

Exporte a connection string (URI) que você copiou no passo 2 e rode o script:

```bash
export SUPABASE_DB_URL="postgresql://postgres.SEU-REF:[SUA-SENHA]@aws-0-SUA-REGIAO.pooler.supabase.com:5432/postgres"
./db/migrate.sh
```

Saída esperada:

```
  →  aplicando 0001_init.sql
     ok
  →  aplicando 0002_storage_hardening.sql
     ok
  →  aplicando 0003_profiles_privacidade.sql
     ok
Migrations em dia.
```

O script é **idempotente**: ele registra o que já rodou em `public._migrations` e
pula na próxima vez. Pode rodar de novo sem medo.

> **Use o pooler de SESSÃO (porta 5432)**, não o de transação (6543), para aplicar DDL.
> Se preferir a conexão direta, use a URI da aba **URI** do painel sem alterar a porta.

### 4B. Alternativa sem terminal (SQL Editor)

1. Painel do projeto → **SQL Editor** → **New query**.
2. Cole o conteúdo de `migrations/0001_init.sql` → **Run**.
3. Repita para `0002_storage_hardening.sql` e `0003_profiles_privacidade.sql`, **nesta ordem**.

(Ordem importa: a 0002/0003 alteram políticas criadas pela 0001.)

---

## 5. Verificar se aplicou certo

```bash
./db/verify-migrations.sh
```

Isso confere que a `0001` é idêntica ao `schema.sql` e que os nomes são sequenciais.
Para confirmar no banco, rode no SQL Editor:

```sql
select name, applied_at from public._migrations order by name;
-- deve listar 0001, 0002 e 0003
```

---

## 6. Storage (buckets de arquivo)

O `0001_init.sql` **já cria** os 5 buckets (`avatars`, `products`, `news`, `media`,
`teams`) como públicos. Confirme em **Storage** no painel — eles devem aparecer na lista.
Se algum não aparecer, rode no SQL Editor:

```sql
insert into storage.buckets (id, name, public) values
  ('avatars','avatars', true), ('products','products', true),
  ('news','news', true), ('media','media', true), ('teams','teams', true)
on conflict (id) do nothing;
```

---

## 7. Autenticação

### 7.1 Login direto (recomendado para o beta)
Para criar conta e entrar sem precisar confirmar e-mail:
- **Authentication** → **Providers** → **Email** → desative **"Confirm email"**.

### 7.2 Google (opcional)
- **Authentication** → **Providers** → **Google** → ative e informe o *Client ID* e
  *Secret* do seu app OAuth (Google Cloud Console).
- Em **Authentication** → **URL Configuration**, adicione a URL do seu site em
  *Site URL* / *Redirect URLs*.

---

## 8. O primeiro admin (dono)

O acesso de administrador é controlado pelos campos **`is_admin`** / **`is_owner`** da
tabela `profiles` — **não** pelo campo `role` (que é só um rótulo de exibição:
Atleta/Técnico). A tabela `user_roles` só chega na Etapa 2.

A função `handle_new_user()` (em `0001_init.sql`) já tem um e-mail de dono configurado:

```
owner_email text := 'alfeu.paula@escola.pr.gov.br';
```

Quem se cadastrar com **esse** e-mail vira dono/admin automaticamente
(`is_owner = is_admin = true`). Para usar outro e-mail de dono, edite essa linha em
`migrations/0001_init.sql` (e em `schema.sql`) **antes** de aplicar as migrations.

Para promover qualquer conta manualmente (depois de ela existir):

```sql
-- 1) descubra o UUID do usuário
select id, email from auth.users;

-- 2) promova a admin (e, se for o dono, is_owner também)
update public.profiles set is_admin = true where id = 'UUID-DO-USUARIO';
update public.profiles set is_owner = true where id = 'UUID-DO-USUARIO';
```

> O perfil é criado automaticamente pelo trigger `on_auth_user_created` assim que a
> conta é criada no Auth — então o `update` acima só funciona **depois** do primeiro
> login/cadastro daquela conta.

---

## 9. Testar o app contra o staging

```bash
npm start
```

Abra a URL mostrada. Crie uma conta, faça login e confira:
- Perfil, feed, equipes, notícias e marketplace carregam.
- Upload de imagem funciona (avatar/produto/mídia).
- Um perfil com "perfil público" desligado **não** aparece para outros (efeito da `0003`).

Para validar o RLS de verdade, rode a suíte da Etapa 1 (quando estiver pronta) ou
teste manualmente com dois navegadores (um admin, um atleta).

---

## 10. Repetir para produção

1. Crie o projeto `coremotion-prod`.
2. Aponte um `config.local.js` (ou o `config.js` commitado) para a URL/anon key de produção.
3. `export SUPABASE_DB_URL="...prod..."` e rode `./db/migrate.sh`.
4. Reveja as políticas de Storage/RLS e promova o admin inicial.

---

## Solução de problemas

| Sintoma | Causa provável | Correção |
|---|---|---|
| `psql: command not found` | `psql` não instalado | Instale o cliente PostgreSQL ou use o SQL Editor (4B) |
| `permission denied` / erro em `create role` ou `alter publication` | Pooler de transação (6543) | Use a porta **5432** (sessão) ou a conexão direta |
| App mostra "Supabase não configurado" | `config.local.js` com URL/key vazias | Preencha URL e anon key no `config.local.js` |
| Login não funciona | "Confirm email" ativo | Desative em Authentication → Email (passo 7.1) |
| Imagens não carregam | Bucket privado | Marque o bucket como público (passo 6) |

---

## O que fica travado até o staging existir

- **B10** — suíte de testes de RLS por papel (`tests/rls.test.sql`).
- **Validação real** das migrations `0002` (storage) e `0003` (privacidade).

Assim que o staging estiver no ar, esses dois itens do `BACKLOG.md` podem ser fechados.
