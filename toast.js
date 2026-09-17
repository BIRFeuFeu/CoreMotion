/* =========================================================
   TOAST — sistema de notificações (substitui alert())
   Uso: showToast("mensagem", "success" | "error" | "warn" | "info")
   ========================================================= */

let toastTimer = null;

function showToast(message, type = "info"){
  const root = document.getElementById("toast-root");
  if(!root) return;

  const toast = document.createElement("div");
  toast.className = `toast-item toast-${type}`;
  toast.setAttribute("role", "status");
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true"></span>
    <span class="toast-msg">${escapeHtml(String(message))}</span>
    <button class="toast-close" aria-label="Fechar aviso">&times;</button>
  `;

  while(root.children.length >= 4) root.firstChild.remove();
  root.appendChild(toast);
  requestAnimationFrame(()=> toast.classList.add("show"));

  const dismiss = ()=>{
    if(!toast.isConnected) return;
    toast.classList.remove("show");
    toast.addEventListener("transitionend", ()=> toast.remove(), { once:true });
    setTimeout(()=>{ if(toast.isConnected) toast.remove(); }, 350);
  };

  toast.querySelector(".toast-close").addEventListener("click", dismiss);
  const auto = type === "error" ? 6000 : 3800;
  const t = setTimeout(dismiss, auto);
  toast.addEventListener("mouseenter", ()=> clearTimeout(t));
  toast.addEventListener("mouseleave", ()=>{
    setTimeout(dismiss, 1200);
  });
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[c]));
}

// Só deixa passar URLs http(s) vindas do banco. Qualquer outra coisa
// (javascript:, data:, vbs:, relativo malicioso...) vira "" e o app
// mostra o placeholder em vez de executar/injetar.
function safeUrl(u){
  const s = String(u || "").trim();
  if(!s) return "";
  try{
    const parsed = new URL(s, window.location.href);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") ? parsed.href : "";
  }catch(e){
    return "";
  }
}

// Cor vinda do banco só é aceita como #hex (3, 4, 6 ou 8 dígitos).
// Evita injeção de CSS via background/variável (--team-color).
function safeColor(c, fallback = "#e5383b"){
  return /^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{4}$|^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{8}$/.test(String(c || "").trim())
    ? String(c).trim()
    : fallback;
}

(function ensureToastRoot(){
  if(document.getElementById("toast-root")) return;
  const root = document.createElement("div");
  root.id = "toast-root";
  root.className = "toast-root";
  root.setAttribute("aria-live", "polite");
  document.body.appendChild(root);
})();