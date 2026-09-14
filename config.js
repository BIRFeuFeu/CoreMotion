/* =========================================================
   CONFIGURAÇÃO DO PROJETO — CoreMotion
   ---------------------------------------------------------
   Este arquivo é VERSIONADO de propósito.

   Por quê a chave aparece aqui? A chave `anon` do Supabase é
   PÚBLICA POR DESENHO: ela é enviada para o navegador de todo
   visitante, então escondê-la no git não acrescenta segurança nenhuma.
   Quem protege os dados é o RLS do banco (veja schema.sql e a
   Etapa 1 do PLANO-IMPLEMENTACAO.md).

   Os segredos DE VERDADE nunca entram neste repositório:
     - chave `service_role` do Supabase
     - `access_token` e webhook secret do Mercado Pago
   Esses ficam apenas como **secret de Supabase Edge Function**.

   ORDEM DE PRIORIDADE (a primeira que existir vence):
     1. localStorage  → rode configureSupabase("URL","CHAVE") no console
     2. config.local.js (fora do git — use config.local.example.js)
     3. config.js     → este arquivo
   ========================================================= */
window.COREMOTION_CONFIG = {
  url: "https://tyvdtaiyihhaewczpnrf.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5dmR0YWl5aWhoYWV3Y3pwbnJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMzQ0MzEsImV4cCI6MjEwMDkxMDQzMX0.Y6-rvqiP3JcWXY7aOmgKslU1tO3Y8IjeTHucsz39h10",
};
