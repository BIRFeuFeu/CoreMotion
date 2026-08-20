/* =========================================================
   TOAST — sistema de notificações (substitui alert()/avisos)
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

  // Limita a quantidade de toasts na tela
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
  // pausa o auto-dismiss se o mouse estiver em cima
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

// Cria o contêiner raiz dos toasts (uma única vez)
(function ensureToastRoot(){
  if(document.getElementById("toast-root")) return;
  const root = document.createElement("div");
  root.id = "toast-root";
  root.className = "toast-root";
  root.setAttribute("aria-live", "polite");
  document.body.appendChild(root);
})();
