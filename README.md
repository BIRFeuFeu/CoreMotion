# CoreMotion (clone) — com Supabase

Site completo em HTML/CSS/JS puro (sem build, sem framework) com backend real
no Supabase: autenticação, banco de dados e upload de imagens.

## Arquivos
| Arquivo | O que faz |
|---|---|
| `index.html` | Toda a marcação: landing, login/cadastro, onboarding, dashboard e modais |
| `style.css` | Todo o visual |
| `supabase-client.js` | Configuração de conexão com seu projeto Supabase |
| `toast.js` | Sistema de notificações (substitui os `alert()` do navegador) |
| `auth.js` | Login por e-mail, login com Google, conta convidado (login anônimo), logout |
| `db.js` | Upload de arquivos + leitura/escrita no banco (perfis, produtos, comentários, notícias, mídia, equipes, pedidos de admin) |
| `script.js` | Toda a interação da interface, já ligada ao Supabase |
| `schema.sql` | Script único que cria as tabelas, segurança, funções e buckets de imagem |
| `server.mjs` | Servidor HTTP local de desenvolvimento (opcional, sem dependências) |

---

## Rodar localmente (preview)

O site é estático, mas **não funciona com `file://`** (o Supabase Auth e o
`localStorage` exigem origem `http://` ou `https://`). Duas opções:

```bash
node server.mjs          # http://localhost:4173   (PORT=8080 node server.mjs para trocar a porta)
# ou, sem Node:
python3 -m http.server 4173
```

Depois é só abrir `http://localhost:4173`. Para funcionar de verdade o projeto
precisa das chaves do Supabase (já preenchidas em `supabase-client.js`) e do
`schema.sql` aplicado no banco.

---

## Passo a passo — Supabase

### 1. Criar o projeto
1. Crie uma conta em [supabase.com](https://supabase.com) e clique em **New Project**.
2. Espere o projeto terminar de provisionar (1–2 minutos).

### 2. E-mail do dono (já configurado neste projeto)
O e-mail do dono do site já está configurado como **alfeu.paula@escola.pr.gov.br**
no `schema.sql` (nas duas ocorrências: função `handle_new_user` e bloco de
"conserto retroativo"). Confira apenas se é esse mesmo o e-mail que você vai usar
para logar — **é a única pessoa que consegue aprovar novos administradores**.

> Se precisar trocar: altere o e-mail nas **duas** ocorrências do `schema.sql`.
> Se o e-mail ficar como o placeholder `SEU-EMAIL-DONO@exemplo.com`, o script
> para com um erro claro, de propósito.

### 3. Rodar o banco de dados
1. No Supabase, abra **SQL Editor** → **New query**.
2. Copie **todo** o conteúdo do `schema.sql` (já com seu e-mail ajustado) e cole lá.
3. Clique em **Run**. Isso cria:
   - as tabelas `profiles`, `products`, `product_comments`, `news`, `media`, `media_likes`, `events`, `event_enrollments`, `cart_items`, `teams`, `admin_requests`;
   - as regras de segurança (RLS) — cada um só edita o que é seu, contas convidado não escrevem nada, notícias/eventos/equipes só admin escreve, mas todo mundo lê;
   - os 5 buckets de imagem no Storage (`avatars`, `products`, `news`, `media`, `teams`), já públicos para leitura;
   - 4 eventos de exemplo na Agenda, só para a tela não ficar vazia — edite ou apague pelo **Table Editor**;
   - o reconhecimento automático do seu e-mail como **dono do site** (`is_owner = true`), inclusive com um "conserto retroativo" caso você já tivesse criado sua conta antes de rodar esse script.

### 4. Ativar login anônimo (usado pelo botão "Entrar como Convidado")
1. Vá em **Authentication → Providers**.
2. Ative **Anonymous Sign-ins**.
   *(Se não quiser esse botão, pode simplesmente ignorar — só ele vai parar de funcionar.)*

### 5. Ativar o login com Google (resolve o "não consigo entrar com Gmail")
Essa parte tem duas metades: criar as credenciais no **Google Cloud Console**, e
colar elas no **Supabase**. Vá com calma, é só a primeira vez que é chata.

**5.1 — No Google Cloud Console**
1. Acesse [console.cloud.google.com](https://console.cloud.google.com) e faça
   login com a conta Google que você usa (pode ser seu Gmail pessoal — não
   precisa ser o mesmo e-mail do dono do site).
2. No topo, clique em **Select a project → New Project**. Dê um nome (ex:
   "CoreMotion") e clique em **Create**. Espere carregar e selecione o projeto.
3. No menu lateral (☰), vá em **APIs & Services → OAuth consent screen**.
   - Escolha **External** → **Create**.
   - Preencha **App name** (CoreMotion), **User support email** (seu Gmail) e
     **Developer contact information** (seu Gmail de novo) → **Save and Continue**
     em todas as telas seguintes (Scopes e Test users podem ficar em branco) →
     **Back to Dashboard**.
4. Ainda em **APIs & Services**, vá em **Credentials** → **+ Create Credentials
   → OAuth client ID**.
   - **Application type:** Web application.
   - **Name:** CoreMotion Web.
   - Em **Authorized redirect URIs**, clique em **+ Add URI** e cole:
     ```
     https://SEU-PROJETO.supabase.co/auth/v1/callback
     ```
     troque `SEU-PROJETO` pela referência do seu projeto Supabase (você acha
     isso em **Project Settings → General → Reference ID**, ou é o mesmo
     início da sua `SUPABASE_URL`).
   - Clique em **Create**. Vai aparecer uma tela com **Client ID** e **Client
     secret** — deixe essa aba aberta, você vai precisar copiar os dois.

**5.2 — No Supabase**
1. Vá em **Authentication → Providers → Google**.
2. Ative o toggle **Enable Sign in with Google**.
3. Cole o **Client ID** e o **Client Secret** que o Google te deu.
4. Clique em **Save**.

Pronto — o botão **Entrar com Google** no site já vai funcionar. Quando você
(ou qualquer pessoa) clicar nele, a página redireciona pro Google, a pessoa
escolhe a conta, e volta logada automaticamente.

### 6. Pegar suas chaves de API
1. Vá em **Project Settings → API**.
2. Copie a **Project URL** e a chave **anon public**.

### 7. Chaves de API (já colocadas neste projeto)
As chaves do projeto **tyvdtaiyihhaewczpnrf** já estão preenchidas no
`supabase-client.js` (Project URL + anon public). **Nunca** use a chave
`service_role` no front-end — só a `anon`.

Se um dia precisar trocar de projeto, edite `supabase-client.js` ou rode no
console do navegador: `configureSupabase("URL", "CHAVE")`.

### 8. Login direto (sem verificação por e-mail) — configuração usada no beta
No beta, o cadastro entra **direto**: a pessoa cria a conta e já cai logada no
app, sem precisar confirmar nada por e-mail. Para isso, a confirmação fica
**DESLIGADA** no projeto:

- **Authentication → Sign In / Providers → Email** → deixe **"Confirm email" DESMARCADO**
- Clique em **Save**

Com a confirmação desligada, o fluxo é: pessoa preenche nome/e-mail/senha →
clica em "Criar Minha Conta" → o Supabase devolve a sessão na hora → o app
entra direto (e mostra o onboarding de perfil). Simples e sem depender de
caixa de e-mail.

> Se um dia você quiser voltar a pedir confirmação, é só marcar "Confirm email"
> de novo — o app já trata os dois casos sozinho.

Pronto — o site já está 100% funcional com banco de dados real.

---

## Como anexar imagens

**Imagens enviadas pelo usuário** (foto de perfil, foto de produto, capa de notícia,
mídia do feed) já funcionam sozinhas: a pessoa escolhe o arquivo no formulário, o
`db.js` manda pro bucket certo no Supabase Storage e guarda a URL pública na tabela
correspondente. Você não precisa fazer nada além dos passos acima.

**Imagens fixas de layout** (se quiser trocar os gradientes de fundo por fotos reais
nos cards de destaque, por exemplo): crie uma pasta `images/` na raiz do projeto,
coloque os arquivos lá, e troque o `background-image` no `style.css` ou adicione uma
tag `<img src="images/nome-do-arquivo.jpg">` no HTML.

---

## O que está gravando no banco

| Recurso | Tabela | Onde no app |
|---|---|---|
| Foto de perfil + dados do atleta | `profiles` | Onboarding e Perfil → Editar Perfil |
| Produtos à venda + fotos | `products` | Marketplace → Vender Produto |
| Comentários em produtos | `product_comments` | Marketplace → Ver Detalhes |
| Notícias publicadas + capa | `news` | Notícias → Publicar |
| Fotos/vídeos do feed | `media` | Mídia → botão **+** |
| Curtidas na mídia | `media_likes` | Mídia → ícone de coração |
| Treinos e campeonatos | `events` | Agenda (criados pelo admin) |
| Inscrições em eventos | `event_enrollments` | Agenda → Inscrever-se |
| Carrinho de compras | `cart_items` | Marketplace → Carrinho |
| Página personalizável da equipe | `teams` | Equipe (editor do admin / visualização pública) |
| Pedidos de acesso admin (aguardando aprovação do dono) | `admin_requests` | Configurações → Conta |
| Preferências (modo escuro, e-mails, perfil público) | `profiles` | Configurações |

---

## Tipos de conta

O site tem três formas de entrar:

### Conta com e-mail (ou Google) — atleta
Cadastro por e-mail/senha ou pelo botão **Entrar com Google**. Acesso total de
atleta: editar o perfil (foto, nome, descrição, esportes...), publicar e
apagar suas próprias mídias, comentar em produtos, inscrever-se e cancelar
inscrição em treinos/campeonatos, alterar as configurações do site, e comprar
(adicionar/remover itens do carrinho).

- **Cadastro por e-mail:** com a confirmação desligada (configuração do beta,
  passo 8), a pessoa cria a conta e já entra direto — sem verificação.
- **Login com Google:** (opcional, por enquanto desativado no beta) — não
  precisa de confirmação — o Google já validou o e-mail da pessoa antes.

### Conta convidado ("Entrar como Convidado")
É um **login anônimo do Supabase** — não pede e-mail nem senha, mas ainda assim
gera uma sessão real, então o app sabe diferenciar quem é convidado. Essa conta
só pode **ver, assistir e ler**: sem editar perfil, sem publicar ou apagar mídia,
sem comentar, sem se inscrever em eventos, sem mexer nas configurações, sem
comprar ou usar o carrinho. Os botões dessas ações ficam desabilitados (com um
cadeado 🔒) e mostram um aviso pedindo para criar conta. **Isso não muda nada**
em relação a como já funcionava.

### Conta administrador ("Técnico") — precisa da sua aprovação
Não existe cadastro direto como admin. O caminho é:

1. A pessoa cria conta normal (e-mail ou Google) e faz login como atleta.
2. Em **Editar Perfil**, ela escolhe **"Técnico"** como função — aparece um
   aviso explicando que isso ainda não libera nada sozinho.
3. Em **Configurações → Conta**, ela preenche o nome da equipe/mensagem e
   clica em **Enviar Solicitação**. Isso cria uma linha na tabela
   `admin_requests` com status `pending` — a conta continua sendo atleta
   normalmente enquanto isso.
4. **Você** (logado com `alfeu.paula@escola.pr.gov.br`, reconhecido como dono do site)
   vê essa solicitação em **Configurações → Conta**, num painel que só
   aparece pra você, com os botões **Aprovar** e **Recusar**.
5. Se você aprovar, a conta da pessoa vira admin **na hora** — na próxima vez
   que ela abrir o app (ou se ela já estiver com o app aberto, assim que
   recarregar), os recursos de admin aparecem.

Quando a conta vira admin, ela ganha:
- Botão **Criar Evento** na Agenda (treinos/campeonatos), com opção de apagar
  os eventos que ela mesma criou;
- Botão **Publicar** na página de Notícias (isso é exclusivo de admin, pra
  simular um feed oficial da equipe/organização);
- A aba **Equipe** vira um editor: nome, esporte, frase de destaque, descrição,
  localização, contato, logo, imagem de capa e cor principal — tudo isso monta
  a página pública da equipe;
- Um campo extra de **Cargo** no perfil (ex: "Técnico Chefe").

### Sobre o aviso por e-mail pra você
Hoje o aviso de "tem gente pedindo pra virar admin" aparece **dentro do
app**, no painel que só você vê em Configurações → Conta — isso funciona
100% com o que já está configurado, sem precisar de nenhum serviço extra.

Mandar isso também pro seu Gmail automaticamente (tipo uma notificação por
e-mail de verdade) é possível, mas exige um pedaço a mais de infraestrutura
que o Supabase sozinho não faz (enviar e-mail com conteúdo livre não é a
mesma coisa que os e-mails de login/confirmação, que são prontos). Se você
quiser isso no futuro, o caminho é: **Supabase Edge Function** + um serviço
de e-mail como o [Resend](https://resend.com) (tem plano gratuito), disparado
por um **Database Webhook** toda vez que uma linha nova entra em
`admin_requests`. Posso te ajudar a montar isso quando quiser — por enquanto,
o painel dentro do app já resolve o "só eu aprovo" sem depender de mais nada.

### Segurança por trás disso
- A coluna `is_admin` (e também `is_owner`) da tabela `profiles` **não pode
  ser alterada por um `update` comum**, nem pelo próprio dono da linha —
  existe um trigger (`protect_admin_flag`) que trava as duas colunas.
- A única forma de uma conta virar admin é através da função
  `approve_admin_request()`, que só executa se quem está chamando tem
  `is_owner = true` — ou seja, só você.
- A única forma de alguém virar **dono do site** é o e-mail bater exatamente
  com o que está gravado em `handle_new_user()` (passo 2 acima) — não tem
  como pedir, aprovar, nem se autopromover a dono pela interface.
- Tudo isso é verificado **no banco**, não só na tela — mesmo que alguém
  manipule as chamadas do Supabase direto pelo console do navegador, pulando
  a interface, essas regras continuam valendo.

Para o login anônimo funcionar, lembre de ativar **Authentication → Providers →
Anonymous Sign-ins** no seu projeto (passo 4 acima). Para o Google, é o passo 5.

## O que já foi melhorado nesta versão

- **Configuração do Supabase sem dor**: o site detecta chaves em branco/placeholder,
  mostra um **banner amarelo** no topo explicando o que fazer, e as funções do banco
  exibem mensagem clara em vez de quebrar silenciosamente. Dá para configurar por
  arquivo (`supabase-client.js`) ou pelo console (`configureSupabase(...)`).
- **Trava no schema.sql**: o script para com um erro claro se você rodar sem trocar
  o e-mail do dono (não dá mais para esquecer).
- **Fim dos `alert()`**: todas as mensagens agora usam **toasts** bonitos
  (sucesso/erro/aviso/info), não bloqueiam a tela e somem sozinhas.
- **Imagens sem URL não quebram mais**: cards de notícia, produto, equipe e mídia
  mostram um placeholder elegante quando não há imagem (e se a imagem falhar ao
  carregar, também).
- **Notícias com título e resumo**: os cards agora exibem o título real, um trecho
  do conteúdo, autor e data (antes mostravam só a categoria).
- **Modais com acessibilidade**: foco travado dentro do modal (Tab/Shift+Tab),
  fechamento com `Esc`, `role="dialog"`/`aria-modal`, e o resto da página fica
  `inert` enquanto o modal está aberto.
- **Sidebar em gaveta no celular**: no mobile a sidebar vira um drawer com botão
  de menu e backdrop (antes ela cobria o conteúdo sem como fechar).
- **Sessão expirada avisa**: se o token do Supabase expirar, o usuário recebe um
  aviso em vez de falhas silenciosas.
- **Erros traduzidos**: mensagens comuns do Supabase (chave inválida, e-mail não
  confirmado, rate limit, sem conexão) viram avisos em português.
- **Bug corrigido**: o painel do dono do site agora aparece assim que o dono loga
  (antes só aparecia ao reabrir a aba Configurações).
- **Login direto no beta**: sem verificação por e-mail — o cadastro já entra
  logado (guia no passo 8).
- **Skeleton loading**: as grades (notícias, mídia, agenda, marketplace, equipes)
  mostram placeholders animados enquanto carregam, em vez de só um spinner.
- **Busca do Marketplace no banco**: a barra de pesquisa agora consulta o
  Supabase (título, descrição e categoria) com debounce — escala muito melhor
  que filtrar no front-end.
- **Validação de formulários**: títulos/valores obrigatórios conferidos antes de
  enviar, com aviso amigável (eventos, notícias, produtos).
- **Modo Desenvolvedor (dono do site)**: visual diferenciado — badge dourado
  "DESENVOLVEDOR" na sidebar, barra "MODO DESENVOLVEDOR" no topo, borda dourada
  e item exclusivo no menu. Fica óbvio quando você está na conta de dono.
- **Painel do Dono** (menu lateral → "Painel do Dono"):
  - Estatísticas do site (usuários, admins, produtos, notícias, mídias, eventos, equipes, inscrições, pedidos pendentes);
  - Gestão de usuários: **promover** a admin, **revogar** admin e **excluir** conta (com confirmação dupla);
  - Solicitações de administrador (aprovar/recusar) direto no painel;
  - Moderação: apagar qualquer produto, notícia, mídia ou evento da plataforma.
  - Tudo protegido no banco: as funções só executam para o dono (security definer + checagem is_owner).

## Publicar no GitHub Pages
1. Suba todos os arquivos (`.html`, `.css`, `.js`, `.sql`, `.md`) na raiz de um repositório.
2. **Settings → Pages** → branch `main`, pasta `/root` → Save.
3. O site fica em `https://seu-usuario.github.io/nome-do-repo/`.

> ⚠️ Como o arquivo `supabase-client.js` fica público no GitHub, a chave `anon` também
> fica visível — isso é normal e esperado no Supabase (ela é protegida pelas regras de
> RLS do banco, não por estar "escondida"). Só nunca publique a chave `service_role`.
