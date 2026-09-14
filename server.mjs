/* =========================================================
   SERVIDOR LOCAL DE DESENVOLVIMENTO (sem dependências)
   ---------------------------------------------------------
   O CoreMotion é um site 100% estático (HTML + CSS + JS puro).
   Para ver o app funcionando, basta servir esta pasta por HTTP
   (abrir o index.html com file:// quebra o localStorage/auth).

   Como rodar:
       node server.mjs              # porta 4173 (ou PORT=8080 node server.mjs)
   Depois abra http://localhost:4173 no navegador.

   Não é necessário para produção: no GitHub Pages basta subir os
   arquivos da raiz (ver README).
   ========================================================= */

import http from "node:http";
import { createReadStream } from "node:fs";
import { stat, readdir } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)));
const HOST = "0.0.0.0";
const PORT = Number(process.env.PORT || 4173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".sql": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function mimeFor(file) {
  return MIME[extname(file).toLowerCase()] || "application/octet-stream";
}

// Converte /qualquer/coisa em /qualquer/coisa/index.html quando for pasta,
// e bloqueia travessia de diretório (../).
function resolveTarget(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  const rel = normalize(clean).replace(/^([/\\])+/, "");
  const target = resolve(join(ROOT, rel || "."));
  if (target !== ROOT && !target.startsWith(ROOT + "/")) return null;
  return target;
}

async function sendFile(res, file) {
  const info = await stat(file).catch(() => null);
  if (!info || !info.isFile()) return false;
  res.writeHead(200, {
    "Content-Type": mimeFor(file),
    "Content-Length": info.size,
    // Durante o desenvolvimento sempre queremos a versão mais nova.
    "Cache-Control": "no-cache, no-store, must-revalidate",
  });
  await new Promise((done) => {
    const stream = createReadStream(file);
    stream.on("error", () => { res.end(); done(); });
    stream.on("end", done);
    stream.pipe(res);
  });
  return true;
}

function sendHtml(res, code, body) {
  const html = `<!doctype html><meta charset="utf-8"><title>CoreMotion</title>
<body style="font:15px/1.5 system-ui,sans-serif;background:#0a0e1a;color:#e6e8ee;padding:40px">
${body}</body>`;
  res.writeHead(code, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  res.end(html);
}

const server = http.createServer(async (req, res) => {
  try {
    let target = resolveTarget(req.url || "/");
    if (!target) return sendHtml(res, 400, "<h1>400</h1><p>Caminho inválido.</p>");

    const info = await stat(target).catch(() => null);
    const askedForFile = extname(target).length > 0;
    if (info?.isDirectory()) {
      target = join(target, "index.html");
    } else if (!info && !askedForFile) {
      // Rota sem extensão (ex.: /agenda) cai no index.html — o app é single page.
      target = join(ROOT, "index.html");
    }
    // Se pediu um arquivo com extensão que não existe, devolve 404 de verdade
    // (senso um CSS/JS faltando seria mascarado pelo HTML).

    if (await sendFile(res, target)) {
      console.log(`${new Date().toISOString()}  200  ${req.method} ${req.url}`);
      return;
    }

    const files = (await readdir(ROOT)).filter((f) => !f.startsWith("."));
    return sendHtml(
      res,
      404,
      `<h1>404 — arquivo não encontrado</h1><p>Pedido: <code>${req.url}</code></p>
       <p>Arquivos disponíveis nesta pasta:</p><ul>${files
         .map((f) => `<li><code>${f}</code></li>`)
         .join("")}</ul>`
    );
  } catch (err) {
    console.error(err);
    return sendHtml(res, 500, `<h1>500</h1><pre>${String(err?.stack || err)}</pre>`);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`CoreMotion rodando em http://${HOST}:${PORT}  (raiz: ${ROOT})`);
});
