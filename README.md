# CoreMotion (clone) — com Supabase

Site completo em HTML/CSS/JS puro (sem build, sem framework) com backend real
no Supabase: autenticação, banco de dados e upload de imagens.

## Arquivos
| Arquivo | O que faz |
|---|---|
| `index.html` | Toda a marcação: landing, login/cadastro, onboarding, dashboard e modais |
| `style.css` | Todo o visual |
| `supabase-client.js` | Configuração de conexão com seu projeto Supabase |
| `auth.js` | Login, cadastro, conta de teste (login anônimo), logout |
| `db.js` | Upload de arquivos + leitura/escrita no banco (perfis, produtos, comentários, notícias, mídia) |
| `script.js` | Toda a interação da interface, já ligada ao Supabase |
| `schema.sql` | Script único que cria as tabelas, segurança e buckets de imagem |

---

## Passo a passo — Supabase

### 1. Criar o projeto
1. Crie uma conta em [supabase.com](https://supabase.com) e clique em **New Project**.
2. Espere o projeto terminar de provisionar (1–2 minutos).

### 2. Rodar o banco de dados
1. No menu lateral, abra **SQL Editor** → **New query**.
2. Abra o arquivo `schema.sql` deste projeto, copie **tudo** e cole lá.
3. Clique em **Run**. Isso cria:
   - as tabelas `profiles`, `products`, `product_comments`, `news`, `media`, `media_likes`, `events`, `event_enrollments`, `cart_items`, `teams`, `admin_invite_codes`;
   - as regras de segurança (RLS) — cada um só edita o que é seu, contas convidado não escrevem nada, notícias/eventos/equipes só admin escreve, mas todo mundo lê;
   - os 5 buckets de imagem no Storage (`avatars`, `products`, `news`, `media`, `teams`), já públicos para leitura;
   - 4 eventos de exemplo na Agenda (treinos/campeonatos), só para a tela não ficar vazia — edite ou apague pelo **Table Editor** quando quiser;
   - 1 código de administrador de exemplo (`COREMOTION-ADMIN-2026`) — troque antes de divulgar o projeto.

### 3. Ativar login anônimo (usado pelo botão "Entrar como Convidado")
1. Vá em **Authentication → Providers**.
2. Ative **Anonymous Sign-ins**.
   *(Se não quiser esse botão, pode simplesmente ignorar — só ele vai parar de funcionar.)*

### 4. Pegar suas chaves de API
1. Vá em **Project Settings → API**.
2. Copie a **Project URL** e a chave **anon public**.

### 5. Colar as chaves no projeto
Abra `supabase-client.js` e substitua:
```js
const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
const SUPABASE_ANON_KEY = "SUA-CHAVE-ANON-AQUI";
```
pelos valores copiados no passo 4. **Nunca** use a chave `service_role` no front-end — só a `anon`.

### 6. (Opcional) Desativar confirmação por e-mail
Por padrão o Supabase exige confirmar o e-mail antes do primeiro login. Para testar
mais rápido: **Authentication → Providers → Email → desmarque "Confirm email"**.

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
| Códigos que liberam conta admin | `admin_invite_codes` | Configurações → Conta |
| Preferências (modo escuro, e-mails, perfil público) | `profiles` | Configurações |

---

## Tipos de conta

O site agora tem duas formas de entrar, com permissões bem diferentes:

### Conta com e-mail (cadastro completo)
Acesso total: editar o perfil (foto, nome, descrição, esportes...), publicar e
apagar suas próprias mídias, comentar em produtos, inscrever-se e cancelar
inscrição em treinos/campeonatos, alterar as configurações do site, e comprar
(adicionar/remover itens do carrinho).

### Conta convidado ("Entrar como Convidado")
É um **login anônimo do Supabase** — não pede e-mail nem senha, mas ainda assim
gera uma sessão real, então o app sabe diferenciar quem é convidado. Essa conta
só pode **ver, assistir e ler**: sem editar perfil, sem publicar ou apagar mídia,
sem comentar, sem se inscrever em eventos, sem mexer nas configurações, sem
comprar ou usar o carrinho. Os botões dessas ações ficam desabilitados (com um
cadeado 🔒) e mostram um aviso pedindo para criar conta.

### Conta administrador
Não é um tipo de cadastro separado — **qualquer conta com e-mail pode virar
administradora** digitando um código de convite em **Configurações → Conta**.
Isso é proposital: você (dono do projeto) decide quem recebe o código, em vez
de deixar qualquer pessoa se cadastrar como admin na hora do cadastro.

Quando a conta vira admin, ela ganha:
- Botão **Criar Evento** na Agenda (treinos/campeonatos), com opção de apagar
  os eventos que ela mesma criou;
- Botão **Publicar** na página de Notícias (antes, os atletas também podiam
  publicar notícia — agora isso é só do admin, para simular um feed oficial
  da equipe/organização);
- A aba **Equipe** vira um editor: nome, esporte, frase de destaque, descrição,
  localização, contato, logo, imagem de capa e cor principal — tudo isso monta
  a página pública da equipe, que qualquer pessoa (inclusive convidado) pode
  visualizar e que os atletas usam pra "seguir" uma equipe;
- Um campo extra de **Cargo** no perfil (ex: "Técnico Chefe"), mostrado como
  selo ao lado do nome.

**Como gerar o código de convite:** o `schema.sql` já cria um código de
exemplo, `COREMOTION-ADMIN-2026`, na tabela `admin_invite_codes`. Troque-o (ou
adicione outros) direto pelo **Table Editor** do Supabase antes de divulgar o
projeto — qualquer pessoa com o código digitado em Configurações vira admin.

**Segurança:** a coluna `is_admin` da tabela `profiles` **não pode ser alterada
por um `update` comum**, nem pelo próprio dono da linha — existe um trigger
(`protect_admin_flag`) que trava essa coluna. A única forma de virar admin é
pela função `redeem_admin_code()`, que roda no servidor com privilégio elevado
e confere o código antes de liberar. Ou seja, mesmo alguém manipulando as
chamadas do Supabase pelo navegador não consegue se autopromover sem o código.

**Importante:** essa restrição não é só visual. O `schema.sql` cria uma função
`is_guest()` que lê o token do usuário, e todas as políticas de escrita
(`insert`/`update`) das tabelas exigem `not is_guest()`. Ou seja, mesmo que
alguém tente chamar a API do Supabase diretamente pelo console do navegador,
pulando a interface, o banco recusa a escrita.

Para o login anônimo funcionar, lembre de ativar **Authentication → Providers →
Anonymous Sign-ins** no seu projeto (passo 3 mais abaixo).

## Publicar no GitHub Pages
1. Suba todos os arquivos (`.html`, `.css`, `.js`, `.sql`, `.md`) na raiz de um repositório.
2. **Settings → Pages** → branch `main`, pasta `/root` → Save.
3. O site fica em `https://seu-usuario.github.io/nome-do-repo/`.

> ⚠️ Como o arquivo `supabase-client.js` fica público no GitHub, a chave `anon` também
> fica visível — isso é normal e esperado no Supabase (ela é protegida pelas regras de
> RLS do banco, não por estar "escondida"). Só nunca publique a chave `service_role`.
