/* =========================================================
   VALIDATION.JS — helpers de validação centralizados
   ========================================================= */

const REGEX = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/i,
  password: /^(?=.*\d)(?=.*[A-Z]).{6,}$/,
  nameSafe: /^[\p{L}\p{N}\s\-_.']+$/u,
};

const LIMITS = {
  PRODUCT_TITLE_MIN: 5,
  PRODUCT_TITLE_MAX: 80,
  PRODUCT_PRICE_MIN: 0,
  PRODUCT_PRICE_MAX: 999999,
  PRODUCT_DESC_MAX: 1000,
  EVENT_TITLE_MIN: 3,
  EVENT_TITLE_MAX: 80,
  EVENT_DESC_MAX: 500,
  NEWS_TITLE_MIN: 5,
  NEWS_TITLE_MAX: 120,
  NEWS_CONTENT_MAX: 5000,
  COMMENT_MAX: 280,
  MESSAGE_MAX: 500,
  FILE_IMAGE_MAX_BYTES: 5 * 1024 * 1024,
  FILE_VIDEO_MAX_BYTES: 50 * 1024 * 1024,
};

function vEmail(v){
  const t = String(v || "").trim();
  if(!t) return { ok: false, erro: "E-mail é obrigatório." };
  if(!REGEX.email.test(t)) return { ok: false, erro: "E-mail inválido." };
  return { ok: true, valor: t };
}

function vPassword(v){
  const t = String(v || "");
  if(t.length < 6) return { ok: false, erro: "Senha deve ter pelo menos 6 caracteres." };
  if(!/\d/.test(t)) return { ok: false, erro: "Senha precisa ter pelo menos 1 número." };
  if(!/[A-Z]/.test(t)) return { ok: false, erro: "Senha precisa ter pelo menos 1 letra maiúscula." };
  return { ok: true, valor: t };
}

function vPasswordConfirm(senha, confirma){
  if(senha !== confirma) return { ok: false, erro: "As senhas não coincidem." };
  return { ok: true };
}

function vRequired(input, label){
  const v = input?.value?.trim?.();
  if(!v) return { ok: false, erro: `Preencha o campo "${label}".`, foco: input };
  return { ok: true, valor: v };
}

function vText(input, label, opts = {}){
  const min = opts.min || 0;
  const max = opts.max || Infinity;
  const v = input?.value?.trim?.() || "";
  if(!v && opts.required !== false) return { ok: false, erro: `Preencha "${label}".`, foco: input };
  if(v.length < min) return { ok: false, erro: `"${label}" precisa ter pelo menos ${min} caracteres.`, foco: input };
  if(v.length > max) return { ok: false, erro: `"${label}" deve ter no máximo ${max} caracteres.`, foco: input };
  return { ok: true, valor: v };
}

function vNumber(input, label, opts = {}){
  const min = opts.min !== undefined ? opts.min : -Infinity;
  const max = opts.max !== undefined ? opts.max : Infinity;
  const raw = String(input?.value ?? "").trim();
  const n = parseFloat(raw.replace(",", "."));
  if(!Number.isFinite(n)) return { ok: false, erro: `"${label}" precisa ser um número válido.`, foco: input };
  if(n < min) return { ok: false, erro: `"${label}" deve ser no mínimo ${min}.`, foco: input };
  if(n > max) return { ok: false, erro: `"${label}" deve ser no máximo ${max}.`, foco: input };
  return { ok: true, valor: n };
}

function vFile(input, label, opts = {}){
  const file = input?.files?.[0];
  if(!file){
    if(opts.required !== false) return { ok: false, erro: `Selecione um arquivo para "${label}".`, foco: input };
    return { ok: true };
  }
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if(opts.acceptImage && !isImage) return { ok: false, erro: `"${label}" precisa ser uma imagem.`, foco: input };
  if(opts.acceptVideo && !isVideo && !isImage) return { ok: false, erro: `"${label}" precisa ser imagem ou vídeo.`, foco: input };
  const maxBytes = isVideo ? LIMITS.FILE_VIDEO_MAX_BYTES : LIMITS.FILE_IMAGE_MAX_BYTES;
  if(file.size > maxBytes){
    const mb = Math.round(maxBytes / 1024 / 1024);
    return { ok: false, erro: `Arquivo muito grande (máx ${mb} MB).`, foco: input };
  }
  return { ok: true, file };
}

function validate(input, label, opts){
  if(opts.type === "email"){ return applyVal(vEmail(input.value), input); }
  if(opts.type === "password"){ return applyVal(vPassword(input.value), input); }
  if(opts.type === "passwordConfirm"){ return applyVal(vPasswordConfirm(opts.senha, input.value), input); }
  if(opts.type === "number"){ return applyVal(vNumber(input, label, opts), input); }
  if(opts.type === "file"){ return applyVal(vFile(input, label, opts), input); }
  return applyVal(vText(input, label, opts), input);
}

function applyVal(result, input){
  if(!result.ok){
    showToast(result.erro, "warn");
    if(result.foco?.focus) result.foco.focus();
    return null;
  }
  return result.valor !== undefined ? result.valor : (input?.value?.trim?.() ?? null);
}

function validateAll(specs){
  const valores = {};
  for(const [id, label, opts] of specs){
    const input = document.getElementById(id);
    if(!input){
      showToast(`Campo interno não encontrado: ${id}`, "error");
      return { ok: false };
    }
    const v = validate(input, label, opts);
    if(v === null) return { ok: false };
    valores[id] = v;
  }
  return { ok: true, valores };
}

const ERROR_KIND = {
  NETWORK: "network", VALIDATION: "validation", AUTH: "auth",
  PERMISSION: "permission", SERVER: "server", NOT_FOUND: "not_found",
  CONFLICT: "conflict", RATE_LIMIT: "rate_limit", UNKNOWN: "unknown",
};

function classifyError(err){
  const m = String(err?.message || err || "").toLowerCase();
  if(!err) return ERROR_KIND.UNKNOWN;
  if(/network|fetch|failed to fetch|timeout|econn|networkerror/i.test(m)) return ERROR_KIND.NETWORK;
  if(/invalid login|invalid credentials|email not confirmed|invalid email/i.test(m)) return ERROR_KIND.AUTH;
  if(/forbidden|not allowed|policy|permission|unauthorized|401|403/i.test(m)) return ERROR_KIND.PERMISSION;
  if(/not found|does not exist|no rows|404/i.test(m)) return ERROR_KIND.NOT_FOUND;
  if(/already|duplicate|conflict|unique|409/i.test(m)) return ERROR_KIND.CONFLICT;
  if(/rate limit|too many|429/i.test(m)) return ERROR_KIND.RATE_LIMIT;
  if(/server|internal|500|503/i.test(m)) return ERROR_KIND.SERVER;
  if(/invalid|required|must|should/i.test(m)) return ERROR_KIND.VALIDATION;
  return ERROR_KIND.UNKNOWN;
}

function errorMessage(err, kind){
  const m = String(err?.message || err || "");
  if(kind === ERROR_KIND.NETWORK) return "Sem conexão. Verifique sua internet e tente novamente.";
  if(kind === ERROR_KIND.AUTH){
    if(/invalid login/i.test(m)) return "E-mail ou senha incorretos.";
    if(/email not confirmed/i.test(m)) return "Confirme seu e-mail antes de entrar.";
    if(/invalid email/i.test(m)) return "E-mail inválido.";
    return "Não foi possível autenticar. Verifique seus dados.";
  }
  if(kind === ERROR_KIND.PERMISSION) return "Você não tem permissão para isso.";
  if(kind === ERROR_KIND.NOT_FOUND) return "Item não encontrado.";
  if(kind === ERROR_KIND.CONFLICT){
    if(/already registered/i.test(m)) return "Este e-mail já está cadastrado.";
    if(/duplicate/i.test(m)) return "Já existe um item igual.";
    return "Conflito — esse item já existe.";
  }
  if(kind === ERROR_KIND.RATE_LIMIT) return "Muitas tentativas. Aguarde um instante.";
  if(kind === ERROR_KIND.SERVER) return "Erro no servidor. Tente em alguns minutos.";
  if(kind === ERROR_KIND.VALIDATION) return m || "Dados inválidos.";
  return m || "Erro desconhecido.";
}

async function retry(fn, opts = {}){
  const tries = opts.tries || 3;
  const delayMs = opts.delayMs || 800;
  const kinds = opts.kinds || [ERROR_KIND.NETWORK, ERROR_KIND.SERVER];
  let lastErr;
  for(let i = 0; i < tries; i++){
    try{ return await fn(); }
    catch(e){
      lastErr = e;
      const k = classifyError(e);
      if(!kinds.includes(k) || i === tries - 1) throw e;
      await new Promise(r => setTimeout(r, delayMs * Math.pow(2, i)));
    }
  }
  throw lastErr;
}
/* =========================================================
   B6 — regras por formulário + validateForm(formId)
   validateForm monta o spec e delega ao validateAll, que
   mostra toast e foca o primeiro campo inválido.
   Retorna { ok:true, valores } ou { ok:false }.
   ========================================================= */
const FORM_RULES = {
  "form-entrar": [
    ["login-email", "E-mail", { type: "email" }],
    ["login-senha", "Senha", { type: "password" }],
  ],
  "form-criar": [
    ["signup-nome", "Nome", { min: 3, max: 120 }],
    ["signup-email", "E-mail", { type: "email" }],
    ["signup-senha", "Senha", { type: "password" }],
    ["signup-senha-confirma", "Confirmação de senha", { type: "passwordConfirm", senhaFrom: "signup-senha" }],
  ],
  "form-forgot": [
    ["forgot-email", "E-mail", { type: "email" }],
  ],
  "form-new-password": [
    ["new-password", "Nova senha", { type: "password" }],
    ["new-password-confirm", "Confirmação", { type: "passwordConfirm", senhaFrom: "new-password" }],
  ],
  "form-evento": [
    ["ev-titulo", "Título", { min: LIMITS.EVENT_TITLE_MIN, max: LIMITS.EVENT_TITLE_MAX }],
    ["ev-esporte", "Esporte", { min: 2, max: 100 }],
    ["ev-data", "Data", { min: 1 }],
    ["ev-local", "Local", { max: 200, required: false }],
    ["ev-descricao", "Descrição", { max: LIMITS.EVENT_DESC_MAX, required: false }],
  ],
  "form-noticia": [
    ["news-titulo", "Título", { min: LIMITS.NEWS_TITLE_MIN, max: LIMITS.NEWS_TITLE_MAX }],
    ["news-conteudo", "Conteúdo", { min: 1, max: LIMITS.NEWS_CONTENT_MAX }],
    ["news-imagem", "Imagem", { type: "file", acceptImage: true, required: false }],
  ],
  "form-equipe": [
    ["team-nome", "Nome da equipe", { min: 3, max: 100 }],
    ["team-esporte", "Esporte", { min: 2, max: 100 }],
    ["team-local", "Local", { max: 160, required: false }],
    ["team-tagline", "Slogan", { max: 120, required: false }],
    ["team-descricao", "Descrição", { max: 500, required: false }],
  ],
  "form-admin-request": [
    ["request-message", "Mensagem", { min: 10, max: LIMITS.MESSAGE_MAX }],
  ],
  "form-produto": [
    ["prod-titulo", "Título", { min: LIMITS.PRODUCT_TITLE_MIN, max: LIMITS.PRODUCT_TITLE_MAX }],
    ["prod-preco", "Preço", { type: "number", min: LIMITS.PRODUCT_PRICE_MIN, max: LIMITS.PRODUCT_PRICE_MAX }],
    ["prod-categoria", "Categoria", { min: 2, max: 80 }],
    ["prod-imagem", "Foto", { type: "file", acceptImage: true, required: false }],
  ],
};

function validateForm(formId){
  const rules = FORM_RULES[formId];
  if(!rules) return { ok: true };
  const specs = rules.map(([id, label, opts]) => {
    if(opts && opts.senhaFrom){
      const src = document.getElementById(opts.senhaFrom);
      return [id, label, { type: "passwordConfirm", senha: src ? src.value : "" }];
    }
    return [id, label, opts];
  });
  return validateAll(specs);
}
