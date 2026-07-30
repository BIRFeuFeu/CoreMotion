/* =========================================================
   CONFIGURAÇÃO DO SUPABASE
   =========================================================
   1. Crie um projeto em https://supabase.com
   2. Vá em Project Settings > API
   3. Copie "Project URL" e cole em SUPABASE_URL abaixo
   4. Copie a chave "anon public" e cole em SUPABASE_ANON_KEY
   Nunca coloque aqui a chave "service_role" — só a "anon".
   ========================================================= */

const SUPABASE_URL = "https://tyvdtaiyihhaewczpnrf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5dmR0YWl5aWhoYWV3Y3pwbnJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMzQ0MzEsImV4cCI6MjEwMDkxMDQzMX0.Y6-rvqiP3JcWXY7aOmgKslU1tO3Y8IjeTHucsz39h10";

// "supabase" global vem do script CDN carregado no index.html.
// Criamos nosso cliente e guardamos em "sb" (usado em auth.js e db.js).
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
