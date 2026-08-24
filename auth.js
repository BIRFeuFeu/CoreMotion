/* =========================================================
   AUTENTICAÇÃO (Supabase Auth)
   ========================================================= */

function supabaseOff(){
  return !window.SUPABASE_CONFIGURED;
}

async function authSignUp(email, password, fullName){
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  });
  if(error) throw error;
  return data;
}

async function authSignIn(email, password){
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if(error) throw error;
  return data;
}

async function authSignInTeste(){
  const { data, error } = await sb.auth.signInAnonymously();
  if(error) throw error;
  return data;
}

async function authSignInGoogle(){
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + window.location.pathname }
  });
  if(error) throw error;
}

async function authSignOut(){
  const { error } = await sb.auth.signOut();
  if(error) throw error;
}

async function authGetSession(){
  if(supabaseOff()) return null;
  const { data, error } = await sb.auth.getSession();
  if(error) throw error;
  return data.session;
}

function authOnChange(callback){
  if(supabaseOff()) return () => {};
  const { data } = sb.auth.onAuthStateChange((event, session) => callback(session, event));
  return data?.subscription?.unsubscribe || (() => {});
}

async function authResetPassword(email){
  const { data, error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname
  });
  if(error) throw error;
  return data;
}

async function authUpdatePassword(newPassword){
  const { data, error } = await sb.auth.updateUser({ password: newPassword });
  if(error) throw error;
  return data;
}

function authIsGuest(user){
  if(!user) return false;
  return user.is_anonymous === true || user.app_metadata?.provider === "anonymous";
}