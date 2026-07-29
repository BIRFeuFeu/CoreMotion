/* =========================================================
   ICON LIBRARY (inline SVG, no external dependencies)
   ========================================================= */
const ICONS = {
  home: `<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>`,
  newspaper: `<rect x="3" y="5" width="14" height="16" rx="2"/><path d="M17 9h4v9a2 2 0 0 1-2 2h-2"/><line x1="7" y1="9" x2="13" y2="9"/><line x1="7" y1="13" x2="13" y2="13"/><line x1="7" y1="17" x2="11" y2="17"/>`,
  film: `<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="4" x2="7" y2="20"/><line x1="17" y1="4" x2="17" y2="20"/><line x1="3" y1="9" x2="7" y2="9"/><line x1="17" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="7" y2="15"/><line x1="17" y1="15" x2="21" y2="15"/>`,
  calendar: `<rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/>`,
  "shopping-bag": `<path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>`,
  user: `<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>`,
  settings: `<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9c.6.5 1.3.9 2 1.2L10 21h4l.6-2.6c.7-.3 1.4-.7 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/>`,
  "chevron-right": `<polyline points="9 6 15 12 9 18"/>`,
  "shield-alert": `<path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="16.3" r="0.6" fill="currentColor" stroke="none"/>`,
  "log-out": `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>`,
  mail: `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 6l9 7 9-7"/>`,
  lock: `<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>`,
  eye: `<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>`,
  camera: `<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/>`,
  trophy: `<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 5H4v2a4 4 0 0 0 4 4"/><path d="M16 5h4v2a4 4 0 0 1-4 4"/><line x1="12" y1="13" x2="12" y2="16"/><path d="M9 17h6l1 4H8l1-4z"/>`,
  users: `<circle cx="9" cy="8" r="3"/><path d="M2.5 20c0-3 3-5 6.5-5s6.5 2 6.5 5"/><circle cx="17" cy="8" r="2.3"/><path d="M15.5 13.3c2 .4 4 2 4.5 4.7"/>`,
  shield: `<path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z"/>`,
  globe: `<circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>`,
  "arrow-right": `<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>`,
  search: `<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/>`,
  cart: `<circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 3h3l2.5 12.5a2 2 0 0 0 2 1.5h8a2 2 0 0 0 2-1.5L22 7H6"/>`,
  plus: `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`,
  play: `<polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none"/>`,
  "alert-triangle": `<path d="M12 3l10 18H2L12 3z"/><line x1="12" y1="9" x2="12" y2="14"/><circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none"/>`,
  "alert-circle": `<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16" r="0.6" fill="currentColor" stroke="none"/>`,
  "x-circle": `<circle cx="12" cy="12" r="9"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/>`,
  "check-circle": `<circle cx="12" cy="12" r="9"/><polyline points="8 12 11 15 16 9"/>`,
  building: `<rect x="4" y="3" width="16" height="18"/><line x1="9" y1="7" x2="9" y2="7.01"/><line x1="15" y1="7" x2="15" y2="7.01"/><line x1="9" y1="11" x2="9" y2="11.01"/><line x1="15" y1="11" x2="15" y2="11.01"/><line x1="9" y1="15" x2="15" y2="15"/>`,
  graduation: `<path d="M12 3L2 8l10 5 10-5-10-5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>`,
  "cross-swords": `<line x1="4" y1="20" x2="20" y2="4"/><line x1="20" y1="20" x2="4" y2="4"/>`,
  sparkle: `<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" fill="currentColor" stroke="none"/>`,
  heart: `<path d="M12 21s-7-4.5-9.5-9C1 8 2.5 4 6.5 4c2 0 3.5 1.2 4.5 2.7C12 5.2 13.5 4 15.5 4 19.5 4 21 8 21 12c-2.5 4.5-9.5 9-9.5 9z"/>`,
  message: `<path d="M4 4h16v12H8l-4 4V4z"/>`,
};

function renderIcons(root = document){
  root.querySelectorAll("[data-icon]").forEach(el => {
    const name = el.getAttribute("data-icon");
    if(!ICONS[name] || el.dataset.iconRendered) return;
    el.innerHTML = `<svg viewBox="0 0 24 24">${ICONS[name]}</svg>`;
    el.dataset.iconRendered = "true";
  });
}
renderIcons();

/* =========================================================
   ESTADO GLOBAL
   ========================================================= */
let currentUser = null;    // objeto de sessão do Supabase Auth
let currentProfile = null; // linha da tabela profiles
let activeProductId = null; // produto aberto no modal de detalhes
let isGuest = false;        // true = conta convidado (login anônimo)

/* Bloqueia uma ação para contas convidado. Retorna true se bloqueou. */
function guestBlock(){
  if(isGuest){
    alert("Essa ação exige uma conta com e-mail. Crie uma conta gratuita para continuar.");
    return true;
  }
  if(!currentUser){
    alert("Faça login para continuar.");
    return true;
  }
  return false;
}

/* Aplica as restrições visuais de acordo com o tipo de conta */
function applyAccountTypeToUI(){
  document.getElementById("sidebar-guest-badge").classList.toggle("hidden", !isGuest);
  document.getElementById("perfil-guest-banner").classList.toggle("hidden", !isGuest);
  document.getElementById("agenda-guest-banner").classList.toggle("hidden", !isGuest);

  // Botões/ações que exigem conta com e-mail
  const restrictedButtons = [
    "btn-editar-perfil", "btn-nova-noticia", "fab-midia", "btn-vender-produto"
  ];
  restrictedButtons.forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.disabled = isGuest;
    el.classList.toggle("locked", isGuest);
    el.title = isGuest ? "Disponível só para contas com e-mail" : "";
  });

  // Configurações só podem ser alteradas por conta com e-mail
  ["toggle-dark", "toggle-marketing", "toggle-public"].forEach(id=>{
    document.getElementById(id).disabled = isGuest;
  });

  // Comentários
  const commentInput = document.getElementById("comentario-input");
  const commentBtn = document.querySelector("#form-comentario button[type=submit]");
  commentInput.disabled = isGuest;
  commentBtn.disabled = isGuest;
  commentInput.placeholder = isGuest ? "Crie uma conta para comentar" : "Escreva um comentário...";
}

/* =========================================================
   LANDING PAGE TABS
   ========================================================= */
function setLandingTab(tab){
  document.querySelectorAll("[data-panel]").forEach(p => {
    p.classList.toggle("hidden", p.id !== `tab-${tab}`);
  });
  document.querySelectorAll(".nav-link, .pill-tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
}
document.querySelectorAll(".nav-link, .pill-tab").forEach(btn => {
  btn.addEventListener("click", e => {
    e.preventDefault();
    setLandingTab(btn.dataset.tab);
  });
});
document.getElementById("btn-demo").addEventListener("click", () => setLandingTab("comunidade"));

/* =========================================================
   HELPERS DE MODAL GENÉRICOS
   ========================================================= */
function openOverlay(id){
  document.getElementById(id).classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
function closeOverlay(id){
  document.getElementById(id).classList.add("hidden");
  document.body.style.overflow = "";
}
document.querySelectorAll("[data-close-simple]").forEach(btn=>{
  btn.addEventListener("click", ()=> btn.closest(".overlay").classList.add("hidden"));
});

function showFormError(id, message){
  const el = document.getElementById(id);
  el.textContent = message;
  el.classList.remove("hidden");
}
function hideFormError(id){
  document.getElementById(id).classList.add("hidden");
}

/* =========================================================
   AUTH MODAL (login / cadastro)
   ========================================================= */
const modalAuth = document.getElementById("modal-auth");

function openAuth(tab){
  openOverlay("modal-auth");
  setAuthTab(tab || "entrar");
}
function closeAuth(){ closeOverlay("modal-auth"); }
function setAuthTab(tab){
  document.querySelectorAll("[data-auth-panel]").forEach(p=>{
    p.classList.toggle("hidden", p.id !== `form-${tab}`);
  });
  document.querySelectorAll(".switch-tab").forEach(b=>{
    b.classList.toggle("active", b.dataset.authTab === tab);
  });
}
document.querySelectorAll("[data-open-auth]").forEach(btn=>{
  btn.addEventListener("click", e=>{ e.preventDefault(); openAuth(btn.dataset.openAuth); });
});
document.querySelectorAll(".switch-tab").forEach(btn=>{
  btn.addEventListener("click", ()=> setAuthTab(btn.dataset.authTab));
});
document.getElementById("close-auth").addEventListener("click", closeAuth);
modalAuth.addEventListener("click", e=>{ if(e.target === modalAuth) closeAuth(); });

document.querySelectorAll(".show-pass").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const input = btn.previousElementSibling;
    input.type = input.type === "password" ? "text" : "password";
  });
});

/* checklist de força de senha ao vivo */
const signupSenha = document.getElementById("signup-senha");
signupSenha.addEventListener("input", ()=>{
  const v = signupSenha.value;
  updateReq("req-len", v.length >= 6);
  updateReq("req-num", /\d/.test(v));
  updateReq("req-upper", /[A-Z]/.test(v));
});
function updateReq(id, ok){
  const el = document.getElementById(id);
  el.classList.toggle("ok", ok);
  const iconWrap = el.querySelector(".icon-inline");
  iconWrap.dataset.icon = ok ? "check-circle" : "x-circle";
  iconWrap.dataset.iconRendered = "";
  renderIcons(el);
}

/* ---- LOGIN real via Supabase ---- */
document.getElementById("form-entrar").addEventListener("submit", async e=>{
  e.preventDefault();
  hideFormError("login-error");
  const email = document.getElementById("login-email").value.trim();
  const senha = document.getElementById("login-senha").value;
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  try{
    await authSignIn(email, senha);
    // onAuthStateChange cuida do resto (fecha modal, carrega app)
  }catch(err){
    showFormError("login-error", traduzErro(err.message));
  }finally{
    btn.disabled = false;
  }
});

/* ---- CADASTRO real via Supabase ---- */
document.getElementById("form-criar").addEventListener("submit", async e=>{
  e.preventDefault();
  hideFormError("signup-error");
  const nome = document.getElementById("signup-nome").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const senha = document.getElementById("signup-senha").value;
  const confirma = document.getElementById("signup-senha-confirma").value;

  if(senha !== confirma){
    showFormError("signup-error", "As senhas não coincidem.");
    return;
  }
  if(senha.length < 6 || !/\d/.test(senha) || !/[A-Z]/.test(senha)){
    showFormError("signup-error", "A senha não atende aos requisitos mínimos.");
    return;
  }

  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  try{
    const data = await authSignUp(email, senha, nome);
    if(!data.session){
      showFormError("signup-error", "Conta criada! Verifique seu e-mail para confirmar o cadastro antes de entrar.");
    }
    // Se a confirmação por e-mail estiver desativada no projeto,
    // o Supabase já devolve sessão e onAuthStateChange loga automaticamente.
  }catch(err){
    showFormError("signup-error", traduzErro(err.message));
  }finally{
    btn.disabled = false;
  }
});

/* ---- CONTA DE TESTE (login anônimo do Supabase) ---- */
document.getElementById("btn-conta-teste").addEventListener("click", async ()=>{
  try{
    await authSignInTeste();
  }catch(err){
    alert("Não foi possível entrar com a conta de teste: " + err.message +
      "\n\nAtive 'Anonymous Sign-ins' em Authentication > Providers no seu projeto Supabase.");
  }
});

function traduzErro(msg){
  if(/invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if(/already registered/i.test(msg)) return "Este e-mail já está cadastrado.";
  return msg;
}

/* =========================================================
   SESSÃO — reage a login/logout em qualquer parte do app
   ========================================================= */
authOnChange(async (session)=>{
  currentUser = session ? session.user : null;
  isGuest = authIsGuest(currentUser);

  if(currentUser){
    closeAuth();
    document.getElementById("page-landing").classList.add("hidden");
    document.getElementById("page-dashboard").classList.remove("hidden");
    document.body.style.overflow = "";
    applyAccountTypeToUI();

    try{
      currentProfile = await dbGetProfile(currentUser.id);
    }catch{
      currentProfile = null;
    }

    if(isGuest){
      // Convidado nunca passa pelo onboarding — perfil fixo, somente leitura.
      applyProfileToUI(currentProfile || {});
      document.getElementById("profile-name").textContent = "Convidado";
      document.getElementById("profile-role").textContent = "Visitante";
      switchView("inicio");
    }else if(!currentProfile || !currentProfile.full_name || currentProfile.full_name === "Novo Atleta"){
      openOverlay("modal-onboarding");
    }else{
      applyProfileToUI(currentProfile);
      switchView("inicio");
    }

    if(!isGuest) updateCartBadge();
  }else{
    document.getElementById("page-dashboard").classList.add("hidden");
    document.getElementById("page-landing").classList.remove("hidden");
  }
});

// Ao carregar a página, verifica se já existe uma sessão salva
(async ()=>{
  const session = await authGetSession();
  if(session){
    currentUser = session.user;
  }
})();

/* =========================================================
   ONBOARDING (cria/edita o perfil na tabela profiles)
   ========================================================= */
let selectedRole = "Atleta";
let selectedSports = ["Judô"];
let onboardAvatarFile = null;

document.querySelectorAll(".role-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".role-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    selectedRole = btn.dataset.role;
  });
});
document.querySelectorAll(".sport-chip").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    btn.classList.toggle("active");
    const sport = btn.dataset.sport;
    if(btn.classList.contains("active")){
      if(!selectedSports.includes(sport)) selectedSports.push(sport);
    }else{
      selectedSports = selectedSports.filter(s=>s!==sport);
    }
  });
});

document.getElementById("ob-avatar-btn").addEventListener("click", ()=>{
  document.getElementById("ob-avatar-input").click();
});
document.getElementById("ob-avatar-input").addEventListener("change", e=>{
  const file = e.target.files[0];
  if(!file) return;
  onboardAvatarFile = file;
  const preview = document.getElementById("ob-avatar-preview");
  preview.style.backgroundImage = `url(${URL.createObjectURL(file)})`;
  preview.style.backgroundSize = "cover";
  preview.style.backgroundPosition = "center";
  preview.innerHTML = "";
});

document.getElementById("btn-concluir-cadastro").addEventListener("click", async ()=>{
  if(!currentUser){ alert("Sessão expirada, faça login novamente."); return; }
  const btn = document.getElementById("btn-concluir-cadastro");
  btn.disabled = true;
  btn.textContent = "SALVANDO...";

  try{
    let avatar_url = currentProfile ? currentProfile.avatar_url : null;
    if(onboardAvatarFile){
      avatar_url = await uploadFile("avatars", onboardAvatarFile, currentUser.id);
    }

    const profile = {
      id: currentUser.id,
      full_name: document.getElementById("ob-nome").value.trim() || "Atleta CoreMotion",
      contact: document.getElementById("ob-contato").value.trim(),
      role: selectedRole,
      club: document.getElementById("ob-clube").value.trim(),
      graduation: document.getElementById("ob-graduacao").value.trim(),
      medals: document.getElementById("ob-medalhas").value.trim(),
      championships: document.getElementById("ob-campeonatos").value.trim(),
      sports: selectedSports,
      avatar_url
    };

    await dbUpsertProfile(profile);
    currentProfile = await dbGetProfile(currentUser.id);
    applyProfileToUI(currentProfile);

    closeOverlay("modal-onboarding");
    switchView("inicio");
  }catch(err){
    alert("Erro ao salvar perfil: " + err.message);
  }finally{
    btn.disabled = false;
    btn.textContent = "CONCLUIR CADASTRO";
  }
});

/* Preenche a UI (Perfil + sidebar) com os dados vindos do banco */
function applyProfileToUI(profile){
  if(!profile) return;
  document.getElementById("profile-name").textContent = profile.full_name || "Atleta CoreMotion";
  document.getElementById("profile-role").textContent = profile.role || "Atleta";
  document.getElementById("profile-sport").textContent = (profile.sports && profile.sports[0]) || "—";
  document.getElementById("info-medalhas").textContent = profile.medals || "—";
  document.getElementById("info-campeonatos").textContent = profile.championships || "—";
  document.getElementById("info-clube").textContent = profile.club || "—";
  document.getElementById("info-graduacao").textContent = profile.graduation || "—";
  document.getElementById("info-contato").textContent = profile.contact || "—";

  const avatarEls = [document.getElementById("profile-avatar"), document.getElementById("ob-avatar-preview")];
  avatarEls.forEach(el=>{
    if(!el) return;
    if(profile.avatar_url){
      el.style.backgroundImage = `url(${profile.avatar_url})`;
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
      el.innerHTML = "";
    }
  });

  document.getElementById("toggle-dark").checked = !!profile.dark_mode;
  document.getElementById("toggle-marketing").checked = !!profile.marketing_emails;
  document.getElementById("toggle-public").checked = profile.public_profile !== false;
  dashboardRoot.classList.toggle("dark-mode", !!profile.dark_mode);
}

/* Botão "Editar Perfil" reabre o onboarding pré-preenchido */
document.getElementById("btn-editar-perfil").addEventListener("click", ()=>{
  if(guestBlock()) return;
  if(!currentProfile) return;
  document.getElementById("ob-nome").value = currentProfile.full_name || "";
  document.getElementById("ob-contato").value = currentProfile.contact || "";
  document.getElementById("ob-clube").value = currentProfile.club || "";
  document.getElementById("ob-graduacao").value = currentProfile.graduation || "";
  document.getElementById("ob-medalhas").value = currentProfile.medals || "";
  document.getElementById("ob-campeonatos").value = currentProfile.championships || "";

  selectedRole = currentProfile.role || "Atleta";
  document.querySelectorAll(".role-btn").forEach(b=> b.classList.toggle("active", b.dataset.role === selectedRole));

  selectedSports = currentProfile.sports && currentProfile.sports.length ? [...currentProfile.sports] : ["Judô"];
  document.querySelectorAll(".sport-chip").forEach(b=> b.classList.toggle("active", selectedSports.includes(b.dataset.sport)));

  openOverlay("modal-onboarding");
});

/* =========================================================
   SIDEBAR / NAVEGAÇÃO DO DASHBOARD
   ========================================================= */
const dashboardRoot = document.getElementById("page-dashboard");
const sidebar = document.getElementById("sidebar");

function switchView(view){
  document.querySelectorAll("[data-view-panel]").forEach(p=>{
    p.classList.toggle("hidden", p.id !== `view-${view}`);
  });
  document.querySelectorAll(".side-item[data-view]").forEach(btn=>{
    btn.classList.toggle("active", btn.dataset.view === view);
  });
  if(view === "noticias") loadNoticias();
  if(view === "midia") loadMidia();
  if(view === "agenda") loadEventos();
  if(view === "marketplace") loadProdutos();
}
document.querySelectorAll(".side-item[data-view]").forEach(btn=>{
  btn.addEventListener("click", ()=> switchView(btn.dataset.view));
});
document.querySelectorAll("[data-view-link]").forEach(btn=>{
  btn.addEventListener("click", ()=> switchView(btn.dataset.viewLink));
});

function runLoader(viewId, emptyOnly){
  const view = document.getElementById(viewId);
  const loader = view.querySelector("[data-loader]");
  const empty = view.querySelector("[data-empty]");
  loader.classList.remove("hidden");
  empty.classList.add("hidden");
  if(emptyOnly){
    setTimeout(()=>{
      loader.classList.add("hidden");
      empty.classList.remove("hidden");
    }, 700);
  }
}

document.getElementById("collapse-btn").addEventListener("click", ()=>{
  sidebar.classList.toggle("collapsed");
});

document.getElementById("btn-logout").addEventListener("click", async ()=>{
  await authSignOut();
  document.getElementById("cart-badge").classList.add("hidden");
  setLandingTab("recursos");
  window.scrollTo(0,0);
});

/* =========================================================
   AGENDA — eventos (treinos e campeonatos) com inscrição
   ========================================================= */
async function loadEventos(){
  const view = document.getElementById("view-agenda");
  const loader = view.querySelector("[data-loader]");
  const empty = view.querySelector("[data-empty]");
  const grid = document.getElementById("events-grid");
  loader.classList.remove("hidden");
  empty.classList.add("hidden");
  grid.classList.add("hidden");

  try{
    const events = await dbGetEvents();
    const myEnrollments = (currentUser && !isGuest) ? await dbGetMyEnrollments(currentUser.id) : [];

    loader.classList.add("hidden");
    if(!events.length){
      empty.classList.remove("hidden");
      return;
    }

    grid.innerHTML = events.map(ev => {
      const enrolled = myEnrollments.includes(ev.id);
      const dateLabel = ev.event_date
        ? new Date(ev.event_date).toLocaleString("pt-BR", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })
        : "Data a definir";
      return `
        <div class="event-card">
          <div class="event-top">
            <span class="event-type ${ev.type === "campeonato" ? "campeonato" : ""}">${ev.type === "campeonato" ? "Campeonato" : "Treino"}</span>
            <span class="tag-judo">${ev.sport || "Geral"}</span>
          </div>
          <h4>${ev.title}</h4>
          <div class="event-meta">
            <span>📅 ${dateLabel}</span>
            <span>📍 ${ev.location || "A definir"}</span>
          </div>
          <button class="btn ${enrolled ? "btn-light" : "btn-primary"} event-enroll-btn ${enrolled ? "enrolled" : ""} ${isGuest ? "locked" : ""}"
                  data-event-id="${ev.id}" data-enrolled="${enrolled}" ${isGuest ? "disabled" : ""}>
            ${enrolled ? "Cancelar Inscrição" : "Inscrever-se"}
          </button>
        </div>`;
    }).join("");
    grid.classList.remove("hidden");

    grid.querySelectorAll(".event-enroll-btn").forEach(btn=>{
      btn.addEventListener("click", async ()=>{
        if(guestBlock()) return;
        const eventId = btn.dataset.eventId;
        const enrolled = btn.dataset.enrolled === "true";
        btn.disabled = true;
        try{
          if(enrolled) await dbUnenrollEvent(eventId, currentUser.id);
          else await dbEnrollEvent(eventId, currentUser.id);
          loadEventos();
        }catch(err){
          alert("Erro: " + err.message);
          btn.disabled = false;
        }
      });
    });
  }catch(err){
    loader.classList.add("hidden");
    empty.textContent = "Erro ao carregar a agenda.";
    empty.classList.remove("hidden");
  }
}


async function loadNoticias(){
  const view = document.getElementById("view-noticias");
  const loader = view.querySelector("[data-loader]");
  const empty = view.querySelector("[data-empty]");
  const grid = document.getElementById("noticias-grid");
  loader.classList.remove("hidden");
  empty.classList.add("hidden");
  grid.classList.add("hidden");

  try{
    const items = await dbGetNews();
    loader.classList.add("hidden");
    if(!items.length){
      empty.classList.remove("hidden");
      return;
    }
    grid.innerHTML = items.map(n => `
      <div class="news-card" style="background-image:linear-gradient(rgba(0,0,0,.15),rgba(0,0,0,.55)), url('${n.image_url || ""}');background-size:cover;background-position:center;">
        <span class="news-badge">${n.category || "Geral"}</span>
      </div>
    `).join("");
    grid.classList.remove("hidden");
  }catch(err){
    loader.classList.add("hidden");
    empty.textContent = "Erro ao carregar notícias.";
    empty.classList.remove("hidden");
  }
}

document.getElementById("btn-nova-noticia").addEventListener("click", ()=>{
  if(guestBlock()) return;
  openOverlay("modal-noticia");
});

document.getElementById("form-noticia").addEventListener("submit", async e=>{
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  try{
    const file = document.getElementById("news-imagem").files[0];
    let image_url = null;
    if(file) image_url = await uploadFile("news", file, currentUser.id);

    await dbCreateNews({
      author_id: currentUser.id,
      title: document.getElementById("news-titulo").value.trim(),
      category: document.getElementById("news-categoria").value.trim(),
      content: document.getElementById("news-conteudo").value.trim(),
      image_url
    });

    e.target.reset();
    closeOverlay("modal-noticia");
    loadNoticias();
  }catch(err){
    alert("Erro ao publicar notícia: " + err.message);
  }finally{
    btn.disabled = false;
  }
});

/* =========================================================
   MÍDIA — carregar, publicar e curtir
   ========================================================= */
let pendingMediaFile = null;

async function loadMidia(){
  const view = document.getElementById("view-midia");
  const loader = view.querySelector("[data-loader]");
  const empty = view.querySelector("[data-empty]");
  const grid = document.getElementById("midia-grid");
  loader.classList.remove("hidden");
  empty.classList.add("hidden");
  grid.classList.add("hidden");

  try{
    const items = await dbGetMedia();
    loader.classList.add("hidden");
    if(!items.length){
      empty.classList.remove("hidden");
      return;
    }
    grid.innerHTML = "";
    grid.classList.remove("hidden");
    for(const m of items){
      const likeCount = await dbGetMediaLikes(m.id).catch(()=>0);
      const tile = document.createElement("div");
      tile.className = "media-tile";
      const mediaTag = m.media_type === "video"
        ? `<video src="${m.url}" controls></video>`
        : `<img src="${m.url}" alt="mídia">`;
      const isOwner = currentUser && m.user_id === currentUser.id && !isGuest;
      tile.innerHTML = `
        ${mediaTag}
        ${isOwner ? `<button class="media-delete-btn" data-media-id="${m.id}" data-icon="x-circle" title="Excluir"></button>` : ""}
        <div class="media-tile-footer">
          <p>${m.caption || ""}</p>
          <button class="media-like-btn" data-media-id="${m.id}">
            <span class="icon-inline" data-icon="heart"></span> <span class="like-count">${likeCount}</span>
          </button>
        </div>`;
      grid.appendChild(tile);
    }
    renderIcons(grid);
    grid.querySelectorAll(".media-delete-btn").forEach(btn=>{
      btn.addEventListener("click", async ()=>{
        if(!confirm("Excluir esta mídia?")) return;
        try{
          await dbDeleteMedia(btn.dataset.mediaId);
          loadMidia();
        }catch(err){ alert("Erro ao excluir: " + err.message); }
      });
    });
    grid.querySelectorAll(".media-like-btn").forEach(btn=>{
      btn.addEventListener("click", async ()=>{
        if(guestBlock()) return;
        const liked = btn.classList.contains("liked");
        try{
          await dbToggleMediaLike(btn.dataset.mediaId, currentUser.id, liked);
          btn.classList.toggle("liked");
          const countEl = btn.querySelector(".like-count");
          countEl.textContent = Number(countEl.textContent) + (liked ? -1 : 1);
        }catch(err){ alert(err.message); }
      });
    });
  }catch(err){
    loader.classList.add("hidden");
    empty.textContent = "Erro ao carregar mídia.";
    empty.classList.remove("hidden");
  }
}

document.getElementById("fab-midia").addEventListener("click", ()=>{
  if(guestBlock()) return;
  document.getElementById("midia-input").click();
});

document.getElementById("midia-input").addEventListener("change", e=>{
  const file = e.target.files[0];
  if(!file) return;
  pendingMediaFile = file;
  const preview = document.getElementById("midia-preview");
  preview.style.backgroundImage = `url(${URL.createObjectURL(file)})`;
  preview.style.backgroundSize = "cover";
  preview.style.backgroundPosition = "center";
  openOverlay("modal-midia");
});

document.getElementById("form-midia").addEventListener("submit", async e=>{
  e.preventDefault();
  if(!pendingMediaFile) return;
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  try{
    const url = await uploadFile("media", pendingMediaFile, currentUser.id);
    const media_type = pendingMediaFile.type.startsWith("video") ? "video" : "image";
    await dbCreateMedia({
      user_id: currentUser.id,
      media_type,
      url,
      caption: document.getElementById("midia-legenda").value.trim()
    });
    pendingMediaFile = null;
    e.target.reset();
    closeOverlay("modal-midia");
    loadMidia();
  }catch(err){
    alert("Erro ao publicar mídia: " + err.message);
  }finally{
    btn.disabled = false;
  }
});

/* =========================================================
   MARKETPLACE — produtos e comentários
   ========================================================= */
async function loadProdutos(){
  const view = document.getElementById("view-marketplace");
  const loader = view.querySelector("[data-loader]");
  const empty = view.querySelector("[data-empty]");
  const grid = document.getElementById("produtos-grid");
  loader.classList.remove("hidden");
  empty.classList.add("hidden");
  grid.classList.add("hidden");

  try{
    const items = await dbGetProducts();
    loader.classList.add("hidden");
    if(!items.length){
      empty.classList.remove("hidden");
      return;
    }
    grid.innerHTML = items.map(p => `
      <div class="product-card light" data-product-id="${p.id}">
        <div class="product-image" style="background-image:linear-gradient(rgba(0,0,0,.1),rgba(0,0,0,.25)), url('${p.image_url || ""}');background-size:cover;background-position:center;">
          <span class="product-badge">${p.category || "Geral"}</span>
        </div>
        <div class="product-body">
          <h4>${p.title}</h4>
          <div class="product-row">
            <span class="price">R$ ${Number(p.price).toFixed(2).replace(".", ",")}</span>
            <span class="stars">★★★</span>
          </div>
          <button class="btn btn-dark btn-block" data-open-produto="${p.id}">Ver Detalhes</button>
        </div>
      </div>
    `).join("");
    grid.classList.remove("hidden");
    grid.querySelectorAll("[data-open-produto]").forEach(btn=>{
      btn.addEventListener("click", ()=> openProdutoDetalhe(btn.dataset.openProduto, items));
    });
  }catch(err){
    loader.classList.add("hidden");
    empty.textContent = "Erro ao carregar produtos.";
    empty.classList.remove("hidden");
  }
}

document.getElementById("marketplace-search").addEventListener("input", e=>{
  const q = e.target.value.toLowerCase();
  document.querySelectorAll("#produtos-grid .product-card").forEach(card=>{
    const title = card.querySelector("h4").textContent.toLowerCase();
    card.style.display = title.includes(q) ? "" : "none";
  });
});

document.getElementById("btn-vender-produto").addEventListener("click", ()=>{
  if(guestBlock()) return;
  openOverlay("modal-produto");
});

document.getElementById("form-produto").addEventListener("submit", async e=>{
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  try{
    const file = document.getElementById("prod-imagem").files[0];
    let image_url = null;
    if(file) image_url = await uploadFile("products", file, currentUser.id);

    await dbCreateProduct({
      seller_id: currentUser.id,
      title: document.getElementById("prod-titulo").value.trim(),
      price: parseFloat(document.getElementById("prod-preco").value),
      category: document.getElementById("prod-categoria").value.trim(),
      description: document.getElementById("prod-descricao").value.trim(),
      image_url
    });

    e.target.reset();
    closeOverlay("modal-produto");
    loadProdutos();
  }catch(err){
    alert("Erro ao publicar produto: " + err.message);
  }finally{
    btn.disabled = false;
  }
});

async function openProdutoDetalhe(productId, cachedList){
  activeProductId = productId;
  const produto = cachedList.find(p => p.id === productId);
  if(!produto) return;

  document.getElementById("detalhe-imagem").style.backgroundImage = produto.image_url ? `url(${produto.image_url})` : "";
  document.getElementById("detalhe-categoria").textContent = produto.category || "Geral";
  document.getElementById("detalhe-titulo").textContent = produto.title;
  document.getElementById("detalhe-preco").textContent = `R$ ${Number(produto.price).toFixed(2).replace(".", ",")}`;
  document.getElementById("detalhe-descricao").textContent = produto.description || "Sem descrição.";
  document.getElementById("detalhe-vendedor").textContent = (produto.profiles && produto.profiles.full_name) || "Vendedor CoreMotion";

  await loadComentarios(productId);
  openOverlay("modal-produto-detalhe");
}

async function loadComentarios(productId){
  const list = document.getElementById("detalhe-comentarios");
  list.innerHTML = `<p class="comment-empty">Carregando comentários...</p>`;
  try{
    const comments = await dbGetProductComments(productId);
    if(!comments.length){
      list.innerHTML = `<p class="comment-empty">Nenhum comentário ainda. Seja o primeiro!</p>`;
      return;
    }
    list.innerHTML = comments.map(c => `
      <div class="comment-item">
        <div class="comment-avatar"></div>
        <div class="comment-body">
          <strong>${(c.profiles && c.profiles.full_name) || "Usuário CoreMotion"}</strong>
          <p>${c.content}</p>
        </div>
      </div>
    `).join("");
  }catch(err){
    list.innerHTML = `<p class="comment-empty">Erro ao carregar comentários.</p>`;
  }
}

document.getElementById("form-comentario").addEventListener("submit", async e=>{
  e.preventDefault();
  if(guestBlock()) return;
  const input = document.getElementById("comentario-input");
  const texto = input.value.trim();
  if(!texto) return;
  try{
    await dbAddProductComment(activeProductId, currentUser.id, texto);
    input.value = "";
    await loadComentarios(activeProductId);
  }catch(err){
    alert("Erro ao comentar: " + err.message);
  }
});

/* =========================================================
   CARRINHO DE COMPRAS
   ========================================================= */
document.getElementById("btn-add-carrinho").addEventListener("click", async ()=>{
  if(guestBlock()) return;
  if(!activeProductId) return;
  try{
    await dbAddToCart(currentUser.id, activeProductId);
    await updateCartBadge();
    alert("Produto adicionado ao carrinho!");
  }catch(err){
    alert("Erro ao adicionar ao carrinho: " + err.message);
  }
});

document.getElementById("btn-carrinho").addEventListener("click", async ()=>{
  if(guestBlock()) return;
  await loadCarrinho();
  openOverlay("modal-carrinho");
});

async function loadCarrinho(){
  const list = document.getElementById("carrinho-lista");
  const totalEl = document.getElementById("carrinho-total");
  list.innerHTML = `<p class="cart-empty">Carregando...</p>`;
  try{
    const items = await dbGetCart(currentUser.id);
    if(!items.length){
      list.innerHTML = `<p class="cart-empty">Seu carrinho está vazio.</p>`;
      totalEl.textContent = "R$ 0,00";
      return;
    }
    let total = 0;
    list.innerHTML = items.map(item=>{
      const p = item.products;
      const subtotal = (p?.price || 0) * item.quantity;
      total += subtotal;
      return `
        <div class="cart-item">
          <div class="cart-item-img" style="background-image:url('${p?.image_url || ""}')"></div>
          <div class="cart-item-info">
            <strong>${p?.title || "Produto"}</strong>
            <span>Qtd: ${item.quantity} · R$ ${Number(subtotal).toFixed(2).replace(".", ",")}</span>
          </div>
          <button class="cart-item-remove" data-cart-id="${item.id}">Remover</button>
        </div>`;
    }).join("");
    totalEl.textContent = `R$ ${total.toFixed(2).replace(".", ",")}`;

    list.querySelectorAll(".cart-item-remove").forEach(btn=>{
      btn.addEventListener("click", async ()=>{
        try{
          await dbRemoveFromCart(btn.dataset.cartId);
          await loadCarrinho();
          await updateCartBadge();
        }catch(err){ alert(err.message); }
      });
    });
  }catch(err){
    list.innerHTML = `<p class="cart-empty">Erro ao carregar o carrinho.</p>`;
  }
}

document.getElementById("btn-finalizar-compra").addEventListener("click", async ()=>{
  if(guestBlock()) return;
  try{
    await dbClearCart(currentUser.id);
    await loadCarrinho();
    await updateCartBadge();
    alert("Compra finalizada com sucesso! 🎉");
    closeOverlay("modal-carrinho");
  }catch(err){
    alert("Erro ao finalizar compra: " + err.message);
  }
});

async function updateCartBadge(){
  const badge = document.getElementById("cart-badge");
  if(!currentUser || isGuest){
    badge.classList.add("hidden");
    return;
  }
  try{
    const count = await dbGetCartCount(currentUser.id);
    badge.textContent = count;
    badge.classList.toggle("hidden", count === 0);
  }catch{
    badge.classList.add("hidden");
  }
}

/* =========================================================
   CONFIGURAÇÕES — salvos direto na tabela profiles
   ========================================================= */
document.getElementById("toggle-dark").addEventListener("change", async e=>{
  if(guestBlock()){ e.target.checked = !e.target.checked; return; }
  dashboardRoot.classList.toggle("dark-mode", e.target.checked);
  await dbUpsertProfile({ id: currentUser.id, dark_mode: e.target.checked }).catch(()=>{});
});
document.getElementById("toggle-marketing").addEventListener("change", async e=>{
  if(guestBlock()){ e.target.checked = !e.target.checked; return; }
  await dbUpsertProfile({ id: currentUser.id, marketing_emails: e.target.checked }).catch(()=>{});
});
document.getElementById("toggle-public").addEventListener("change", async e=>{
  if(guestBlock()){ e.target.checked = !e.target.checked; return; }
  await dbUpsertProfile({ id: currentUser.id, public_profile: e.target.checked }).catch(()=>{});
});
