/* =========================================================
   CONEXÃO COM O SUPABASE
   ---------------------------------------------------------
   As chaves NÃO ficam mais hardcoded aqui. Elas vêm de:
     1. localStorage  (configureSupabase("URL","CHAVE") no console)
     2. config.local.js  → window.COREMOTION_CONFIG_LOCAL (fora do git)
     3. config.js        → window.COREMOTION_CONFIG       (versionado)

   `window.SUPABASE_CONFIG_SOURCE` diz qual dos três venceu —
   útil para ter certeza de que você não está apontando para o
   banco de produção sem querer.
   ========================================================= */
const STORAGE_URL_KEY = "coremotion_supabase_url";
const STORAGE_ANON_KEY = "coremotion_supabase_anon_key";

// Resolve url/chave pela ordem de prioridade e informa a origem.
function resolveConfig(){
  const arquivo = window.COREMOTION_CONFIG || {};
  const local = window.COREMOTION_CONFIG_LOCAL || {};
  let url = "", key = "", source = "arquivo";

  try{
    const lsUrl = localStorage.getItem(STORAGE_URL_KEY);
    const lsKey = localStorage.getItem(STORAGE_ANON_KEY);
    if(lsUrl && lsKey){
      return { url: lsUrl, key: lsKey, source: "localStorage" };
    }
  }catch(e){ /* localStorage bloqueado (modo privado) — segue para os arquivos */ }

  if(local.url && local.anonKey){
    url = local.url; key = local.anonKey; source = "local";
  }else{
    url = arquivo.url || ""; key = arquivo.anonKey || ""; source = "arquivo";
  }
  return { url, key, source };
}

function getConfigured(){
  const cfg = resolveConfig();
  const url = (cfg.url || "").trim().replace(/\/+$/, "");
  const key = (cfg.key || "").trim();
  const ok =
    /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) &&
    key.length > 20 && key.startsWith("eyJ");

  return { url, key, ok, source: cfg.source };
}

const config = getConfigured();
window.SUPABASE_CONFIGURED = config.ok;
window.SUPABASE_CONFIG_SOURCE = config.source;

// Permite trocar de projeto sem editar arquivo (fica no localStorage).
function configureSupabase(url, key){
  if(!url || !key){
    showToast("Informe a URL e a chave anon do seu projeto Supabase.", "error");
    return;
  }
  try{
    localStorage.setItem(STORAGE_URL_KEY, url.trim());
    localStorage.setItem(STORAGE_ANON_KEY, key.trim());
  }catch(e){
    showToast("Não foi possível salvar no navegador — edite config.js diretamente.", "error");
    return;
  }
  showToast("Configuração salva! Recarregando...", "success");
  setTimeout(()=> location.reload(), 900);
}

let sb;
try {
  if (!config.ok) {
    sb = new Proxy({}, {
      get(){ throw new Error(
        "Supabase ainda não configurado. Preencha config.js (ou copie " +
        "config.local.example.js para config.local.js) ou rode no console: " +
        "configureSupabase('URL', 'CHAVE')"
      ); }
    });
  } else if(!window.supabase){
    throw new Error("Biblioteca @supabase/supabase-js não carregou. Verifique o CDN no index.html.");
  } else {
    sb = window.supabase.createClient(config.url, config.key, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
  }
} catch(e) {
  window.SUPABASE_CONFIGURED = false;
  sb = new Proxy({}, {
    get(){ throw e; }
  });
}

window.configureSupabase = configureSupabase;
