/* =========================================================
   CONFIGURAÇÃO DO SUPABASE
   =========================================================
   👉 COLE AQUI AS CHAVES DO SEU PRÓPRIO PROJETO:

   1. Crie um projeto em https://supabase.com
   2. Vá em Project Settings > API
   3. Copie "Project URL" e cole em SUPABASE_URL
   4. Copie a chave "anon public" e cole em SUPABASE_ANON_KEY

   ⚠️ Nunca coloque aqui a chave "service_role" — só a "anon".

   MODO ALTERNATIVO (sem editar este arquivo):
   Abra o console do navegador (F12) e rode:
     configureSupabase("https://SEU-PROJETO.supabase.co", "SUA-CHAVE-ANON")
   As chaves ficam salvas no navegador (localStorage) e o site
   recarrega sozinho. Útil para testar sem mexer no arquivo.
   ========================================================= */

const SUPABASE_URL = "https://tyvdtaiyihhaewczpnrf.supabase.co";   // Project URL
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5dmR0YWl5aWhoYWV3Y3pwbnJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMzQ0MzEsImV4cCI6MjEwMDkxMDQzMX0.Y6-rvqiP3JcWXY7aOmgKslU1tO3Y8IjeTHucsz39h10";   // anon public

// Chaves salvas pelo configureSupabase() (localStorage)
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

  // Validações básicas para detectar placeholders/chaves inválidas
  url = (url || "").trim().replace(/\/+$/, "");
  key = (key || "").trim();
  const ok =
    /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) &&
    key.length > 20 && key.startsWith("eyJ");

  return { url, key, ok };
}

const config = getConfigured();
window.SUPABASE_CONFIGURED = config.ok;

// Guarda as chaves no navegador e recarrega a página.
// Rode no console do navegador: configureSupabase("URL", "CHAVE")
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

// "supabase" global vem do script CDN carregado no index.html.
// Criamos nosso cliente e guardamos em "sb" (usado em auth.js e db.js).
let sb;
try{
  if(!config.ok){
    // Stub que lança um erro claro se o app tentar falar com o Supabase
    // sem estar configurado (em vez de um TypeError confuso).
    sb = new Proxy({}, {
      get(){ throw new Error(
        "Supabase ainda não configurado. Abra supabase-client.js e cole " +
        "suas chaves, ou rode no console: configureSupabase('URL', 'CHAVE')"
      ); }
    });
  }else if(!window.supabase){
    throw new Error("Biblioteca @supabase/supabase-js não carregou. Verifique a conexão com a internet e o script CDN no index.html.");
  }else{
    sb = window.supabase.createClient(config.url, config.key, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
  }
}catch(err){
  window.SUPABASE_CONFIGURED = false;
  sb = new Proxy({}, {
    get(){ throw err; }
  });
}

// Conveniência para depuração no console do navegador
window.configureSupabase = configureSupabase;
