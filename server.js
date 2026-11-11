/* ============================================================
   SERVIDOR BACKEND · AQUAQUEST COLOMBIA (Node.js + Base de Datos)
   Sirve el frontend y la API REST conectada a la base de datos:
   - Tablas IDEAM: database/ideam_db.json (desde el CSV oficial)
   - Tabla USUARIOS: database/usuarios_db.json (autenticación SHA-256 + sal)
   Ejecución sin dependencias externas:
     node server.js
   ============================================================ */
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const DB_JSON_PATH = path.join(__dirname, "database", "ideam_db.json");
const USUARIOS_DB_PATH = path.join(__dirname, "database", "usuarios_db.json");

let dbIdeam = {
  fuente: "Data_Histórica_de_Calidad_de_Agua_Superficial_y_Sedimentos_20260911.csv",
  totalFilasCSV: 143818,
  totalZonasCSV: 101,
  totalEstacionesCSV: 243,
  zonas_hidrograficas: [],
  estaciones: []
};

if (fs.existsSync(DB_JSON_PATH)) {
  try {
    dbIdeam = JSON.parse(fs.readFileSync(DB_JSON_PATH, "utf8"));
  } catch (e) {
    console.warn("Error leyendo database/ideam_db.json:", e.message);
  }
}

function leerUsuariosDB() {
  if (!fs.existsSync(USUARIOS_DB_PATH)) return {};
  try {
    const data = JSON.parse(fs.readFileSync(USUARIOS_DB_PATH, "utf8"));
    return data.usuarios || {};
  } catch (e) {
    return {};
  }
}

function guardarUsuariosDB(usuarios) {
  fs.writeFileSync(
    USUARIOS_DB_PATH,
    JSON.stringify({ tabla: "USUARIOS", usuarios }, null, 2),
    "utf8"
  );
}

function hashPasswordNode(password, sal) {
  return crypto.createHash("sha256").update(sal + ":" + password, "utf8").digest("hex");
}

function usuarioPublico(u) {
  if (!u) return null;
  const { hash, contrasena_hash, sal, ...resto } = u;
  return resto;
}

function leerBodyJSON(req) {
  return new Promise(resolve => {
    let raw = "";
    req.on("data", chunk => { raw += chunk; });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch (e) { resolve({}); }
    });
  });
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(payload, null, 2));
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname.replace(/^\/v1/, "");

  // --- ENDPOINTS DE AUTENTICACIÓN CONTRA LA TABLA USUARIOS ---
  if (pathname === "/api/db/auth/register" && req.method === "POST") {
    const body = await leerBodyJSON(req);
    const correo = String(body.correo || "").trim().toLowerCase();
    const nombre = String(body.nombre || "").trim();
    const password = String(body.password || "");
    if (!nombre || nombre.length < 2) return sendJson(res, 400, { ok: false, error: "Tu nombre debe tener al menos 2 caracteres." });
    if (!correo.includes("@")) return sendJson(res, 400, { ok: false, error: "Escribe un correo electrónico válido." });
    if (password.length < 6) return sendJson(res, 400, { ok: false, error: "La contraseña debe tener al menos 6 caracteres." });

    const usuarios = leerUsuariosDB();
    if (usuarios[correo]) {
      return sendJson(res, 400, { ok: false, error: "Ya existe una cuenta registrada con ese correo." });
    }

    const ids = Object.values(usuarios).map(u => Number(u.id_usuario) || 0);
    const id_usuario = ids.length ? Math.max(...ids) + 1 : 1;
    const sal = crypto.randomBytes(16).toString("hex");
    const hash = hashPasswordNode(password, sal);

    const nuevo = {
      id_usuario,
      id: "u_" + id_usuario,
      nombre,
      correo,
      avatar: body.avatar || "AQ",
      rol: "consultor",
      xp_total: 0,
      creado: new Date().toISOString(),
      sal,
      hash,
      contrasena_hash: `${sal}:${hash}`
    };
    usuarios[correo] = nuevo;
    guardarUsuariosDB(usuarios);
    return sendJson(res, 201, { ok: true, usuario: usuarioPublico(nuevo) });
  }

  if (pathname === "/api/db/auth/login" && req.method === "POST") {
    const body = await leerBodyJSON(req);
    const correo = String(body.correo || "").trim().toLowerCase();
    const password = String(body.password || "");
    const usuarios = leerUsuariosDB();
    const u = usuarios[correo];
    const ERROR = "Correo o contraseña incorrectos. Verifica tus datos o crea una cuenta.";
    if (!u || hashPasswordNode(password, u.sal) !== u.hash) {
      return sendJson(res, 401, { ok: false, error: ERROR });
    }
    return sendJson(res, 200, { ok: true, usuario: usuarioPublico(u) });
  }

  if (pathname === "/api/db/auth/profile" && req.method === "PATCH") {
    const body = await leerBodyJSON(req);
    const correo = String(body.correo || "").trim().toLowerCase();
    const usuarios = leerUsuariosDB();
    const u = usuarios[correo];
    if (!u) return sendJson(res, 404, { ok: false, error: "Usuario no encontrado." });
    if (typeof body.nombre === "string") u.nombre = body.nombre.slice(0, 30);
    if (typeof body.avatar === "string") u.avatar = body.avatar;
    if (typeof body.xp_total === "number") u.xp_total = body.xp_total;
    guardarUsuariosDB(usuarios);
    return sendJson(res, 200, { ok: true, usuario: usuarioPublico(u) });
  }

  if (pathname === "/api/db/usuarios" && req.method === "GET") {
    const usuarios = leerUsuariosDB();
    return sendJson(res, 200, Object.values(usuarios).map(usuarioPublico));
  }

  // --- ENDPOINTS DE BASE DE DATOS IDEAM ---
  if (pathname === "/api/db/status" && req.method === "GET") {
    const totalUsuarios = Object.keys(leerUsuariosDB()).length;
    return sendJson(res, 200, {
      conectado: true,
      motor: "AquaQuest Relational DB (CSV IDEAM + MySQL Schema)",
      archivoOrigen: dbIdeam.fuente,
      totalFilasCSV: dbIdeam.totalFilasCSV,
      totalZonasHidrograficas: dbIdeam.totalZonasCSV,
      totalPuntosMonitoreoCSV: dbIdeam.totalEstacionesCSV,
      estacionesCargadas: dbIdeam.estaciones.length,
      usuariosRegistradosBD: totalUsuarios,
      tablasRelacionales: [
        "ZONAS_HIDROGRAFICAS",
        "PUNTOS_MONITOREO",
        "VARIABLES",
        "MUESTRAS",
        "MEDICIONES",
        "USUARIOS",
        "RETOS",
        "ACCIONES_USUARIO",
        "LOGROS",
        "USUARIO_LOGROS"
      ]
    });
  }

  if (pathname === "/api/datos/estaciones" && req.method === "GET") {
    return sendJson(res, 200, dbIdeam.estaciones);
  }

  if (pathname === "/api/datos/zonas" && req.method === "GET") {
    return sendJson(res, 200, dbIdeam.zonas_hidrograficas);
  }

  // Archivos estáticos
  let filePath = pathname === "/" ? "/index.html" : pathname;
  const absPath = path.join(__dirname, decodeURIComponent(filePath));
  if (!absPath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  if (fs.existsSync(absPath) && fs.statSync(absPath).isFile()) {
    const ext = path.extname(absPath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    fs.createReadStream(absPath).pipe(res);
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`============================================================`);
  console.log(`AquaQuest Colombia — Servidor y Base de Datos activos`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`Estaciones IDEAM cargadas: ${dbIdeam.estaciones.length} (de ${dbIdeam.totalEstacionesCSV} en CSV)`);
  console.log(`Usuarios en tabla USUARIOS: ${Object.keys(leerUsuariosDB()).length}`);
  console.log(`============================================================`);
});
