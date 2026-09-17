# CoreMotion — Plano de Implementação para virar um site real e funcional

> **Documento de trabalho do agente de IA.** Descreve **tudo** que precisa ser
> implementado para o CoreMotion deixar de ser um protótipo navegável e virar um
> produto real (seguro, pago de verdade, moderado, mensurável e publicável), e
> organiza esse trabalho em **etapas sequenciais** com critérios de aceite.
>
> | | |
> |---|---|
> | **Versão** | 1.4 — 14/09/2026 (**Etapa 1: B1–B8 no front; falta B10/staging**) |
> | **Autor** | Agente IA (Arena.ai Agent Mode) |
> | **Branch** | `arena/01a09fcc-coremotion` |
> | **Base analisada** | commit `90eff51` (13 arquivos na raiz) |
> | **Estado atual** | Preview no ar em `node server.mjs` (porta 4173); 40 verificações de UI passando com backend simulado |
> | **Regra de ouro** | Nenhuma etapa fecha sem os testes dela passando. Nada de "está pronto" sem evidência. |

---

## 1. Resumo executivo

O CoreMotion **já é um app navegável e bem construído**: landing page, cadastro/login
(e-mail, Google, convidado), onboarding, dashboard com 9 telas, marketplace, mídia,
agenda, notícias, equipes, painel do dono — tudo em HTML/CSS/JS puro contra um
Supabase real, com RLS e triggers bem pensados no `schema.sql`.

**O problema central não é falta de front-end: é que metade do backend já escrito
nunca foi ligado à interface.** O `schema.sql` cria **22 tabelas, 85 policies,
30 funções, 8 triggers e 5 buckets**; o front-end usa **11 tabelas e 8 funções**.
Ou seja, existem **11 tabelas inteiras** — pedidos, itens de pedido, avaliações,
fotos extras, notificações, follows, denúncias, presença em evento, estatísticas
de vendedor e de equipe, auditoria — prontas no banco e invisíveis no produto,
além de **7 funções chamáveis pela interface que ninguém chama**
(`create_order`, `get_analytics`, `check_in_event`, `get_follow_counts`,
`suspend_user`, `unsuspend_user`, `log_admin_action`).

O segundo problema é que **a venda não existe**: o botão "Finalizar Compra"
(`script.js:1881`) só apaga o carrinho e mostra "Compra finalizada com sucesso! 🎉",
enquanto a função `create_order()` (`schema.sql:616`) — que calcula total, grava
`orders`/`order_items` e trava o preço — nunca é chamada. Não há registro de venda,
nem pagamento, nem pedido para o vendedor.

Para virar um site real faltam, nesta ordem de importância:

1. **Segurança**: XSS armazenado em comentários/legendas, upload sem validação, perfis 100% públicos apesar do toggle de privacidade.
2. **Transação**: checkout real — pedido no banco, **pagamento via Mercado Pago com 5% de split**, status e entrega (decidido em 14/09/2026).
3. **Controle**: **console de admin com domínio total de todas as contas** que logarem no site — ficha completa, edição, suspensão, impersonação, financeiro e auditoria (decidido em 14/09/2026 → área **L**).
4. **Operação**: notificações, moderação, suspensão, auditoria, analytics.
5. **Confiança**: testes automatizados, CI, backups, monitoramento, LGPD, domínio próprio.

**Decisões do dono (14/09/2026), já incorporadas a este plano:**
1. **O marketplace cobra dinheiro de verdade** → Etapa 4 integral (não é vitrine).
2. **Gateway: Mercado Pago** → Checkout Pro na v1, webhook assinado, sandbox.
3. **Taxa de intermediação: 5%** → split via `marketplace_fee` (o `get_analytics()`
   do schema já calculava 5%, agora a decisão bate com o código).
4. **Admin com controle total de todas as contas que logarem no site** → nova área
   **L** (12 tarefas) e Etapa 7 expandida: console de contas, ficha completa,
   suspender/banir/mesclar/impersonar, RBAC no banco, auditoria com diff e 2FA.

**Estimativa total: 10 etapas (0 a 9), ~196 horas de trabalho de agente** (ver §5).
Dá para ter uma **v1 pública utilizável ao fim da Etapa 4** (~98 h) e um **produto
completo ao fim da Etapa 9**.

### Maturidade atual por módulo

| Módulo | Back-end (schema) | Front-end | Realmente funcional? | Gap principal |
|---|---|---|---|---|
| Autenticação (e-mail/Google/convidado) | 100% | 90% | 🟡 | Confirmação de e-mail desligada, sem exclusão de conta pelo usuário |
| Perfil do atleta | 100% | 85% | 🟡 | `public_profile` não é respeitado pelo banco |
| Marketplace (anúncio/visualização) | 90% | 80% | 🟡 | 1 foto por produto, sem estoque, avaliação é `★★★` fixo |
| **Pedidos / checkout** | **100%** | **0%** | 🔴 | `create_order()` nunca é chamado |
| **Pagamento** | 0% | 0% | 🔴 | **Decidido**: Mercado Pago com split de 5% (Etapa 4) — falta tudo, inclusive o servidor (Edge Functions) |
| Comentários | 100% | 70% | 🟡 | Sem edição/exclusão, sem limite de tamanho no cliente, XSS |
| Mídia (feed) | 100% | 75% | 🟡 | N+1 de consultas, sem paginação, sem moderação |
| **Notificações** | **100%** (tabela + triggers) | **0%** | 🔴 | Nenhum sino/central no app |
| **Follows (seguir atletas)** | **100%** | **0%** | 🔴 | Feature inteira por fazer |
| **Avaliações de produto** | **100%** | **0%** | 🔴 | Estrelas decorativas |
| Agenda / eventos | 85% | 80% | 🟡 | Sem capacidade, lista de espera, lembrete |
| **Check-in de presença** | **100%** | **0%** | 🔴 | `check_in_event()` órfã |
| Notícias | 100% | 75% | 🟡 | Sem paginação, sem edição |
| Equipes | 100% | 80% | 🟡 | `team_stats` órfã |
| Admin atual (aprovar/promover/excluir) | 100% | 90% | 🟢 | Funciona, mas são só 4 ações |
| **Console de Admin (controle total de contas)** | 0% | 0% | 🔴 | Não existe — área **L**, Etapa 7 |
| **Moderação (denúncias)** | **100%** | **0%** | 🔴 | `reports` órfã |
| **Suspensão de usuários** | **100%** | **0%** | 🔴 | `suspend_user()` órfã |
| **Auditoria** | **100%** | **0%** | 🔴 | `audit_log` órfã |
| **Analytics** | **100%** | **0%** | 🔴 | `get_analytics()` órfã |
| PWA / SEO / acessibilidade | — | 20% | 🔴 | Manifest sem link e sem ícones, sem meta description, sem service worker |
| Testes / CI | — | 100% | 🟢 | **Pronto** (Etapa 0): `npm test` com 43 verificações + CI |
| LGPD / termos / privacidade | — | 0% | 🔴 | Nenhuma página legal |

---

## 2. Como ler e executar este documento

- Cada tarefa tem um **ID estável** (`A1`, `B3`, `D2`…). Cite o ID no commit e no PR: `feat(D2): checkout real via create_order`.
- **Prioridade**: `P0` = bloqueia o lançamento · `P1` = lançamento fica capenga sem isso · `P2` = melhoria.
- **Esforço**: `S` ≤ 2h · `M` = 3–8h · `L` = 1–3 dias de agente.
- Toda tarefa tem **critérios de aceite** — é a definição de "pronto". Se o critério não puder ser demonstrado por um comando, um teste ou um print, ele precisa ser reescrito antes de começar.
- **Ordem de execução**: siga as etapas do §5. Não pule etapas de segurança (Etapa 1) para adiantar features — retrabalho garantido.
- Ao fim de cada etapa: rodar a suíte de testes (§6), atualizar a tabela de maturidade (§1) e abrir PR.

---

## 3. Diagnóstico verificado

### 3.1 Inventário

| Arquivo | Linhas | Papel |
|---|---|---|
| `index.html` | 1090 | Landing + auth + onboarding + **9 telas** (`view-*`) + **11 modais** (`modal-*`), 187 ids |
| `script.js` | 1931 | Toda a interação da UI |
| `style.css` | 659 | Visual completo, tema escuro, responsivo |
| `db.js` | 374 | 43 funções de acesso a dados e storage |
| `auth.js` | 73 | 11 funções (auth + helpers) |
| `supabase-client.js` | 71 | Chaves + `configureSupabase()` |
| `schema.sql` | 1049 | 22 tabelas, 85 policies, 30 funções, 8 triggers, 5 buckets |
| `toast.js` | 53 | Notificações toast (com `escapeHtml`) |
| `validation.js` | 184 | **Validações prontas e não carregadas** (código morto) |
| `manifest.json` | 43 | **PWA não linkado** no HTML, ícones inexistentes |
| `server.mjs` | 123 | Servidor local de desenvolvimento (adicionado nesta sessão) |

### 3.2 O que já funciona (com evidência)

Verificado nesta sessão com um harness jsdom que executa `index.html` + todos os
`.js` contra um Supabase simulado — **40 verificações, 0 falhas**:

- boot sem erros, `SUPABASE_CONFIGURED=true`, landing visível, 14 ícones SVG renderizados;
- login como convidado → dashboard, `profile-name` = "Convidado", ações bloqueadas com toast;
- as 7 telas de conteúdo renderizam sem travar no loader;
- login por e-mail como dono → badge de desenvolvedor + Painel do Dono (10 estatísticas, lista de usuários, pedidos pendentes);
- escrita real: inscrição em evento, item no carrinho (+ incremento de quantidade e badge), comentário em produto;
- busca do marketplace com debounce (1 resultado para "kimono", estado vazio para "zzzz").

### 3.3 Lacunas de back-end ↔ front-end (o achado principal)

**Tabelas criadas no `schema.sql` que o front-end nunca consulta** (11 de 22):

| Tabela | Para que serve no schema | O que falta no app |
|---|---|---|
| `orders`, `order_items` | Pedido com total, status (`pending/paid/shipped/delivered/cancelled`), entrega | Tela de checkout, "Meus pedidos", painel do vendedor |
| `product_ratings` | Nota 1–5 por produto + trigger de notificação | Estrelas interativas (hoje `★★★` é texto fixo em `script.js:1695`) |
| `product_images` | Múltiplas fotos por produto | Galeria no cadastro e no detalhe |
| `notifications` | Feed de notificações (`follow/like/comment/rating/event/order/system`) já alimentado por triggers | Sino na sidebar, central de notificações, marcar como lida, tempo real |
| `follows` | Seguir atletas (+ `get_follow_counts()`) | Botão seguir, contadores, feed de quem sigo |
| `reports` | Denúncia de conteúdo (`media/news/product/comment/rating/team/profile`) | Botão denunciar + fila de moderação do admin |
| `event_attendance` | Presença em treino (`check_in_event()`) | Check-in pelo admin/atleta, % de presença |
| `seller_stats`, `team_stats` | Estatísticas agregadas por gatilho | Cards de desempenho no perfil/equipe |
| `audit_log` | Trilha de auditoria das ações de admin (`log_admin_action()`) | Aba "Auditoria" no Painel do Dono |

**Funções do banco prontas para a interface e nunca chamadas pelo front (7):**
`create_order` (`schema.sql:616`), `get_analytics` (`:948`), `check_in_event`,
`get_follow_counts`, `suspend_user`, `unsuspend_user`, `log_admin_action`.

**Funções usadas só internamente pelo banco (não precisam de UI):** `is_admin`,
`is_guest`, `is_owner`, `is_suspended`, `handle_new_user`, `protect_admin_flag`,
`create_notification`, `refresh_seller_stats`, `refresh_team_stats` e as 7
funções `trg_*`. Detalhe importante: `is_suspended` **já bloqueia** inserts nas
policies (`schema.sql:991-1003`) — o bloqueio existe no banco, o que falta é o
admin conseguir suspender alguém pela interface (H2).

### 3.4 Problemas de segurança confirmados em código

| # | Problema | Evidência | Impacto |
|---|---|---|---|
| S1 | **XSS armazenado**: conteúdo do usuário entra via `innerHTML` sem `escapeHtml` | `script.js:1793` (`c.content` do comentário), `script.js:1587` (`m.caption`), `script.js:913-917` (`ev.title/description/location`), `script.js:1205-1207` (`t.name/tagline`) | Qualquer atleta executa JavaScript na tela de todos os outros (roubo de sessão) |
| S2 | **URLs injetadas em CSS**: `url('${t.logo_url}')`, `url('${p.image_url}')` | `script.js:1200`, `script.js:1854` | Injeção de estilo/quebra de layout |
| S3 | **Upload sem validação**: sem checagem de tipo, tamanho ou nome | `db.js:10-21` (`ext = file.name.split(".").pop()`) | Arquivo de 2 GB, extensão estranha no path, abuso de storage |
| S4 | **Storage sem limite no banco**: policies só checam bucket/papel | `schema.sql:1019-1027` | Idem, agora do lado servidor |
| S5 | **Perfis 100% públicos**: `profiles_select_public ... using (true)` | `schema.sql:411` | O toggle "perfil público" (`script.js:1930`) não faz nada; e-mail/dados de todos são legíveis por anônimos |
| S6 | **Validação cliente ≠ banco**: o app só checa "não vazio" (`requiredField`, `script.js:303`), o banco exige título de produto 5–80, comentário 2–280, notícia 5–120, evento 3–80 | `schema.sql:92,106,117,153` | Erro cru do Postgres na cara do usuário |
| S7 | **`validation.js` morto**: tem exatamente os limites certos (`LIMITS`) e não é carregado | `index.html:1083-1088` (não lista o arquivo) | Regras duplicadas e inconsistentes |
| S8 | Chave `anon` e e-mail do dono em texto claro no repositório | `supabase-client.js:4-5`, `schema.sql` | Esperado no Supabase, mas exige RLS impecável + rotação se vazar |

### 3.5 Problemas de performance/qualidade confirmados

| # | Problema | Evidência |
|---|---|---|
| P1 | **N+1 no feed de mídia**: uma consulta de curtidas por item, em sequência | `script.js:1572-1573` |
| P2 | **Sem paginação**: `dbGetMedia`, `dbGetNews`, `dbGetProducts`, `dbGetTeams`, `dbGetEvents` buscam tudo | `db.js:43,101,118,154,348` (só a busca tem `.limit(100)`) |
| P3 | Sem otimização de imagem (upload do original, sem thumbnail, sem `srcset`) | `db.js:10-21` |
| P4 | Sem code splitting: 80 KB de JS + 48 KB de HTML carregados na landing | `index.html:1083-1088` |
| P5 | Sem cache de sessão offline / service worker | nenhum registro de SW no HTML |

### 3.6 O que falta de produto (não é bug, é ausência)

- **Checkout e pagamento** (§D) — o mais crítico.
- **Notificações** (§E2), **seguir pessoas** (§E3), **denunciar** (§H2), **avaliar produto** (§D4).
- **Minhas vendas / painel do vendedor**, **meus pedidos**, **status de entrega**.
- **LGPD**: política de privacidade, termos, exclusão de conta self-service, exportação de dados.
- **SEO**: `<meta name="description">`, Open Graph, favicon, sitemap, `robots.txt`, URLs compartilháveis (hoje tudo é `#`/estado interno).
- **PWA**: manifest linkado + ícones + service worker + ícones instaláveis.
- **Acessibilidade**: contraste, `alt` em imagens geradas, navegação por teclado nas grades, `aria-live` nos toasts, rótulos nos campos de formulário.
- **Observabilidade**: nenhum log/erro chega a lugar nenhum além do console.

---

## 4. Backlog completo

### A. Fundação de engenharia

| ID | Tarefa | Evidência / contexto | P | E | Critérios de aceite |
|---|---|---|---|---|---|
| A1 ✅ | **Versionar o harness de testes** como `tests/app.test.mjs` + `package.json` (devDep `jsdom`) + `npm test` | hoje o harness existe só na sessão do agente | P0 | S | `npm test` roda 40+ asserções e falha com exit ≠ 0 quando algo quebra |
| A2 ✅ | **CI (GitHub Actions)**: `node --check` em todos os `.js` + `npm test` + validação de HTML | nenhum workflow no repo | P0 | S | Push abre check verde/vermelho no PR |
| A3 ✅ | **Configuração fora do código**: `config.js` (versionado) + `config.local.js` (gitignore) + `localStorage`, com `window.SUPABASE_CONFIG_SOURCE` dizendo qual venceu | `supabase-client.js` não tem mais chave hardcoded | P1 | M | **Ajustado na execução:** a `anon` é pública por desenho (vai ao navegador), então ela continua versionada — o ganho real é a separação de ambientes. Segredos de verdade (`service_role`, `access_token` do MP) seguem proibidos no repo |
| A4 ✅ | **Migrações versionadas**: quebrar o `schema.sql` monolítico em `migrations/0001_init.sql`, `0002_...`, com script `db/migrate.sh` | 1049 linhas em um arquivo só | P1 | M | Aplicar migrations em projeto Supabase vazio reproduz o schema; cada etapa seguinte vira uma migration nova |
| A5 ✅ | **Lint/format**: ESLint + Prettier com regras para o estilo do projeto | nada | P2 | S | `npm run lint` sem erros; CI bloqueia |
| A6 ✅ | **README de operação**: como provisionar, aplicar migrations, rodar local, publicar | README atual é tutorial de setup manual | P1 | S | Um estranho consegue subir o projeto seguindo só o README |
| A7 ⏳ | **Ambiente de staging**: segundo projeto Supabase (`coremotion-dev`) para não testar em produção | hoje só existe um projeto | P1 | S | `config.dev.js` aponta para o projeto de testes |

### B. Segurança e privacidade

| ID | Tarefa | Evidência | P | E | Critérios de aceite |
|---|---|---|---|---|---|
| B1 | **Eliminar XSS**: criar `esc()`/`attr()` e aplicar em **toda** interpolação de dado do banco; trocar `innerHTML` por construção de DOM onde fizer sentido | S1, S2 | **P0** | M | Teste automatizado: comentário com `<img src=x onerror=...>` aparece como texto; 0 interpolação de campo do banco sem escape (verificado por grep no CI) |
| B2 | **Validação de upload no cliente**: tipo, tamanho (5 MB imagem / 50 MB vídeo), nome sanitizado, preview com `URL.createObjectURL` | S3, `db.js:10-21` | **P0** | S | Tentativa de upload `.exe` ou > limite é barrada com toast claro |
| B3 | **Limite de upload no banco**: policy/trigger conferindo `metadata` (tamanho e mimetype) e path no formato `{uid}/{uuid}.{ext}` | S4, `schema.sql:1019-1027` | P0 | M | Upload fora da regra é recusado pelo PostgREST/Storage |
| B4 | **Sanitizar URLs vindas do banco** antes de ir para `url(...)`/`src` | S2 | P0 | S | URL com `')` ou `javascript:` não quebra o CSS nem vira link executável |
| B5 | **Privacidade real de perfil**: RLS respeitando `public_profile` (dono e admin sempre veem; estranhos veem só campos públicos) + esconder e-mail de terceiros | S5, `schema.sql:411` | **P0** | M | Teste RLS: usuário B não logado não lê e-mail de A; com `public_profile=false`, B não vê o perfil |
| B6 | **Ligar o `validation.js`** e usar `validateAll()`/`LIMITS` em todos os formulários, espelhando os `check` do banco | S6, S7 | P0 | M | Nenhum formulário aceita valor que o banco recusaria; mensagens em pt-BR amigáveis |
| B7 | **Rate limiting de escrita** no cliente + políticas de insert limitadas por usuário/dia (comentários, mídia) | abuso | P1 | M | 50 comentários em 1 min são bloqueados |
| B8 | **CSP** (`Content-Security-Policy`) servida pelo host/`_headers`, sem `unsafe-inline` para script | `server.mjs` | P1 | M | Cabeçalho presente; console sem violações |
| B9 | **Rotação/rotina de segredos**: documentar como girar a anon key e o que fazer se vazar | S8 | P2 | S | Runbook no README |
| B10 | **Revisão de RLS ponta a ponta**: tabela por tabela, com testes (ver F-TEST) | 85 policies sem teste | P0 | L | Suite de testes RLS cobrindo select/insert/update/delete de cada tabela para os 4 papéis (anônimo, convidado, atleta, admin, dono) |

### C. Contas e perfis

| ID | Tarefa | P | E | Critérios de aceite |
|---|---|---|---|---|
| C1 | **Confirmação de e-mail ligada** (com opção de manter o fluxo do beta via flag) + telas de "confirme seu e-mail" e reenvio | P1 | M | Cadastro novo exige confirmação; link funciona; resend respeita rate limit |
| C2 | **Exclusão de conta self-service** (RPC `delete_own_account` com carência de 7 dias) | **P0** | M | Usuário exclui a conta; dados somem; exigência LGPD atendida |
| C3 | **Edição de e-mail e senha** com reautenticação | P1 | S | Fluxo completo funcionando e testado |
| C4 | **Recuperação de senha revisada** (hoje existe, mas sem limite de tentativas nem e-mail customizado) | P1 | S | Link expira; mensagem clara |
| C5 | **Perfil completo**: esportes múltiplos, bio com limite, cargo, links sociais, avatar com crop | P2 | M | Salva e reexibe tudo; `sports[]` usado no analytics |
| C6 | **Página pública de atleta** com URL própria (`/atleta/:id`) respeitando `public_profile` | P2 | M | Link compartilhável abre o perfil (depende de I4/rotas) |
| C7 | **Convidado → conta real**: converter sessão anônima em conta com e-mail (`linkIdentity`) sem perder dados | P1 | M | Convidado que cria conta mantém curtidas/inscrições |

### D. Marketplace de verdade

| ID | Tarefa | Evidência | P | E | Critérios de aceite |
|---|---|---|---|---|---|
| D1 | **Checkout real**: endereço de entrega + `create_order(p_items, p_shipping, p_notes)` + limpar carrinho só se o pedido for criado | `script.js:1881` só chama `dbClearCart` | **P0** | M | Pedido aparece em `orders` com total correto e itens em `order_items`; falha no banco não apaga o carrinho |
| D2 | **"Meus pedidos"** (comprador) com status e histórico | `orders` órfã | **P0** | M | Lista, detalhe e status (`pending → paid → shipped → delivered`) |
| D3 | **Painel do vendedor**: vendas, itens, marcar como enviado, dados de entrega | `order_items.seller_id` existe | **P0** | M | Vendedor vê e atualiza o status; comprador é notificado (E2) |
| D4 | **Avaliações de produto** (1–5 + comentário) usando `product_ratings` e a média real no card | `script.js:1695` `★★★` fixo | P1 | M | Nota média calculada no banco; usuário não avalia a própria venda duas vezes |
| D5 | **Múltiplas fotos por produto** (`product_images`) + galeria + reordenação | tabela órfã | P1 | M | Até 6 fotos; primeira vira capa |
| D6 | **Estoque e disponibilidade**: campo `stock`, bloquear compra de item esgotado, marcar como vendido | não existe | P1 | M | Item esgotado não entra no carrinho |
| D7 | **Edição e pausa de anúncio** pelo vendedor | só existe criar/apagar | P1 | S | Editar preço/título reflete na busca |
| D8 | **Frete**: CEP + cálculo (Correios/Melhor Envio) gravado em `orders.shipping` | coluna `shipping jsonb` existe | P2 | M | Frete calculado entra no total |
| D9 | **Busca e filtros** do marketplace (categoria, faixa de preço, ordenação) com paginação | hoje só busca por texto (`db.js:54`) | P2 | M | Filtros combinados funcionam no banco, não no cliente |

### E. Comunidade

| ID | Tarefa | Evidência | P | E | Critérios de aceite |
|---|---|---|---|---|---|
| E1 | **Corrigir N+1 e paginar o feed de mídia** (1 consulta com agregação de curtidas + paginação infinita) | `script.js:1572`, `db.js:118` | **P0** | M | 1 request para 20 itens; scroll carrega a próxima página |
| E2 | **Central de notificações**: sino na sidebar com contador, lista, marcar como lida, tempo real (`supabase.channel`) | `notifications` + triggers já prontos | **P0** | M | Curtir/comentar/seguir gera notificação em tempo real; contador zera ao ler |
| E3 | **Seguir atletas** (`follows`, `get_follow_counts`) + feed "de quem eu sigo" | tabelas/RPC órfãs | P1 | M | Seguir/deixar de seguir; contadores corretos; sem self-follow (`follows_no_self`) |
| E4 | **Denunciar conteúdo** (mídia, comentário, produto, notícia, perfil) criando `reports` | tabela órfã | P1 | S | Botão em cada conteúdo; denúncia registrada uma vez por usuário |
| E5 | **Comentários**: editar, apagar (dono/admin), limite 2–280 no cliente, paginação | `schema.sql:106` | P1 | M | Fluxos funcionam; erro do banco nunca chega cru |
| E6 | **Moderação automática leve**: filtro de palavras + link apenas de http(s) + limite de posts/dia | B7 | P2 | M | Spam óbvio é bloqueado com mensagem |

### F. Agenda e eventos

| ID | Tarefa | P | E | Critérios de aceite |
|---|---|---|---|---|
| F1 | **Capacidade e lista de espera** (`events.max_participants`, `event_enrollments.status`) | P1 | M | Lotou → entra na espera; desistência promove o próximo |
| F2 | **Check-in de presença** via `check_in_event()` (QR code ou botão do admin) | P1 | M | Presença registrada em `event_attendance`; % aparece no evento |
| F3 | **Lembretes** (notificação + e-mail 24h antes) | P2 | M | Inscrito recebe lembrete (depende de J3) |
| F4 | **Evento recorrente** (treino semanal) | P2 | M | Cria série com exceções |
| F5 | **Editar evento** (hoje só cria e apaga) | P1 | S | Admin edita sem perder inscrições |
| F6 | **iCal / adicionar ao calendário** | P2 | S | Botão gera `.ics` válido |

### G. Notícias e equipes

| ID | Tarefa | P | E | Critérios de aceite |
|---|---|---|---|---|
| G1 | Paginação + página individual de notícia com URL própria | P1 | M | `/noticia/:id` abre direto e é indexável |
| G2 | Editor rico simples (negrito, lista, link, imagem inline) com sanitização | P2 | M | HTML salvo é sanitizado no servidor |
| G3 | Edição/destaque/arquivamento de notícia pelo admin | P1 | S | Funciona e aparece na hora |
| G4 | `team_stats` na página da equipe (atletas, presenças, conquistas) | P2 | M | Números reais, não hardcoded |
| G5 | Múltiplos admins por equipe (hoje 1 equipe por `admin_id`) | P2 | M | Equipe tem N responsáveis |

### H. Administração, moderação e dados

| ID | Tarefa | Evidência | P | E | Critérios de aceite |
|---|---|---|---|---|---|
| H1 | **Fila de moderação** (lista `reports`, resolver/descartar, apagar conteúdo) | tabela órfã | **P0** | M | Admin resolve denúncia; conteúdo some; autor é notificado |
| H2 | **Suspender/reativar usuário** (`suspend_user`/`unsuspend_user`) | funções órfãs | **P0** | S | Usuário suspenso não consegue postar (já barrado no banco) e vê o motivo |
| H3 | **Analytics do dono** com `get_analytics()`: cadastros/30d, esportes, receita, funil, top eventos | função órfã | P1 | M | Gráficos renderizam com dados reais |
| H4 | **Auditoria** (`audit_log`): aba com ações de admin, filtro por ator/ação | tabela órfã | P1 | S | Toda ação de admin registra e aparece |
| H5 | **Moderação de conteúdo em massa** (multi-seleção, ação em lote) | Painel do Dono apaga 1 a 1 | P2 | M | Seleciona 10 mídias e apaga |
| H6 | **Exportar dados** (CSV de usuários/pedidos) | LGPD | P2 | S | Download funciona e respeita `is_owner` |

### I. UX, acessibilidade, performance e PWA

| ID | Tarefa | Evidência | P | E | Critérios de aceite |
|---|---|---|---|---|---|
| I1 | **PWA de verdade**: linkar o manifest, gerar `assets/icon-192.png` e `icon-512.png`, service worker (cache de app shell + fallback offline) | `manifest.json` órfão | P1 | M | Lighthouse PWA ok; instala no celular; funciona offline na landing |
| I2 | **SEO**: meta description, Open Graph, Twitter card, favicon, `robots.txt`, `sitemap.xml`, títulos por tela | `index.html:1-7` | P1 | S | Compartilhamento no WhatsApp mostra prévia; indexação possível |
| I3 | **Acessibilidade (WCAG AA)**: contraste, `alt`, foco visível, `aria-live` nos toasts, rótulos, navegação por teclado nas grades, `prefers-reduced-motion` | parcial (modais já têm focus trap) | P1 | M | Lighthouse a11y ≥ 95; navegação completa por teclado |
| I4 | **Rotas/URLs**: `history.pushState` por tela (`/agenda`, `/marketplace`) — o `server.mjs` já faz fallback SPA | tudo é estado interno | P1 | M | Recarregar em `/agenda` mantém a tela; links compartilháveis |
| I5 | **Performance**: imagens responsivas (`srcset`/thumbnails), lazy load real, dividir `script.js` por tela, comprimir assets | P2–P5 | P1 | M | LCP < 2,5 s em 4G; bundle inicial < 150 KB |
| I6 | **Estados vazios/erro consistentes** + retry com `retry()` do `validation.js` | já existe a função, não é usada | P2 | S | Toda tela tem vazio/erro bonitos e botão "tentar de novo" |
| I7 | **i18n** (pt-BR + en) se o produto for internacional | textos hardcoded em pt-BR | P2 | L | Só se decidido |
| I8 | **Onboarding guiado** (tour de 4 passos) para novos usuários | só existe o modal de perfil | P2 | M | Tour roda uma vez e pode ser reaberto |

### J. Deploy e operação

| ID | Tarefa | P | E | Critérios de aceite |
|---|---|---|---|---|
| J1 | **Hospedagem definitiva** (GitHub Pages/Cloudflare Pages/Vercel) com domínio próprio e HTTPS | **P0** | S | Site acessível em `https://dominio` com certificado válido |
| J2 | **Backups**: PITR ativado no Supabase + dump diário automatizado | **P0** | S | Restore testado e documentado |
| J3 | **E-mail transacional** (Resend/Postmark via Edge Function): boas-vindas, novo pedido, novo admin aprovado, lembrete de evento | **P0** | M | Os 4 e-mails chegam; templates em pt-BR |
| J4 | **Monitoramento de erros** (Sentry ou similar) + uptime check | P1 | S | Erro no navegador aparece no painel em < 1 min |
| J5 | **Analytics de produto** (Plausible/Umami, sem cookies) | P2 | S | Dashboard de acessos funcionando |
| J6 | **Rate limit / WAF** no host e no Supabase | P1 | S | Ataque de força bruta é mitigado |
| J7 | **Runbook de incidente** (o que fazer se o Supabase cair, se vazar chave, se o storage encher) | P2 | S | Documento revisado |

### K. Legal e compliance (Brasil)

| ID | Tarefa | P | E | Critérios de aceite |
|---|---|---|---|---|
| K1 | **Política de Privacidade** e **Termos de Uso** (LGPD: base legal, finalidade, encarregado, direitos) | **P0** | M | Páginas publicadas e linkadas no rodapé e no cadastro |
| K2 | **Consentimento no cadastro** (checkbox) + registro de data/hora | **P0** | S | Sem aceite não cria conta; aceite fica gravado |
| K3 | **Direitos do titular**: exportar meus dados e excluir minha conta (liga em C2/H6) | **P0** | M | Ambos os fluxos funcionam |
| K4 | **Política de cookies** (se houver analytics com cookie) | P1 | S | Banner/configuração quando aplicável |
| K5 | **Regras da comunidade + política de moderação** (necessário para UGC) | P1 | S | Página publicada; link no formulário de denúncia |
| K6 | **CNPJ/MEI, nota fiscal e contrato de intermediação** se o marketplace cobrar taxa (o `get_analytics` já calcula 5% de receita) | P1 | — | Decisão de negócio registrada (§8) |

### L. Sistema de Admin — controle total de todas as contas

> **Decisão do dono (14/09/2026):** o admin precisa ter **controle total de todas
> as contas que logarem no site**. Isso é implementado como um **Console de
> Administração** com permissões no banco (RBAC), auditoria completa e
> guarda-corpos de segurança/LGPD — **nunca** como privilégio decidido no cliente.
>
> **Hoje** o admin faz 4 coisas: aprovar/recusar pedido de admin, promover,
> revocar e excluir conta (`db.js:269-303`). **Falta todo o resto.**

| ID | Tarefa | P | E | Critérios de aceite |
|---|---|---|---|---|
| L1 | **Console de Contas**: lista mestra de **todas** as contas com papel, status, data de cadastro, último acesso, sessões ativas e contadores (produtos, mídias, comentários, pedidos, vendas); filtros, busca, ordenação, paginação e exportação CSV | **P0** | M | A tela lista 100% das contas; filtro por papel/status/"online" roda no banco; CSV baixa |
| L2 | **Presença real**: RPC `touch_session()` (heartbeat no boot e a cada troca de tela, com debounce) gravando `last_seen_at`, dispositivo e IP; badge "online" para atividade < 5 min | **P0** | M | Admin vê quem está logado agora; o estado some após 5 min de inatividade |
| L3 | **Ficha da conta (dossiê)** com 6 abas: **Perfil** (edição inline de qualquer campo), **Segurança** (reset de senha, forçar logout de todas as sessões, 2FA), **Conteúdo** (tudo que a conta criou, com ação por item), **Financeiro** (pedidos, vendas, taxa 5%, repasses, estornos), **Moderação** (denúncias) e **Auditoria** | **P0** | L | Qualquer campo de qualquer conta é editável pelo admin; as 6 abas mostram dados reais |
| L4 | **Ações de controle**: promover/rebaixar entre papéis, **suspender/reativar com motivo e prazo**, banir, excluir com carência, verificar e-mail manualmente, **mesclar conta convidada → conta real** (preservando dados), transferir propriedade de conteúdo, crédito/débito manual com justificativa | **P0** | M | Cada ação funciona, exige motivo e aparece na auditoria |
| L5 | **Impersonação real** (✅ decidida em 14/09/2026): o admin **entra de fato** na conta, via Edge Function que emite sessão temporária com `service_role`. Obrigatório: 2FA, **motivo digitado**, sessão de no máx. 30 min, banner vermelho permanente, botão "sair da impersonação" sempre visível e registro completo em `audit_log` | **P0** | M | Admin age como o usuário (escreve inclusive); banner não some; sessão expira sozinha em 30 min; cada ação durante a impersonação é marcada no log |
| L6 | **RBAC no banco com 2 papéis** (✅ decidido em 14/09/2026: **somente admin e usuários**): `admin` e `usuario`. Coluna `role` em `profiles` + função `has_permission(perm)` usada nas policies; `is_owner` continua existindo como **privilégio extra dentro de admin** (financeiro, excluir conta, promover outros admins) — não como terceiro papel | **P0** | M | Conta `usuario` que chamar ação de admin pela API direta é recusada; `admin` não-dono não acessa financeiro nem promove admin; teste automatizado para os 3 casos (`usuario`, `admin`, `admin`+`is_owner`) |
| L7 | **Auditoria total**: estender `audit_log` com `before`/`after` (diff JSON), `reason`, `ip`, `user_agent`, `result`; aba com filtros; **retenção mínima de 5 anos, sem delete** | **P0** | M | Toda ação sensível gera trilha com valor antigo e novo; nenhum papel apaga a trilha |
| L8 | **Guarda-corpos do próprio admin**: 2FA (TOTP) obrigatório para `admin`/`owner`, sessão curta, alerta de login em dispositivo novo, confirmação dupla com motivo digitado em ações destrutivas, rate limit, `service_role` **somente** em Edge Functions | **P0** | M | Sem 2FA não há acesso admin; ação destrutiva sem motivo é recusada |
| L9 | **LGPD no acesso a dados pessoais**: base legal e finalidade documentadas, **motivo obrigatório** para abrir a ficha de uma conta, e-mail/documentos mascarados por padrão com botão "revelar" auditado, registro de cada visualização | **P0** | M | Abrir ficha sem motivo é bloqueado; cada "revelar" fica na auditoria |
| L10 | **Alertas ao admin**: contadores no topo do console (contas novas hoje, denúncias pendentes, pedidos com problema, chargebacks) + e-mail (J3) em ações críticas | P1 | S | Painel mostra os números; dono recebe e-mail de ação crítica |
| L11 | **Convite de admins pelo dono**: convite por e-mail com expiração; o aceite cria a conta já com o papel (tabela `admin_invites`) | P1 | S | Convite expirado não funciona; papel aplicado no aceite |
| L12 | **Controle financeiro**: GMV, taxa de 5% retida, repasses pendentes, reembolsos e chargebacks; bloquear repasse de vendedor sob investigação | **P0** | M | Números batem com o painel do Mercado Pago; bloqueio impede o repasse |

**Novas migrations necessárias**: `admin_roles`, `admin_permissions`,
`admin_role_permissions`, `admin_invites`, `sessions_log` (heartbeat),
`account_actions` (motivos), `payments` (Etapa 4) e colunas novas em `audit_log`
(`before`, `after`, `reason`, `ip`, `user_agent`, `result`).

**O que "controle total" NÃO significa** (decisão técnica, não limitação): nada de
poder decidido no navegador, nada de `service_role` no front, nada de acesso a
dados pessoais sem motivo registrado. Controle total com trilha completa — é isso
que sustenta o produto perante a LGPD e perante o próprio dono do site.

---

## 5. Plano por etapas

> Cada etapa termina com: código no branch, testes passando, PR aberto, tabela de
> maturidade (§1) atualizada. Estimativas em horas de agente.

### Etapa 0 — Fundação (antes de qualquer feature) · ~8 h · `P0`

**Objetivo**: deixar o projeto testável, configurável e versionado.

| Itens | Entregáveis |
|---|---|
| A1, A2, A3, A4, A5, A6, A7 | `package.json` + `tests/app.test.mjs` (harness versionado) · workflow `.github/workflows/ci.yml` · `config.js`/`config.local.js` sem segredo · `migrations/` + `db/migrate.sh` · ESLint/Prettier · README de operação · projeto Supabase de staging |

**Definition of Done**
- `npm test` → 40+ asserções, exit 0.
- CI verde no PR e vermelho se alguém quebrar o boot.
- `grep -r "eyJhbGci" --include=*.js .` não retorna segredo novo fora do `config.local.js` (gitignorado).
- Aplicar `migrations/` num projeto Supabase vazio reproduz o schema atual (22 tabelas, 85 policies).

**Testes**: `npm test`, `node --check` em todos os `.js`, aplicar migrations no staging.
**Risco**: baixo. **Dependência**: acesso ao painel Supabase para criar o projeto de staging.

#### ✅ Status da Etapa 0 (executada em 14/09/2026)

| Item | Estado | Evidência |
|---|---|---|
| A1 testes versionados | ✅ pronto | `tests/app.test.mjs` — **43 verificações, 0 falhas**, exit 1 se falhar |
| A2 CI | ⚠️ pronto, **não ativado** | `ci/ci.yml` (check + lint + format + test + verify-migrations). O push em `.github/workflows/` foi recusado por falta da permissão `workflows` — copiar o arquivo ativa (veja `ci/README.md`) |
| A3 configuração | ✅ pronto | `config.js` + `config.local.example.js`; `supabase-client.js` sem chave; origem verificada nos dois modos (`local` e `arquivo`) |
| A4 migrations | ✅ pronto | `migrations/0001_init.sql` (idêntico ao `schema.sql`, verificado por `diff`), `db/migrate.sh`, `db/verify-migrations.sh` |
| A5 lint/format | ✅ pronto | `eslint.config.mjs` (0 erros — validado com arquivo-prova que gera `no-undef`/`no-dupe-keys`), `.prettierrc` |
| A6 README de operação | ✅ pronto | Seção "Rodar, testar e operar" no README |
| A7 staging | ⏳ **pendente (guia pronto)** | Passo a passo completo em `SETUP-SUPABASE.md` (criar projeto, aplicar migrations, config, storage, auth, admin). Exige a conta do dono no painel |

Comandos disponíveis: `npm start` · `npm test` · `npm run check` · `npm run lint`
· `npm run format` · `npm run verify` · `./db/migrate.sh` · `./db/verify-migrations.sh`.

**Achados desta etapa** (registrados para as próximas):
- `runLoader()` (`script.js:854`) e `let toastTimer` (`toast.js:6`) são código
  morto — entram na limpeza da Etapa 1.
- `validation.js` continua sem ser carregado de propósito: ligá-lo aos
  formulários é a tarefa **B6** (Etapa 1), não uma mudança de fundação.

---

### Etapa 1 — Segurança e integridade · ~20 h · `P0`

**Objetivo**: nenhum dado de usuário pode executar código, e nenhuma regra do banco pode ser furada pela interface.

| Itens | Entregáveis |
|---|---|
| B1, B4, B6, S7 | `esc()`/`attr()` aplicados em 100% das interpolações; `validation.js` carregado no `index.html` e usado em todos os formulários |
| B2, B3 | Validação de upload no cliente **e** no banco (tamanho, mimetype, path `{uid}/{uuid}.{ext}`) |
| B5 | RLS de `profiles` respeitando `public_profile` |
| B10 | Suite de testes de RLS (papéis: anônimo, convidado, atleta, admin, dono) |
| B7, B8 | Rate limit de escrita + CSP |

**Definition of Done**
- Teste de XSS: comentário `<img src=x onerror=alert(1)>` e legenda `<script>` renderizam como **texto** (asserção no harness).
- Grep no CI: zero `${campo}` vindo do banco sem escape.
- Upload de 10 MB / `.exe` barrado no cliente e no servidor.
- Teste RLS: usuário B (e anônimo) não lê dados privados de A; convidado não escreve em nada.
- Todos os formulários mostram a mesma regra que o banco (`5–80`, `2–280`, `5–120`, `3–80`).

**Testes**: harness estendido + `tests/rls.test.sql` (pgTAP ou `supabase test db`).
**Risco**: médio — mexer em RLS pode trancar o app; fazer no staging primeiro.
**Dependência**: Etapa 0 (staging + migrações).

#### ⚠️ Status parcial da Etapa 1 (14/09/2026) — parte executada, parte aguarda staging

| Item | Estado | Evidência |
|---|---|---|
| B1 XSS | ✅ | `escapeHtml` aplicado em eventos, equipes, mídia, comentários, carrinho e pedidos de admin. Teste: comentário `<img src=x onerror=…>` → **0 nós** `<img>/<script>`, o payload aparece como texto e **nada executa** |
| B2 upload (cliente) | ✅ | `validateUpload()` em `db.js` (tipo, tamanho, extensão saneada). Testes: >5 MB rejeitado, `.exe` rejeitado, vídeo aceito só no bucket `media` |
| B4 URLs/CSS | ✅ | `safeUrl()` em mídia/equipes/carrinho e `safeColor()` para `--team-color`. Testes: `javascript:` bloqueado, injeção de CSS bloqueada |
| B6 `validation.js` | ✅ | `validateForm()` ligado nos 9 formulários de `submit` **e** no onboarding/editar perfil (`btn-concluir-cadastro`). Testes: e-mail inválido/válido e onboarding sem/com nome |
| B3 upload (banco) | ⚠️ escrita, **não testada** | `migrations/0002` (só o dono grava na própria pasta + teto por `metadata`). Exige staging |
| B5 privacidade | ⚠️ escrita, **não testada** | `migrations/0003` (`profiles_select_public` respeita `public_profile`). Exige staging |
| B7 rate limit | ✅ (client) | `rateLimit()` (janela deslizante) no login/cadastro; teste: bloqueia após N tentativas. O limite de servidor fica na Etapa 4 |
| B8 CSP | ✅ (com ressalva) | meta CSP no `index.html` (connect/frame restritos ao Supabase; object-src/base-uri/form-action travados). `'unsafe-inline'` ainda exigido pelos handlers inline — removê-los é tarefa do BACKLOG. Verificar no navegador real |
| B10 suite RLS | ⏳ | depende do staging (A7) — ver `BACKLOG.md` |

**Bug corrigido nesta etapa**: o `onerror="mediaImgError(this)"` da mídia chamava uma
função que **não existia** (Referência que estouraria a cada imagem quebrada).
Substituído por um `addEventListener("error")` que troca a imagem por um
placeholder — sem handler inline (também mais amigável a CSP).

---

### Etapa 2 — Contas completas e LGPD básica · ~16 h · `P0/P1`

**Objetivo**: ciclo de vida de conta completo e legalmente defensável.

| Itens | Entregáveis |
|---|---|
| C1, C3, C4 | Confirmação de e-mail (com flag de beta), troca de e-mail/senha, recuperação revisada |
| C2, C7 | Exclusão de conta self-service (carência 7 dias) + conversão convidado → conta |
| K1, K2, K3 | Política de Privacidade, Termos, consentimento no cadastro, exportar meus dados |
| C5 | Perfil completo (esportes, bio, links, avatar com crop) |

**Definition of Done**
- Cadastro → e-mail de confirmação → login.
- "Excluir minha conta" some com tudo em 7 dias (ou imediato, conforme decidido).
- Convidado que cria conta **não perde** curtidas/inscrições/carrinho (asserção no harness).
- Rodapé com Privacidade e Termos; aceite gravado com data.

**Testes**: harness (fluxos de conta) + teste manual de e-mail no staging.
**Risco**: médio (mexer em auth pode derrubar sessão existente).
**Dependência**: J3 (e-mail) — pode entrar em paralelo.

---

### Etapa 3 — Marketplace real (sem pagamento) · ~24 h · `P0`

**Objetivo**: compra e venda de ponta a ponta, com pedido registrado — ainda com pagamento manual/offline.

| Itens | Entregáveis |
|---|---|
| D1, D2, D3 | Checkout com endereço → `create_order()` → "Meus pedidos" → painel do vendedor com status |
| D4, D5, D6, D7 | Avaliações reais (`product_ratings`), galeria (`product_images`), estoque, edição/pausa de anúncio |
| E5 | Comentários com editar/apagar e limite correto |
| D9 | Filtros e paginação no marketplace |
| E1 | Feed de mídia sem N+1 e com paginação |

**Definition of Done**
- Comprar gera linha em `orders` + `order_items` com **preço congelado** (asserção no harness: total = Σ preço×qtd no momento da compra).
- Se `create_order` falhar, o carrinho **permanece intacto**.
- Vendedor muda status `pending → paid → shipped → delivered`; comprador vê a mudança.
- Nota média do produto vem do banco (não mais `★★★` fixo).
- Feed de mídia: 1 consulta para a página (medido no log do servidor/Network).

**Testes**: harness cobrindo checkout, falha de checkout, status, avaliação duplicada, estoque zero.
**Risco**: médio-alto (transação). **Dependência**: Etapa 1 (validação/segurança).

---

### Etapa 4 — Pagamento com Mercado Pago (split de 5%) · ~30 h · `P0`

**Decisões do dono (14/09/2026)**: o marketplace **cobra dinheiro de verdade**,
o gateway é o **Mercado Pago** e a taxa de intermediação é **5%**.

> **Consequência de arquitetura (importante):** o CoreMotion é 100% estático, e
> pagamento exige dois pontos de servidor — criar a preferência e receber o
> webhook. Como o `access_token` do Mercado Pago **nunca** pode ir para o
> navegador, esses dois pontos viram **Supabase Edge Functions** (Deno):
> `mp-create-preference` e `mp-webhook`. É a primeira vez que o projeto ganha
> código de servidor — por isso a etapa ficou maior.

| ID | Tarefa | P | E | Critérios de aceite |
|---|---|---|---|---|
| PAY1 | **Conta e credenciais**: conta MP de produção + aplicação em "Suas integrações"; `access_token` e webhook secret guardados como segredo do Supabase (nunca no repo) | **P0** | S | Credenciais de teste e produção separadas; `git grep access_token` não retorna nada |
| PAY2 | **Onboarding do vendedor**: vincular cada vendedor à plataforma via OAuth (conta MP + dados de repasse); o status "apto a vender" só aparece depois do vínculo | **P0** | M | Vendedor sem vínculo não anuncia; o vínculo aparece na ficha da conta (L3) |
| PAY3 | **Checkout**: Edge Function `mp-create-preference` monta a preferência a partir do **pedido gravado no banco** (nunca do preço vindo do cliente) e devolve a `init_point`; o front usa **Checkout Pro** na v1 (Pix + cartão + boleto) | **P0** | M | Total da preferência = total de `orders`; adulterar o preço no navegador não muda o valor cobrado |
| PAY4 | **Split de 5%**: `marketplace_fee` na preferência (Checkout Pro) — no Checkout Transparente/Bricks o parâmetro equivalente é `application_fee`. Simular o líquido do vendedor antes de travar o número: o Mercado Pago desconta a taxa dele **primeiro** e a comissão do marketplace incide sobre o restante | **P0** | M | Em uma venda de R$ 100 a plataforma retém 5% e o vendedor recebe o líquido; o relatório de split confere com o painel do MP |
| PAY5 | **Webhook `mp-webhook`**: validar o header `x-signature` (HMAC-SHA256 do manifesto `id:{data.id};request-id:{x-request-id};ts:{ts};` com o secret da integração), responder `200`, e só então confirmar o pagamento consultando a API do MP para atualizar `orders.status` | **P0** | M | Webhook com assinatura inválida → 401 e nenhum status muda; webhook duplicado não duplica efeito (idempotência por `mp_payment_id`) |
| PAY6 | **Tabela `payments`** (migration): `order_id`, `mp_payment_id` (único), `status`, `amount`, `fee`, `net`, `raw jsonb`, `received_at` | **P0** | S | Cada pagamento tem uma linha; replay do webhook não cria duplicata |
| PAY7 | **Telas de retorno**: aprovado · pendente (Pix aguardando) · recusado, com motivo legível e "tentar outro meio de pagamento" | **P0** | M | Cada status tem tela própria; o comprador nunca fica sem resposta |
| PAY8 | **Recibos por e-mail** (J3): comprador (recibo), vendedor (venda + valor líquido), dono (taxa retida) | **P0** | S | Os três e-mails chegam com valores corretos |
| PAY9 | **Reembolso e chargeback**: estorno total/parcial pela API refletido no pedido; webhook de chargeback com alerta ao dono | P1 | M | Estorno muda o status e aparece no financeiro do admin (L12) |
| PAY10 | **Conciliação diária**: relatório comparando `orders`/`payments` com a API do MP; divergência vira alerta | P1 | M | Divergência simulada é detectada |
| PAY11 | **Sandbox**: contas e cartões de teste do Mercado Pago; fluxo completo testado antes da produção | **P0** | S | Compra de teste aprovada, pendente e recusada |
| PAY12 | **Fiscal da plataforma**: o vendedor **não precisa de CNPJ/MEI** (✅ decidido em 14/09/2026 — onboarding com CPF). Fica pendente só o lado da plataforma: como declarar a receita dos 5% (verificar com contador — não é bloqueio técnico) | P2 | S | Onboarding aceita CPF; nota/declaração da taxa documentada |

**Definition of Done**
- Comprar gera `orders` + `order_items` + preferência no MP com o **preço do banco**.
- `orders.status` vira `paid` **apenas** por webhook com assinatura válida e confirmação na API.
- Split de 5% conferido no painel do MP; o vendedor vê o valor líquido no app.
- Falha no pagamento não perde o pedido nem o carrinho.
- Estorno e chargeback refletem no app e no financeiro do admin.
- Nenhum segredo do MP no repositório nem no navegador.

**Testes**: sandbox + replay de webhook + assinatura inválida + preço adulterado no cliente + conciliação de 10 pedidos.
**Risco**: **alto** (dinheiro + primeira Edge Function). **Dependência**: Etapa 3 e conta ativa no Mercado Pago.

---

### Etapa 5 — Comunidade viva · ~20 h · `P0/P1`

**Objetivo**: o app passa a "avisar" as pessoas e a conectá-las.

| Itens | Entregáveis |
|---|---|
| E2 | Sino + central de notificações + tempo real (`notifications` já é alimentada por triggers) |
| E3 | Seguir atletas + contadores + feed "de quem sigo" |
| E4 | Denunciar qualquer conteúdo |
| E6 | Filtros anti-spam leves |

**Definition of Done**
- Curtir, comentar, avaliar, seguir, novo pedido e novo evento geram notificação **em tempo real** (asserção de realtime no harness/mock).
- Contador de não lidas correto; "marcar todas como lidas" funciona.
- Denúncia cria `reports` e não permite duplicata do mesmo usuário.

**Testes**: harness com canal realtime simulado.
**Risco**: baixo-médio. **Dependência**: Etapas 1 e 3 (as fontes de notificação).

---

### Etapa 6 — Agenda e presença · ~14 h · `P1`

| Itens | Entregáveis |
|---|---|
| F1, F2 | Capacidade + lista de espera + check-in (`check_in_event`) por QR/botão |
| F5, F6 | Editar evento + `.ics` |
| F3, F4 | Lembretes 24h (e-mail + notificação) e recorrência |

**Definition of Done**
- Evento lotado manda para a espera; cancelar inscrição promove o primeiro da fila (asserção).
- Admin faz check-in; `event_attendance` registra; % de presença aparece.
- Inscrito recebe lembrete 24h antes.

**Testes**: harness (capacidade/espera/promoção) + teste manual de lembrete.
**Risco**: baixo. **Dependência**: J3 (e-mail) para lembretes.

---

### Etapa 7 — Console de Admin: controle total de contas, moderação e dados · ~34 h · `P0`

**Objetivo**: o admin enxerga e controla **todas** as contas que logarem no site,
com trilha de auditoria completa e sem nenhuma permissão decidida no cliente.

| Itens | Entregáveis |
|---|---|
| L1, L2 | Console de Contas (lista mestra de todas as contas) + presença real por heartbeat |
| L3, L4 | Ficha da conta com 6 abas + todas as ações de controle (editar qualquer campo, reset de senha, forçar logout, suspender com motivo, banir, excluir, mesclar convidado, transferir conteúdo) |
| L6, L8 | RBAC no banco (`has_permission`) + 2FA obrigatório + confirmação com motivo em ação destrutiva |
| L7 | Auditoria total com diff antes/depois, motivo, IP e user-agent |
| L9 | Guarda-corpo LGPD: motivo para abrir a ficha e máscara de dados sensíveis |
| H1, H2 | Fila de moderação (denúncias) + suspender/reativar integrado à ficha |
| H3, H4, L10 | Analytics (`get_analytics`) + aba de auditoria + alertas ao admin |
| H5, H6, L11, L12 | Ações em lote, exportação CSV, convite de admin, controle financeiro |
| L5 | "Acessar como" (impersonação) com banner e expiração |

**Definition of Done**
- Qualquer conta do site aparece no console com papel, status, último acesso e contadores; "online agora" reflete atividade real.
- O admin abre a ficha de **qualquer** conta e edita nome, e-mail, função e avatar; reset de senha e "sair de todos os dispositivos" funcionam.
- Suspender com motivo impede a conta de postar (já barrado por `is_suspended` nas policies) e o usuário vê o motivo no app.
- **Nenhuma permissão é decidida no cliente**: chamar a API direto com token de `moderator` numa ação de `admin` é recusado (teste automatizado por papel).
- Toda ação sensível fica em `audit_log` com valor antigo, valor novo, motivo, IP e user-agent; nenhum papel consegue apagar a trilha.
- Abrir a ficha de uma conta exige motivo; e-mail aparece mascarado até o "revelar" (auditado).
- Impersonação mostra banner permanente e expira em 30 min.

**Testes**: harness cobrindo cada ação + suite RLS por papel (`owner`/`admin`/`moderator`/`support`/`atleta`/`convidado`/anônimo) + teste de auditoria (ação sem motivo é recusada).
**Risco**: médio — é a área com maior superfície de abuso; por isso RBAC e auditoria entram junto, não depois.
**Dependência**: Etapas 1 (segurança) e 3–5 (há conteúdo e pedidos para administrar).

---

### Etapa 8 — Produto polido: PWA, SEO, acessibilidade, performance · ~18 h · `P1`

| Itens | Entregáveis |
|---|---|
| I1 | Manifest linkado + ícones 192/512 + service worker + offline |
| I2 | Meta tags, OG, favicon, `robots.txt`, `sitemap.xml` |
| I3 | Acessibilidade AA (contraste, `aria-live`, teclado, `prefers-reduced-motion`) |
| I4 | Rotas com `history.pushState` (`/agenda`, `/marketplace`, `/noticia/:id`) |
| I5 | Imagens responsivas/thumbnails, lazy load, divisão do JS por tela |
| I6, I8 | Estados de erro com retry (`retry()` do `validation.js`) + tour de onboarding |

**Definition of Done**
- Lighthouse: Performance ≥ 90, Acessibilidade ≥ 95, SEO ≥ 95, PWA instalável.
- Recarregar `/marketplace` mantém a tela; link compartilhado abre o conteúdo certo.
- Navegação completa por teclado; toasts anunciados por leitor de tela.
- LCP < 2,5 s em 4G simulado; bundle inicial < 150 KB.

**Testes**: Lighthouse CI no workflow + harness de rotas.
**Risco**: baixo. **Dependência**: Etapa 4/5 (conteúdo para indexar).

---

### Etapa 9 — Lançamento e operação · ~12 h · `P0`

| Itens | Entregáveis |
|---|---|
| J1 | Domínio próprio + HTTPS + hospedagem definitiva |
| J2 | PITR + dump diário + teste de restore |
| J4, J6 | Sentry + uptime + WAF/rate limit no host |
| J7 | Runbook de incidente |
| K5, K4 | Regras da comunidade e política de cookies publicadas |
| — | **Teste de carga**: 200 usuários simultâneos no feed e no checkout |
| — | **Checklist de go-live** assinado (§7) |

**Definition of Done**
- `https://dominio` no ar, HTTPS válido, monitoramento ativo, backup restaurado com sucesso em teste.
- Erro injetado em produção aparece no Sentry em < 1 min.
- Carga de 200 usuários sem erro 5xx e p95 < 800 ms.

**Risco**: médio (depende de serviços externos). **Dependência**: tudo acima.

### Resumo do cronograma

| Etapa | Foco | Horas | Acumulado | Marco |
|---|---|---|---|---|
| 0 | Fundação/testes/CI | 8 | 8 | Projeto testável |
| 1 | Segurança | 20 | 28 | **Sem XSS, sem furo de RLS** |
| 2 | Contas + LGPD | 16 | 44 | Ciclo de conta completo |
| 3 | Marketplace real | 24 | 68 | **Pedido existe** |
| 4 | **Pagamento (Mercado Pago, split 5%)** | 30 | 98 | **Dinheiro entra** |
| 5 | Comunidade/notificações | 20 | 118 | App avisa e conecta |
| 6 | Agenda/presença | 14 | 132 | Treino com check-in |
| 7 | **Console de Admin — controle total de contas** | 34 | 166 | Operação sob controle |
| 8 | PWA/SEO/a11y/perf | 18 | 184 | Produto polido |
| 9 | Lançamento | 12 | 196 | **No ar** |

**v1 pública utilizável: fim da Etapa 4 (~98 h). Produto completo: fim da Etapa 9 (~196 h).**

---

## 6. Estratégia de testes (obrigatória em todas as etapas)

| Camada | Ferramenta | O que cobre | Quando roda |
|---|---|---|---|
| Sintaxe | `node --check *.js` | Erro de digitação/parse | Todo commit (CI) |
| **UI/integração** | **jsdom + Supabase simulado** (harness já criado nesta sessão → versionar em `tests/app.test.mjs`) | Boot, login, telas, escrita, toasts, XSS, checkout | Todo commit (CI) |
| **Banco/RLS** | pgTAP ou `supabase test db` | Cada policy para cada papel (anônimo/convidado/atleta/admin/dono), constraints, RPCs | Todo commit que tocar `migrations/` |
| E2E | Playwright (a partir da Etapa 3) | Fluxos críticos em navegador real: cadastro → anunciar → comprar → pedido | Nightly + antes de release |
| Performance | Lighthouse CI | LCP, bundle, a11y, SEO, PWA | PRs da Etapa 8+ |
| Carga | k6 | Feed e checkout com 200 usuários | Etapa 9 |

**Regra**: um bug encontrado vira **teste primeiro**, correção depois.

O harness atual executa o `index.html` real e todos os `.js` reais contra um
cliente Supabase simulado em memória — ou seja, ele testa o código de produção,
não uma reimplementação. Ele precisa crescer junto com cada etapa (novas telas,
novos fluxos, casos de XSS, falha de checkout).

---

## 7. Definition of Done — "site real e funcional"

Um item só é riscado quando todos os marcadores abaixo forem verdadeiros:

- [ ] **Segurança**: zero interpolação não escapada de dado do banco; upload validado no cliente e no banco; RLS testada por papel; CSP ativa.
- [ ] **Conta**: cadastro com confirmação, login, recuperação, troca de senha, exportar dados, excluir conta.
- [ ] **Compra**: pedido criado no banco com total correto; pagamento aprovado via webhook assinado; comprador e vendedor acompanham o status; recibo por e-mail.
- [ ] **Comunidade**: notificações em tempo real, seguir, denunciar, comentar com limites.
- [ ] **Evento**: capacidade, lista de espera, check-in, lembrete.
- [ ] **Admin**: console listando **todas** as contas; ficha completa editável de qualquer conta; suspender/banir/mesclar convidado/impersonar; RBAC testado por papel no banco; 2FA obrigatório; auditoria com antes/depois, motivo, IP e user-agent; moderação de denúncias; analytics e financeiro.
- [ ] **Qualidade**: `npm test` verde, CI verde, Lighthouse ≥ 90/95/95, zero erro no console no fluxo principal.
- [ ] **Operação**: domínio + HTTPS, backup com restore testado, Sentry, uptime, runbook.
- [ ] **Legal**: Privacidade, Termos, Regras da Comunidade, consentimento gravado, exclusão de dados funcional.
- [ ] **Documentação**: README de operação atualizado, migrations versionadas, decisões registradas (§9).

---

## 8. Decisões de produto — tomadas e pendentes

| # | Pergunta | Por que importa | Opções |
|---|---|---|---|
| 1 | ~~O marketplace cobra dinheiro de verdade?~~ | ✅ **DECIDIDO em 14/09/2026: SIM**, com gateway de pagamento | Etapa 4 integral (não é vitrine) |
| 2 | ~~Qual gateway?~~ | ✅ **DECIDIDO: Mercado Pago** | Checkout Pro na v1 · webhook com `x-signature` · sandbox antes da produção |
| 3 | ~~Taxa de intermediação?~~ | ✅ **DECIDIDO: 5%** | Split via `marketplace_fee` (PAY4) — já é o valor que `get_analytics()` calcula |
| 4 | **Domínio e hospedagem** | J1/I2/SEO | GitHub Pages · Cloudflare Pages · Vercel |
| 5 | **E-mail transacional** | J3 (confirmação, pedido, lembrete, aprovação de admin) | Resend · Postmark · SMTP próprio |
| 6 | **Confirmação de e-mail** ligada no lançamento? | C1 — hoje está desligada (fluxo de beta) | Ligar · manter desligada |
| 7 | **Quem modera?** | H1/E4 — precisa de gente e de política | Só o dono · equipe de moderadores |
| 8 | **Escopo geográfico/público** | Define frete, idioma (I7), LGPD vs GDPR | Escola/associação · público geral |
| 9 | **App nativo?** | I1 (PWA) costuma bastar | PWA · PWA + wrapper (Capacitor) |
| 10 | **Manter JS puro ou migrar para framework?** | Etapa 8/9 — 80 KB de `script.js` começa a pesar | Manter puro + módulos ES · migrar para Svelte/React (custo alto) |
| 11 | ~~Impersonação real ou só view-as?~~ | ✅ **DECIDIDO em 14/09/2026: impersonação REAL**, com 2FA + motivo + 30 min + banner + auditoria | L5 virou **P0** |
| 12 | ~~Quais papéis de admin?~~ | ✅ **DECIDIDO: somente `admin` e `usuario`** (o `is_owner` continua como privilégio extra do dono dentro de admin) | L6, L4 |
| 13 | ~~Vendedor precisa de CNPJ/MEI?~~ | ✅ **DECIDIDO: NÃO** — onboarding com CPF | PAY2, PAY12 |

---

## 9. Registro de decisões (preencher ao executar)

| Data | Decisão | Motivo | Itens afetados |
|---|---|---|---|
| 14/09/2026 | Servir o app com `server.mjs` (Node, sem dependências) no preview | Projeto é estático; `file://` quebra Auth/localStorage | A6 |
| 14/09/2026 | Verificação de UI feita com jsdom + Supabase simulado em vez de reimplementar lógica | Testa o código de produção real | A1, §6 |
| 14/09/2026 | **O marketplace cobra dinheiro de verdade** (não é vitrine) | Decisão do dono | Etapa 4, D1–D3, PAY1–PAY12 |
| 14/09/2026 | **Gateway: Mercado Pago**, com Checkout Pro na v1 e webhook assinado; código de servidor via Supabase Edge Functions | Decisão do dono; site é estático e o `access_token` não pode ir ao navegador | Etapa 4, PAY1–PAY11 |
| 14/09/2026 | **Taxa de intermediação: 5%**, retida por split (`marketplace_fee`) | Decisão do dono; já era o valor assumido em `get_analytics()` | PAY4, L12, H3 |
| 14/09/2026 | **Admin com controle total de todas as contas**, implementado como console com RBAC no banco, auditoria com diff, 2FA e guarda-corpos LGPD — nunca como privilégio decidido no cliente | Decisão do dono + requisito de segurança | Área **L** (L1–L12), Etapa 7 |
| 14/09/2026 | **Impersonação real** liberada (o admin entra de fato na conta), sempre com 2FA, motivo, sessão de 30 min, banner e auditoria | Decisão do dono | L5 (agora P0) |
| 14/09/2026 | **Somente 2 papéis: `admin` e `usuario`** — sem moderador/suporte; `is_owner` segue como privilégio extra do dono dentro de admin | Decisão do dono | L6, L4 |
| 14/09/2026 | **Vendedor não precisa de CNPJ/MEI** — onboarding do split com CPF | Decisão do dono | PAY2, PAY12, K6 |
| 14/09/2026 | **Etapa 0 executada** (A1–A6 prontos, A7 pendente de acesso ao painel) | Fundação para tudo que vem depois | Etapa 0 |
| 14/09/2026 | **Correção no A3**: a chave `anon` continua versionada em `config.js`, porque ela é pública por desenho (vai ao navegador de todo visitante). O objetivo real — separar ambientes e nunca versionar segredo de verdade — foi atingido com `config.local.js` + `SUPABASE_CONFIG_SOURCE` | Achei a falha no próprio critério durante a execução | A3, Etapa 1 (B10 continua sendo a proteção de fato) |
| 14/09/2026 | **Etapa 1 (parte 1) executada**: XSS eliminado em todas as interpolações de dado do banco (escapeHtml), uploads validados no cliente (validateUpload), URLs/CSS sanitizados (safeUrl/safeColor), validation.js carregado; testes de XSS/upload no harness | Execução direta da Etapa 1 | B1, B2, B4, B6 |
| 14/09/2026 | **migrations 0002/0003 escritas e NÃO testadas** (storage hardening e privacidade de profiles) — bloqueadas pela falta de um banco de staging | Sem acesso ao Supabase neste ambiente | B3, B5, A7 |
| 14/09/2026 | **Etapa 1 (parte 2)**: B6 (`validateForm` nos 9 formulários), B7 (`rateLimit` client no login/cadastro), B8 (meta CSP). Harness → 58 checks. Restante (B10, validar 0002/0003, CSP sem unsafe-inline) salvo em `BACKLOG.md` | Execução direta da Etapa 1 | B6, B7, B8 |
| 14/09/2026 | **CORREÇÃO**: os "bugs de produto/mídia" que registrei eram **falsos** (inferidos de funções inexistentes). Verificado: `dbCreateProduct` usa só campos reais e a mídia usa `#midia-input`. O único bug funcional confirmado é o `#btn-finalizar-compra` (não cria pedido) | Releitura do código | BACKLOG, Etapa 3 |
| — | — | — | — |

---

## 10. Anexo A — mapa schema ↔ front-end

| Tabela | Usada no front? | Onde | Ação prevista |
|---|---|---|---|
| `profiles` | ✅ | `db.js:24,29` | B5 (privacidade), C5 |
| `products` | ✅ | `db.js:37,43,54,67` | D5–D7 |
| `product_comments` | ✅ | `db.js:74,84` | E5 |
| `product_images` | ❌ | — | D5 |
| `product_ratings` | ❌ | — | D4 |
| `orders` | ❌ | — | **D1, D2** |
| `order_items` | ❌ | — | **D1, D3** |
| `cart_items` | ✅ | `db.js:185-229` | D1 |
| `news` | ✅ | `db.js:95,101,318` | G1–G3 |
| `media` | ✅ | `db.js:112,118,147` | E1 |
| `media_likes` | ✅ | `db.js:127,137` | E1 |
| `events` | ✅ | `db.js:154,325,331` | F1–F6 |
| `event_enrollments` | ✅ | `db.js:164,173,178` | F1 |
| `event_attendance` | ❌ | — | F2 |
| `teams` | ✅ | `db.js:338-369` | G4, G5 |
| `team_stats` | ❌ | — | G4 |
| `seller_stats` | ❌ | — | D3 |
| `admin_requests` | ✅ | `db.js:236-276` | — |
| `follows` | ❌ | — | E3 |
| `notifications` | ❌ | — | **E2** |
| `reports` | ❌ | — | **E4, H1** |
| `audit_log` | ❌ | — | H4 |

**Funções do banco sem nenhuma chamada no front (7, todas prontas para receber UI)**:
`create_order`, `get_analytics`, `check_in_event`, `get_follow_counts`,
`suspend_user`, `unsuspend_user`, `log_admin_action`.
As demais (`is_admin`, `is_guest`, `is_owner`, `is_suspended`, `handle_new_user`,
`protect_admin_flag`, `create_notification`, `refresh_seller_stats`,
`refresh_team_stats`, `trg_*`) são internas do banco — triggers e policies.

## 11. Anexo B — comandos

```bash
# rodar o site
node server.mjs                 # http://localhost:4173  (PORT=8080 para trocar)

# verificar sintaxe de todos os scripts
for f in *.js; do node --check "$f" || echo "ERRO em $f"; done

# testes (após a Etapa 0)
npm test

# lint (após a Etapa 0)
npm run lint

# aplicar schema num projeto Supabase novo (hoje)
#   Supabase Dashboard → SQL Editor → colar schema.sql → Run
# após a Etapa 0:
./db/migrate.sh
```

---

### Próximo passo sugerido

Começar pela **Etapa 0** (8 h): versionar o harness de testes, ligar o CI e tirar
o segredo do repositório. É a etapa que torna todas as outras verificáveis — e,
sem ela, cada feature nova entra sem rede de proteção.
