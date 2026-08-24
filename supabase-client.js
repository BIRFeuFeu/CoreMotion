// Cole as chaves do seu projeto Supabase aqui:
// 1. No Supabase: Project Settings > API
// 2. Copie a "Project URL" e cole em SUPABASE_URL
// 3. Copie a chave "anon public" e cole em SUPABASE_ANON_KEY
const SUPABASE_URL = "https://tyvdtaiyihhaewczpnrf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5dmR0YWl5aWhoYWV3Y3pwbnJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMzQ0MzEsImV4cCI6MjEwMDkxMDQzMX0.Y6-rvqiP3JcWXY7aOmgKslU1tO3Y8IjeTHucsz39h10";

const STORAGE_URL_KEY = "coremotion_supabase_url";
const STORAGE_ANON_KEY = "coremotion_supabase_anon_key";

function getConfigured(){
  let url, key;
  try{
    url = localStorage.getItem(STORAGE_URL_KEY) || SUPABASE_URL;
    key = localStorage.getItem(STORAGE_ANON_KEY) || SUPABASE_ANON_KEY;
  }catch(e){
    url = SUPABASE_URL;
    key = SUPABASE_ANON_KEY;
  }

  url = (url || "").trim().replace(/\/+$/, "");
  key = (key || "").trim();
  const ok =
    /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) &&
    key.length > 20 && key.startsWith("eyJ");

  return { url, key, ok };
}

const config = getConfigured();
window.SUPABASE_CONFIGURED = config.ok;

function configureSupabase(url, key){
  if(!url || !key){
    showToast("Informe a URL e a chave anon do seu projeto Supabase.", "error");
    return;
  }
  try{
    localStorage.setItem(STORAGE_URL_KEY, url.trim());
    localStorage.setItem(STORAGE_ANON_KEY, key.trim());
  }catch(e){
    showToast("Não foi possível salvar no navegador — edite supabase-client.js diretamente.", "error");
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
        "Supabase ainda não configurado. Abra supabase-client.js e cole suas chaves " +
        "ou rode no console: configureSupabase('URL', 'CHAVE')"
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