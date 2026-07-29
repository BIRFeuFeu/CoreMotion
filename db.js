/* =========================================================
   BANCO DE DADOS + STORAGE (Supabase)
   Todas as funções de leitura/escrita usadas pelo app.
   ========================================================= */

/* ---------- STORAGE (upload de arquivos/imagens) ---------- */

// Envia um arquivo para um bucket do Storage e devolve a URL pública.
// bucket: "avatars" | "products" | "news" | "media"
async function uploadFile(bucket, file, userId){
  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await sb.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });
  if(error) throw error;
  const { data } = sb.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/* ---------- PERFIL ---------- */

async function dbUpsertProfile(profile){
  const { error } = await sb.from("profiles").upsert(profile);
  if(error) throw error;
}

async function dbGetProfile(id){
  const { data, error } = await sb.from("profiles").select("*").eq("id", id).single();
  if(error) throw error;
  return data;
}

/* ---------- MARKETPLACE (produtos) ---------- */

async function dbCreateProduct(product){
  const { data, error } = await sb.from("products").insert(product).select().single();
  if(error) throw error;
  return data;
}

async function dbGetProducts(){
  const { data, error } = await sb
    .from("products")
    .select("*, profiles ( full_name )")
    .order("created_at", { ascending: false });
  if(error) throw error;
  return data;
}

async function dbDeleteProduct(id){
  const { error } = await sb.from("products").delete().eq("id", id);
  if(error) throw error;
}

/* ---------- COMENTÁRIOS EM PRODUTOS ---------- */

async function dbGetProductComments(productId){
  const { data, error } = await sb
    .from("product_comments")
    .select("*, profiles ( full_name, avatar_url )")
    .eq("product_id", productId)
    .order("created_at", { ascending: true });
  if(error) throw error;
  return data;
}

async function dbAddProductComment(productId, userId, content){
  const { error } = await sb.from("product_comments").insert({
    product_id: productId,
    user_id: userId,
    content
  });
  if(error) throw error;
}

/* ---------- NOTÍCIAS ---------- */

async function dbCreateNews(news){
  const { data, error } = await sb.from("news").insert(news).select().single();
  if(error) throw error;
  return data;
}

async function dbGetNews(){
  const { data, error } = await sb
    .from("news")
    .select("*, profiles ( full_name )")
    .order("created_at", { ascending: false });
  if(error) throw error;
  return data;
}

/* ---------- MÍDIA ---------- */

async function dbCreateMedia(media){
  const { data, error } = await sb.from("media").insert(media).select().single();
  if(error) throw error;
  return data;
}

async function dbGetMedia(){
  const { data, error } = await sb
    .from("media")
    .select("*, profiles ( full_name, avatar_url )")
    .order("created_at", { ascending: false });
  if(error) throw error;
  return data;
}

async function dbToggleMediaLike(mediaId, userId, liked){
  if(liked){
    const { error } = await sb.from("media_likes").delete().match({ media_id: mediaId, user_id: userId });
    if(error) throw error;
  }else{
    const { error } = await sb.from("media_likes").insert({ media_id: mediaId, user_id: userId });
    if(error) throw error;
  }
}

async function dbGetMediaLikes(mediaId){
  const { count, error } = await sb
    .from("media_likes")
    .select("*", { count: "exact", head: true })
    .eq("media_id", mediaId);
  if(error) throw error;
  return count || 0;
}

// Remove uma mídia (só o dono consegue, RLS garante isso no banco também)
async function dbDeleteMedia(id){
  const { error } = await sb.from("media").delete().eq("id", id);
  if(error) throw error;
}

/* ---------- AGENDA (eventos: treinos e campeonatos) ---------- */

async function dbGetEvents(){
  const { data, error } = await sb
    .from("events")
    .select("*")
    .order("event_date", { ascending: true });
  if(error) throw error;
  return data;
}

// ids dos eventos em que o usuário já está inscrito
async function dbGetMyEnrollments(userId){
  const { data, error } = await sb
    .from("event_enrollments")
    .select("event_id")
    .eq("user_id", userId);
  if(error) throw error;
  return data.map(r => r.event_id);
}

async function dbEnrollEvent(eventId, userId){
  const { error } = await sb.from("event_enrollments").insert({ event_id: eventId, user_id: userId });
  if(error) throw error;
}

async function dbUnenrollEvent(eventId, userId){
  const { error } = await sb.from("event_enrollments").delete().match({ event_id: eventId, user_id: userId });
  if(error) throw error;
}

/* ---------- CARRINHO ---------- */

async function dbGetCart(userId){
  const { data, error } = await sb
    .from("cart_items")
    .select("id, quantity, products ( id, title, price, image_url )")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if(error) throw error;
  return data;
}

async function dbAddToCart(userId, productId){
  const { data: existing, error: selErr } = await sb
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();
  if(selErr) throw selErr;

  if(existing){
    const { error } = await sb.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
    if(error) throw error;
  }else{
    const { error } = await sb.from("cart_items").insert({ user_id: userId, product_id: productId, quantity: 1 });
    if(error) throw error;
  }
}

async function dbRemoveFromCart(cartItemId){
  const { error } = await sb.from("cart_items").delete().eq("id", cartItemId);
  if(error) throw error;
}

async function dbClearCart(userId){
  const { error } = await sb.from("cart_items").delete().eq("user_id", userId);
  if(error) throw error;
}

async function dbGetCartCount(userId){
  const { count, error } = await sb
    .from("cart_items")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if(error) throw error;
  return count || 0;
}
