/* =========================================================
   CONFIGURAÇÃO DO SUPABASE
   =========================================================
   1. Crie um projeto em https://supabase.com
   2. Vá em Project Settings > API
   3. Copie "Project URL" e cole em SUPABASE_URL abaixo
   4. Copie a chave "anon public" e cole em SUPABASE_ANON_KEY
   Nunca coloque aqui a chave "service_role" — só a "anon".
   ========================================================= */

const SUPABASE_URL = "https://supabase.com/dashboard/project/tyvdtaiyihhaewczpnrf";
const SUPABASE_ANON_KEY = "sb_publishable_Hu1yk_bON6Ej5YTp8duv-g_hltDBsat";

// "supabase" global vem do script CDN carregado no index.html.
// Criamos nosso cliente e guardamos em "sb" (usado em auth.js e db.js).
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
