/* =========================================================
   TESTE DE INTEGRAÇÃO DA UI — CoreMotion
   ---------------------------------------------------------
   Executa o index.html REAL e todos os .js REAIS dentro do
   jsdom, contra um cliente Supabase simulado em memória.
   Nada aqui reimplementa a lógica do app: quem roda é o
   código de produção.

   Como rodar:
       npm test            (ou: node tests/app.test.mjs)

   Sai com código 1 se qualquer verificação falhar — é isso
   que o CI usa para bloquear o merge.
   ========================================================= */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM, ResourceLoader, VirtualConsole } from "jsdom";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const BASE = "http://localhost:4173/";

/* ---------------- dados de exemplo (em memória) ---------------- */
const now = new Date().toISOString();
const db = {
  profiles: [
    {
      id: "u-owner",
      email: "alfeu.paula@escola.pr.gov.br",
      full_name: "Alfeu Paula",
      role: "Técnico",
      is_admin: true,
      is_owner: true,
      avatar_url: null,
      bio: "Dono do site",
      created_at: now,
    },
    {
      id: "u-atleta",
      email: "ana@exemplo.com",
      full_name: "Ana Souza",
      role: "Atleta",
      is_admin: false,
      is_owner: false,
      avatar_url: null,
      bio: "Judoca",
      created_at: now,
    },
  ],
  events: [
    {
      id: "e1",
      title: "Treino de Judô — Fundamentos",
      type: "treino",
      sport: "Judô",
      description: "Uchi-komi e randori",
      location: "Academia Central",
      event_date: new Date(Date.now() + 864e5).toISOString(),
      creator_id: "u-owner",
    },
    {
      id: "e2",
      title: "Campeonato Estadual",
      type: "campeonato",
      sport: "Judô",
      description: "Categorias sub-18 e adulto",
      location: "Ginásio Municipal",
      event_date: new Date(Date.now() + 7 * 864e5).toISOString(),
      creator_id: "u-owner",
    },
  ],
  news: [
    {
      id: "n1",
      title: "Equipe vence etapa regional",
      category: "Competição",
      content: "A equipe conquistou três medalhas de ouro na etapa regional do circuito.",
      image_url: null,
      author_id: "u-owner",
      created_at: now,
    },
  ],
  media: [
    {
      id: "m1",
      url: null,
      media_type: "image",
      caption: "Treino de ontem 💪",
      user_id: "u-atleta",
      created_at: now,
    },
  ],
  media_likes: [],
  products: [
    {
      id: "p1",
      title: "Kimono de Judô Infantil",
      price: 189.9,
      category: "Judô",
      description: "Kimono reforçado, tamanho 140cm.",
      image_url: null,
      seller_id: "u-atleta",
      created_at: now,
    },
  ],
  product_comments: [],
  cart_items: [],
  event_enrollments: [],
  teams: [
    {
      id: "t1",
      name: "Associação CoreMotion",
      sport: "Judô",
      tagline: "Formando campeões",
      description: "Equipe de judô com treinos diários.",
      location: "Curitiba, PR",
      contact: "contato@coremotion.dev",
      logo_url: null,
      cover_url: null,
      primary_color: "#e5383b",
      admin_id: "u-owner",
      created_at: now,
    },
  ],
  admin_requests: [
    {
      id: "r1",
      user_id: "u-atleta",
      team_name: "Equipe Ana",
      message: "Quero ser técnica",
      status: "pending",
      created_at: now,
    },
  ],
};

/* ---------------- cliente Supabase simulado ---------------- */
const REL = {
  profiles: ["user_id", "author_id", "admin_id", "seller_id", "creator_id"],
  products: ["product_id"],
};

function embed(row, cols) {
  const out = { ...row };
  for (const t of Object.keys(REL)) {
    if (!cols.includes(t)) continue;
    const fk = REL[t].find((c) => row[c] != null && db[t].some((r) => r.id === row[c]));
    out[t] = fk ? (db[t].find((r) => r.id === row[fk]) ?? null) : null;
  }
  return out;
}

let idSeq = 0;
class Query {
  constructor(table) {
    this.table = table;
    this.op = "select";
    this.cols = "*";
    this.filters = [];
    this.orders = [];
    this.limitN = null;
    this.countOpts = null;
    this.singleMode = null;
  }
  select(cols = "*", opts) {
    if (this.op !== "insert" && this.op !== "update") this.op = "select";
    this.cols = cols;
    this.countOpts = opts;
    return this;
  }
  insert(rows) {
    this.op = "insert";
    this.rows = rows;
    return this;
  }
  update(patch) {
    this.op = "update";
    this.patch = patch;
    return this;
  }
  upsert(rows) {
    this.op = "upsert";
    this.rows = rows;
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }
  eq(c, v) {
    this.filters.push(["eq", c, v]);
    return this;
  }
  match(o) {
    for (const [c, v] of Object.entries(o)) this.filters.push(["eq", c, v]);
    return this;
  }
  or(spec) {
    this.filters.push(["or", null, spec]);
    return this;
  }
  order(c, o) {
    this.orders.push([c, o?.ascending !== false]);
    return this;
  }
  limit(n) {
    this.limitN = n;
    return this;
  }
  single() {
    this.singleMode = "single";
    return this;
  }
  maybeSingle() {
    this.singleMode = "maybe";
    return this;
  }
  then(res, rej) {
    return Promise.resolve(this.run()).then(res, rej);
  }

  run() {
    const rows = db[this.table] ?? [];
    const matches = (r) =>
      this.filters.every(([op, c, v]) => {
        if (op === "eq") return String(r[c]) === String(v);
        if (op === "or")
          return String(v)
            .split(",")
            .some((part) => {
              const [col, kind, val] = part.split(".");
              if (kind !== "ilike") return false;
              const needle = val.replace(/%/g, "").toLowerCase();
              return String(r[col] ?? "")
                .toLowerCase()
                .includes(needle);
            });
        return true;
      });

    if (this.op === "insert" || this.op === "upsert") {
      const list = Array.isArray(this.rows) ? this.rows : [this.rows];
      const saved = list.map((r) => {
        if (this.op === "upsert") {
          const i = rows.findIndex((x) => x.id === r.id);
          if (i >= 0) {
            rows[i] = { ...rows[i], ...r };
            return rows[i];
          }
        }
        const row = {
          id: r.id ?? `${this.table[0]}${++idSeq}-${Date.now()}`,
          created_at: now,
          ...r,
        };
        rows.push(row);
        return row;
      });
      return {
        data: this.cols === "*" || this.singleMode ? saved[0] : saved,
        error: null,
        count: saved.length,
      };
    }
    if (this.op === "update") {
      let n = 0;
      for (const r of rows)
        if (matches(r)) {
          Object.assign(r, this.patch);
          n++;
        }
      return {
        data: this.singleMode ? rows.find(matches) : rows.filter(matches),
        error: null,
        count: n,
      };
    }
    if (this.op === "delete") {
      const keep = rows.filter((r) => !matches(r));
      const removed = rows.length - keep.length;
      db[this.table] = keep;
      return { data: null, error: null, count: removed };
    }

    let out = rows.filter(matches);
    for (const [c, asc] of [...this.orders].reverse()) {
      out = [...out].sort((a, b) => (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (asc ? 1 : -1));
    }
    if (this.limitN) out = out.slice(0, this.limitN);
    const mapped = out.map((r) => embed(r, String(this.cols)));
    const count = out.length;
    if (this.singleMode === "single") {
      if (count !== 1)
        return {
          data: null,
          error: { message: "JSON object requested, multiple (or no) rows returned" },
          count,
        };
      return { data: mapped[0], error: null, count };
    }
    if (this.singleMode === "maybe") return { data: mapped[0] ?? null, error: null, count };
    if (this.countOpts?.head) return { data: null, error: null, count };
    return { data: mapped, error: null, count };
  }
}

const listeners = new Set();
let session = null;
// o app registra: onAuthStateChange((event, session) => callback(session, event))
const emit = (event) => listeners.forEach((cb) => cb(event, session));

const authUsers = {
  "alfeu.paula@escola.pr.gov.br": { id: "u-owner", senha: "Senha123" },
  "ana@exemplo.com": { id: "u-atleta", senha: "Senha123" },
};

const client = {
  from: (t) => new Query(t),
  rpc: async (fn, args) => {
    if (fn === "get_site_stats")
      return {
        data: {
          users: db.profiles.length,
          admins: db.profiles.filter((p) => p.is_admin).length,
          pending_requests: db.admin_requests.filter((r) => r.status === "pending").length,
          products: db.products.length,
          news: db.news.length,
          media: db.media.length,
          events: db.events.length,
          teams: db.teams.length,
          enrollments: db.event_enrollments.length,
          cart_items: db.cart_items.length,
        },
        error: null,
      };
    if (fn === "get_all_users") return { data: db.profiles, error: null };
    if (fn === "request_admin_access") {
      db.admin_requests.push({
        id: "r" + Date.now(),
        user_id: session?.user.id,
        status: "pending",
        created_at: now,
        ...args,
      });
      return { data: true, error: null };
    }
    if (fn === "grant_admin_access") {
      db.profiles.find((p) => p.id === args.target_user).is_admin = true;
      return { data: true, error: null };
    }
    return { data: true, error: null };
  },
  storage: {
    from: () => ({
      upload: async () => ({ error: null }),
      getPublicUrl: (p) => ({ data: { publicUrl: "https://mock.storage/" + p } }),
    }),
  },
  auth: {
    signUp: async ({ email, options }) => {
      const id = "u-" + Date.now();
      db.profiles.push({
        id,
        email,
        full_name: options?.data?.full_name || "Novo Atleta",
        is_admin: false,
        is_owner: false,
        created_at: now,
      });
      authUsers[email] = { id, senha: "Senha123" };
      session = { user: { id, email, is_anonymous: false, app_metadata: { provider: "email" } } };
      emit("SIGNED_UP");
      emit("SIGNED_IN");
      return { data: { session, user: session.user }, error: null };
    },
    signInWithPassword: async ({ email }) => {
      const u = authUsers[email];
      if (!u) return { data: null, error: { message: "Invalid login credentials" } };
      session = {
        user: { id: u.id, email, is_anonymous: false, app_metadata: { provider: "email" } },
      };
      emit("SIGNED_IN");
      return { data: { session, user: session.user }, error: null };
    },
    signInAnonymously: async () => {
      const id = "guest-" + Date.now();
      session = {
        user: { id, email: null, is_anonymous: true, app_metadata: { provider: "anonymous" } },
      };
      emit("SIGNED_IN");
      return { data: { session, user: session.user }, error: null };
    },
    signOut: async () => {
      session = null;
      emit("SIGNED_OUT");
      return { error: null };
    },
    getSession: async () => ({ data: { session }, error: null }),
    onAuthStateChange: (cb) => {
      listeners.add(cb);
      return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
    },
    signInWithOAuth: async () => ({ error: null }),
    resetPasswordForEmail: async () => ({ data: {}, error: null }),
    updateUser: async () => ({ data: {}, error: null }),
  },
};

/* ---------------- jsdom ---------------- */
const skipped = [];
class LocalLoader extends ResourceLoader {
  fetch(url) {
    if (!url.startsWith(BASE)) {
      skipped.push(url);
      return null;
    } // CDN externo: ignora
    const rel = decodeURIComponent(url.slice(BASE.length).split("?")[0]);
    const file = path.join(ROOT, rel || "index.html");
    if (!fs.existsSync(file)) {
      skipped.push("404 local: " + rel);
      return null;
    }
    return Promise.resolve(fs.readFileSync(file));
  }
}

const problems = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => problems.push("jsdomError: " + (e.detail?.stack || e.message || e)));
vc.on("error", (...a) => problems.push("console.error: " + a.join(" ")));

const dom = new JSDOM(fs.readFileSync(path.join(ROOT, "index.html"), "utf8"), {
  url: BASE,
  runScripts: "dangerously",
  resources: new LocalLoader(),
  pretendToBeVisual: true,
  virtualConsole: vc,
});
const { window } = dom;
window.supabase = { createClient: () => client }; // substitui o CDN do supabase-js
window.scrollTo = () => {};
window.confirm = () => true;
window.URL.createObjectURL = () => "blob:mock";
window.addEventListener("unhandledrejection", (e) =>
  problems.push("unhandledrejection: " + (e.reason?.stack || e.reason))
);

const ok = [],
  bad = [];
const oneLine = (t) =>
  String(t ?? "")
    .replace(/\s+/g, " ")
    .trim();
const check = (label, cond, extra = "") =>
  (cond ? ok : bad).push(`${cond ? "✔" : "✘"} ${label}${extra ? " — " + oneLine(extra) : ""}`);
const tick = (ms = 120) => new Promise((r) => setTimeout(r, ms));
const $ = (sel) => window.document.querySelector(sel);
const $$ = (sel) => [...window.document.querySelectorAll(sel)];
const hidden = (sel) => $(sel)?.classList.contains("hidden");

await new Promise((r) => window.addEventListener("load", r));
await tick(250);

/* ---- 1. boot ---- */
check("nenhum erro durante o boot", problems.length === 0, problems.slice(0, 4).join(" | "));
check("configuração do Supabase carregada", window.SUPABASE_CONFIGURED === true);
check(
  "origem da configuração é válida",
  ["arquivo", "local", "localStorage"].includes(window.SUPABASE_CONFIG_SOURCE),
  window.SUPABASE_CONFIG_SOURCE
);
check("banner de 'não configurado' fica escondido", hidden("#setup-banner"));
check("landing visível no boot", !hidden("#page-landing"));
check("dashboard escondido no boot", hidden("#page-dashboard"));
check(
  "ícones SVG renderizados",
  $$("#page-landing svg").length > 0,
  `${$$("#page-landing svg").length} svg`
);
check(
  "CDN externo ignorado no teste",
  skipped.some((u) => u.includes("jsdelivr")),
  skipped.filter((u) => u.includes("jsdelivr")).join(" | ")
);

/* ---- 2. login como convidado (botão real) ---- */
const guestBtn = window.document.getElementById("btn-conta-teste");
check("botão 'Entrar como Convidado' existe", !!guestBtn, guestBtn?.textContent?.trim());
guestBtn?.click();
await tick(350);
check("convidado: dashboard aberto", !hidden("#page-dashboard"));
check(
  "convidado: perfil mostra 'Convidado'",
  $("#profile-name")?.textContent === "Convidado",
  $("#profile-name")?.textContent
);

/* ---- 3. todas as telas como convidado ---- */
for (const view of ["noticias", "midia", "agenda", "marketplace", "equipe", "perfil", "config"]) {
  window.switchView(view);
  await tick(280);
  const panel = $(`#view-${view}`);
  const loaderEl = panel?.querySelector("[data-loader]");
  const loaderStuck = !!loaderEl && !loaderEl.classList.contains("hidden");
  check(
    `tela '${view}' renderiza sem travar no loader`,
    !!panel && !loaderStuck,
    loaderEl ? "" : "(sem loader nessa tela)"
  );
}
check(
  "agenda: cards de evento",
  $$("#events-grid .event-card").length === 2,
  `${$$("#events-grid .event-card").length} cards`
);
check("notícias: cards", $$("#noticias-grid .news-card").length === 1);
check("mídia: tiles", $$("#midia-grid .media-tile").length === 1);
check("marketplace: produtos", $$("#produtos-grid .product-card").length === 1);
check("equipes: cards", $$("#teams-grid .team-card").length === 1);
check(
  "convidado não se inscreve (botão travado)",
  $("#events-grid .event-enroll-btn")?.disabled === true
);

const tg = $("#toggle-dark");
tg.checked = true;
tg.dispatchEvent(new window.Event("change", { bubbles: true }));
await tick(180);
check(
  "convidado bloqueado mostra toast de aviso",
  /exige uma conta/i.test($("#toast-root")?.textContent || ""),
  $("#toast-root")?.textContent?.trim().slice(0, 70)
);
check("toggle do convidado volta ao estado anterior", tg.checked === false);

/* ---- 4. logout + login como dono (formulário real) ---- */
$("#btn-logout").click();
await tick(280);
check("logout: volta para a landing", !hidden("#page-landing") && hidden("#page-dashboard"));

window.openAuth("entrar");
$("#login-email").value = "alfeu.paula@escola.pr.gov.br";
$("#login-senha").value = "Senha123";
$("#form-entrar").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
await tick(450);
check("login por e-mail: dashboard aberto", !hidden("#page-dashboard"));
check("dono: item 'Painel do Dono' visível", !hidden("#side-painel"));
check(
  "dono: nome no perfil",
  $("#profile-name")?.textContent === "Alfeu Paula",
  $("#profile-name")?.textContent
);

/* ---- 5. painel do dono ---- */
window.switchView("painel");
await tick(450);
check(
  "painel: estatísticas",
  $$("#painel-stats .stat-card").length === 10,
  `${$$("#painel-stats .stat-card").length} cards`
);
check(
  "painel: tabela de usuários",
  $$("#painel-users-body tr").length >= 2,
  `${$$("#painel-users-body tr").length} linhas`
);
check("painel: pedidos pendentes listados", $$("#painel-requests-list button").length > 0);

/* ---- 6. escrita real: inscrição em evento ---- */
window.switchView("agenda");
await tick(320);
$("#events-grid .event-enroll-btn")?.click();
await tick(320);
check(
  "inscrição em evento gravada",
  db.event_enrollments.length === 1,
  JSON.stringify(db.event_enrollments)
);

/* ---- 7. escrita real: abrir produto e adicionar ao carrinho (via UI) ---- */
window.switchView("marketplace");
await tick(280);
$(`[data-open-produto="p1"]`).click();
await tick(280);
check(
  "modal de produto abre com os dados",
  !hidden("#modal-produto-detalhe") &&
    $("#detalhe-titulo")?.textContent === "Kimono de Judô Infantil",
  $("#detalhe-titulo")?.textContent
);
$("#toast-root").innerHTML = "";
$("#btn-add-carrinho").click();
await tick(280);
check(
  "carrinho: item adicionado",
  db.cart_items.length === 1 && db.cart_items[0].quantity === 1,
  JSON.stringify(db.cart_items)
);
check(
  "toast de sucesso aparece",
  /adicionado ao carrinho/i.test($("#toast-root")?.textContent || ""),
  $("#toast-root")?.textContent?.trim().slice(0, 60)
);
check(
  "badge do carrinho atualizado",
  $("#cart-badge")?.textContent === "1",
  $("#cart-badge")?.textContent
);
$("#btn-add-carrinho").click();
await tick(280);
check(
  "carrinho: quantidade incrementada (2)",
  db.cart_items[0]?.quantity === 2,
  JSON.stringify(db.cart_items)
);

/* ---- 8. comentário em produto (formulário) ---- */
$("#comentario-input").value = "Produto ótimo!";
$("#form-comentario").dispatchEvent(
  new window.Event("submit", { bubbles: true, cancelable: true })
);
await tick(320);
check(
  "comentário gravado no banco",
  db.product_comments.length === 1,
  JSON.stringify(db.product_comments)
);

/* ---- 8b. XSS: helpers + comentário malicioso viram texto, não HTML ---- */
check("safeUrl bloqueia javascript:", window.eval('safeUrl("javascript:alert(1)")') === "");
check(
  "safeUrl aceita https",
  window.eval('safeUrl("https://ex.com/a.png")') === "https://ex.com/a.png"
);
check(
  "safeColor bloqueia injeção CSS",
  window.eval('safeColor("red; } body{background:red}")') === "#e5383b"
);
check("safeColor aceita hex", window.eval('safeColor("#12ab34")') === "#12ab34");
$("#comentario-input").value =
  '<img src=x onerror="window.__xss=1"> <scr' + "ipt>window.__xss=1</scr" + "ipt>";
$("#form-comentario").dispatchEvent(
  new window.Event("submit", { bubbles: true, cancelable: true })
);
await tick(320);
const xssNodes = $("#detalhe-comentarios").querySelectorAll("img, script").length;
check(
  "XSS: comentário malicioso não cria <img>/<script>",
  xssNodes === 0,
  `${xssNodes} nós perigosos`
);
check(
  "XSS: payload aparece como texto visível",
  ($("#detalhe-comentarios").textContent || "").includes("onerror")
);
check("XSS: nenhum código executado", window.__xss === undefined);

/* ---- 9. busca do marketplace (input real, com debounce) ---- */
const search = $("#marketplace-search");
search.value = "kimono";
search.dispatchEvent(new window.Event("input", { bubbles: true }));
await tick(650);
check(
  "busca por 'kimono' encontra 1 produto",
  $$("#produtos-grid .product-card").length === 1,
  `${$$("#produtos-grid .product-card").length}`
);
search.value = "zzzz";
search.dispatchEvent(new window.Event("input", { bubbles: true }));
await tick(650);
check(
  "busca sem resultado mostra estado vazio",
  !hidden("#view-marketplace [data-empty]"),
  $("#view-marketplace [data-empty]")?.textContent?.trim()
);

/* ---- 10b. validação de upload (B2) ---- */
window.__up = {
  big: { type: "image/png", size: 10 * 1024 * 1024, name: "x.png" },
  exe: { type: "application/x-msdownload", size: 1000, name: "virus.exe" },
  okImg: { type: "image/png", size: 1000, name: "foto.PNG" },
  vid: { type: "video/mp4", size: 1000, name: "v.mp4" },
};
check(
  "upload: imagem >5 MB rejeitada",
  window.eval("validateUpload('avatars', __up.big).ok") === false
);
check(
  "upload: executável rejeitado",
  window.eval("validateUpload('avatars', __up.exe).ok") === false
);
check(
  "upload: imagem válida aceita",
  window.eval("validateUpload('avatars', __up.okImg).ok") === true
);
check(
  "upload: vídeo só no bucket media",
  window.eval("validateUpload('avatars', __up.vid).ok") === false &&
    window.eval("validateUpload('media', __up.vid).ok") === true
);

/* ---- 10c. rate limit no login/cadastro (B7) ---- */
window.eval("rateLimit('rl-h',3,60000);rateLimit('rl-h',3,60000);rateLimit('rl-h',3,60000)");
check(
  "rate limit: bloqueia após 3 tentativas",
  window.eval("rateLimit('rl-h',3,60000).ok") === false
);
check("rate limit: informa retryIn", window.eval("rateLimit('rl-h',3,60000).retryIn") > 0);

/* ---- 10d. validação de formulário ligada (B6) ---- */
window.eval('document.getElementById("login-senha").value = "Abc12345"');
window.eval('document.getElementById("login-email").value = "nao-eh-email"');
check("B6: e-mail inválido é reprovado", window.eval('validateForm("form-entrar").ok') === false);
window.eval('document.getElementById("login-email").value = "ok@email.com"');
check("B6: e-mail válido é aprovado", window.eval('validateForm("form-entrar").ok') === true);
window.eval('document.getElementById("ob-nome").value = ""');
check(
  "B6: onboarding sem nome é reprovado",
  window.eval('validateForm("onboarding").ok') === false
);
window.eval('document.getElementById("ob-nome").value = "Maria Silva"');
check("B6: onboarding com nome é aprovado", window.eval('validateForm("onboarding").ok') === true);

/* ---- 10. nenhum erro acumulado durante todo o fluxo ---- */
check(
  "nenhum erro de console/rejeição em todo o fluxo",
  problems.length === 0,
  problems.slice(0, 3).join(" | ")
);

/* ---- resultado ---- */
console.log("\n===== CoreMotion — teste de integração da UI (jsdom) =====");
ok.forEach((l) => console.log(l));
if (bad.length) {
  console.log("\n--- FALHAS ---");
  bad.forEach((l) => console.log(l));
}
console.log(`\n${ok.length} ok / ${bad.length} falhas`);
if (problems.length) {
  console.log("\n--- erros de console/jsdom ---");
  problems.forEach((p) => console.log(p));
}
process.exit(bad.length ? 1 : 0);
