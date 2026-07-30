/* =========================================================
   AUTENTICAÇÃO (Supabase Auth)
   ========================================================= */

// Cria conta nova com e-mail e senha
async function authSignUp(email, password, fullName){
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  });
  if(error) throw error;
  return data;
}

// Login com e-mail e senha
async function authSignIn(email, password){
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if(error) throw error;
  return data;
}

// Botão "Entrar com Conta de Teste" — login anônimo do Supabase.
// Precisa estar ativado em Authentication > Providers > Anonymous Sign-ins.
async function authSignInTeste(){
  const { data, error } = await sb.auth.signInAnonymously();
  if(error) throw error;
  return data;
}

// Logout
async function authSignOut(){
  const { error } = await sb.auth.signOut();
  if(error) throw error;
}

// Sessão atual (usada ao recarregar a página, para saber se já está logado)
async function authGetSession(){
  const { data, error } = await sb.auth.getSession();
  if(error) throw error;
  return data.session;
}

// Dispara callback sempre que o login/logout mudar
function authOnChange(callback){
  sb.auth.onAuthStateChange((_event, session) => callback(session));
}

// true = conta de convidado (login anônimo), false = conta com e-mail
function authIsGuest(user){
  if(!user) return false;
  return user.is_anonymous === true || user.app_metadata?.provider === "anonymous";
}
