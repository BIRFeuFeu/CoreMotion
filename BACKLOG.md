# BACKLOG — CoreMotion

> Lista viva do que falta fazer, priorizada. Atualizada em 14/09/2026.
> O desenho completo está em `PLANO-IMPLEMENTACAO.md`; aqui fica só o **pendente**.
> Legenda: 🔴 P0 (bloqueia segurança/produção) · 🟠 P1 · 🟡 P2.

## 🔴 Bloqueio central: ambiente de staging (A7)

Sem um projeto Supabase de staging (`coremotion-dev`) não dá para validar nada que
toca o banco. **Tudo abaixo marcado "requer staging" fica travado até isso.**

- [ ] Criar projeto `coremotion-dev` no painel Supabase (ou CLI).
- [ ] Rodar `./db/migrate.sh` (0001 → 0002 → 0003) no staging.
- [ ] Preencher `config.local.js` com a URL/chave do staging e subir o front contra ele.

## 🔴 Etapa 1 — Segurança (restante)

- [ ] **B10 — suíte de testes de RLS por papel** (`tests/rls.test.sql`, pgTAP ou
      `supabase test db`): convidado / atleta / vendedor / admin / dono em cada tabela.
      *Requer staging.*
- [ ] **Validar `migrations/0002` (storage) e `0003` (privacidade) no staging** —
      foram escritas mas **não testadas** contra um banco real.
- [ ] **B8 — remover `'unsafe-inline'` do CSP**: exige eliminar os handlers inline
      (`onclick="..."`) do `index.html` e trocar por `addEventListener`. Só então o
      CSP fica estrito. *Verificar o CSP atual no navegador real (OAuth/Google).*
- [x] **B6 — completar**: `validateForm` cobre os 9 formulários de `submit` **e** o
      onboarding/editar perfil (`btn-concluir-cadastro`, campo `ob-nome`). Não há
      "trocar senha logado" como feature (só o fluxo de "esqueci a senha", já validado).
- [ ] **B7 — rate limit no servidor**: o limite client-side reduz ruído, mas o
      anti-força-bruta de verdade é o rate limit do Supabase Auth + um limite por IP
      nas Edge Functions (Etapa 4).

## 🟠 Bug funcional confirmado (pré-existente)

- [ ] **`#btn-finalizar-compra` não cria pedido** (`script.js:1910`): o checkout só
      limpa o carrinho e mostra "Compra finalizada com sucesso!", mas **não insere
      nada em `orders`** (a tabela existe no schema). Corrigir junto com o fluxo de
      pedido da Etapa 3.

> ⚠️ **Correção (14/09/2026):** uma versão anterior deste backlog afirmava que a
> "criação de produto quebra" (`#prod-quantidade` etc.) e que o "upload de mídia não
> está ligado" (`#midia-file`). **Verifiquei no código e eram falsos** — eu os
> inferi de nomes de função que não existem. Na verdade: `dbCreateProduct`
> (`db.js:63`) insere só os campos que a tabela `products` tem (ela nem possui
> quantidade/condição/frete), e a mídia usa `#midia-input` (que existe no
> `index.html`). Esses dois itens foram removidos.

## 🟠 Etapa 2 — Plataforma / marketplace (~30 h)

- [ ] Tabelas `user_roles`, `seller_profiles`, `platform_settings`, `audit_logs`,
      `invitations` (migration `0004`).
- [ ] Trigger `on_auth_user_created` → `user_roles` + `profiles` (fonte única de papel).
- [ ] RBAC no cliente: `requireRole('admin'|'seller')` + papel no `appState`.
- [ ] Painel `/admin` com estatísticas reais (hoje são fixas).
- [ ] Onboarding de vendedor com CPF (sem CNPJ/MEI) + termos.

## 🟠 Etapa 3 — Pedidos e pagamentos (~46 h)

- [ ] Tabelas `orders`, `order_items`, `payments`, `payouts`, `order_status_history`.
- [ ] Fluxo de checkout completo (carrinho → endereço → resumo → pagar).
- [ ] Status `pending_payment` e transição real de estoque.
- [ ] Página "Meus pedidos" / "Minhas vendas".

## 🔴 Etapa 4 — Mercado Pago (~36 h)

- [ ] Edge Function `mp-create-preference` (split 5% via `marketplace_fee`).
- [ ] Edge Function `mp-webhook` (validação HMAC `x-signature`, idempotência por
      `payment_id`, responder 200/201).
- [ ] OAuth do vendedor + `mp_access_token`/`mp_refresh_token` em `seller_profiles`.
- [ ] `platform_settings` com `marketplace_fee_bps = 500`.
- [ ] Sandbox → produção; reconciliação.

## 🟠 Etapa 5 — Conta, privacidade e admin total (~22 h)

- [ ] **L5 impersonação real** (P0): `admin_impersonate(target)` → sessão do usuário;
      banner "você está como X"; `admin_stop_impersonate`; auditado.
- [ ] Autoexclusão de conta com carência + exclusão de mídia.
- [ ] Painel de moderação (denúncias) e de usuários (papéis, bloqueio, reset).
- [ ] `audit_logs` ligado a toda ação sensível.

## 🟡 Etapas 6–9

- [ ] Etapa 6 — Realtime, busca e notificações (~20 h).
- [ ] Etapa 7 — UX mobile, acessibilidade e PWA (~20 h).
- [ ] Etapa 8 — Qualidade, observabilidade e carga (~26 h).
- [ ] Etapa 9 — Beta privado → lançamento (~16 h).

## 🟡 Dívida técnica / limpeza

- [ ] Remover código morto: `let toastTimer` (`toast.js:6`), `runLoader()` (`script.js:854`).
- [ ] Decidir o destino das 11 tabelas não usadas pelo front (usar ou remover).
- [ ] Decidir o destino das 7 funções SQL órfãs.
- [ ] `server.mjs` dev: adicionar `Cache-Control: no-store` e gzip (opcional).

## ✅ Já concluído (referência)

- Etapa 0 (A1 testes, A3 config, A4 migrations, A5 lint/format, A6 README) — **A2 CI**
  pronto em `ci/ci.yml` (ativação manual) e **A7 staging** pendente.
- Etapa 1 (parte executada): B1 XSS, B2 upload client, B4 URLs/CSS, B6 formulários,
  B7 rate limit client, B8 CSP (com ressalva) — ver `npm test` (58 checks).
