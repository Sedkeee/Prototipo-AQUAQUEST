/* ============================================================
   MODELO · Autenticación conectada a la tabla USUARIOS (BD)
   Implementa el esquema del Diagrama Relacional:
   USUARIOS (id_usuario, nombre, correo, contrasena_hash, rol, xp_total, avatar)
   Se sincroniza automáticamente con el backend (server.js / MySQL)
   cuando está activo, y mantiene persistencia local en el navegador
   para funcionar también al abrir index.html directamente.
   ============================================================ */
(function () {
  const S = AQ.models.Storage;

  const USUARIOS_KEY = "aquaquest_usuarios_db";
  const SESION_KEY = "aquaquest_sesion";
  const AVATARES = ["AQ", "CO", "AG", "EX", "PR", "ID", "CU", "SN"];
  const RE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const toHex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  const normalizar = c => String(c || "").trim().toLowerCase();

  function generarSal() {
    const a = new Uint8Array(16);
    crypto.getRandomValues(a);
    return toHex(a);
  }

  async function hashPassword(password, sal) {
    const data = new TextEncoder().encode(sal + ":" + password);
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", data);
      return toHex(new Uint8Array(buf));
    }
    let h = 2166136261;
    for (const b of data) { h ^= b; h = Math.imul(h, 16777619); }
    return "fnv" + (h >>> 0).toString(16);
  }

  const leerTablaUsuarios = () => S.get(USUARIOS_KEY, {});
  const guardarTablaUsuarios = u => S.set(USUARIOS_KEY, u);

  /** Quita los campos sensibles antes de exponer el registro de USUARIOS. */
  function publico(u) {
    if (!u) return null;
    const { hash, contrasena_hash, sal, ...resto } = u;
    return resto;
  }

  function leerSesion() {
    try {
      const raw = sessionStorage.getItem(SESION_KEY) || localStorage.getItem(SESION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function guardarSesion(correo, recordar) {
    const sesion = JSON.stringify({ correo: normalizar(correo), inicio: Date.now() });
    (recordar ? localStorage : sessionStorage).setItem(SESION_KEY, sesion);
  }

  function siguienteIdUsuario(lista) {
    const ids = Object.values(lista).map(u => Number(u.id_usuario) || 0);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  /**
   * Inicializa la tabla USUARIOS con las cuentas semilla de la base de datos
   * si aún no existen en el almacenamiento local.
   */
  async function inicializarSemillaBD() {
    const lista = leerTablaUsuarios();
    if (lista["camila@aquaquest.co"] && lista["admin@aquaquest.co"]) return;

    const salCamila = "a1b2c3d4e5f60123456789abcdef0123";
    const hashCamila = await hashPassword("Agua2026!", salCamila);
    if (!lista["camila@aquaquest.co"]) {
      lista["camila@aquaquest.co"] = {
        id_usuario: 1,
        id: "u_1",
        nombre: "Camila Ríos",
        correo: "camila@aquaquest.co",
        avatar: "CO",
        rol: "consultor",
        xp_total: 120,
        creado: "2026-09-01T10:00:00.000Z",
        sal: salCamila,
        hash: hashCamila,
        contrasena_hash: `${salCamila}:${hashCamila}`
      };
    }

    const salAdmin = "f6e5d4c3b2a10123456789abcdef9876";
    const hashAdmin = await hashPassword("Admin123!", salAdmin);
    if (!lista["admin@aquaquest.co"]) {
      lista["admin@aquaquest.co"] = {
        id_usuario: 2,
        id: "u_2",
        nombre: "Admin IDEAM",
        correo: "admin@aquaquest.co",
        avatar: "ID",
        rol: "admin",
        xp_total: 500,
        creado: "2026-09-01T10:00:00.000Z",
        sal: salAdmin,
        hash: hashAdmin,
        contrasena_hash: `${salAdmin}:${hashAdmin}`
      };
    }

    guardarTablaUsuarios(lista);
  }

  // Intentar sincronizar con el backend Node.js si está corriendo en http(s)://
  async function peticionBackend(ruta, metodo, body) {
    if (window.location.protocol === "file:") return null;
    try {
      const res = await fetch(ruta, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
      });
      if (res.status === 404) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  const promesaSemilla = inicializarSemillaBD();

  AQ.models.Auth = {
    AVATARES,

    /** Devuelve un mensaje de error o null si los datos son válidos. */
    validarRegistro({ nombre, correo, password, password2 }) {
      if (!nombre || nombre.trim().length < 2) return "Tu nombre debe tener al menos 2 caracteres.";
      if (nombre.trim().length > 30) return "Tu nombre puede tener máximo 30 caracteres.";
      if (!RE_CORREO.test(normalizar(correo))) return "Escribe un correo electrónico válido.";
      if (!password || password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
      if (password2 !== undefined && password !== password2) return "Las contraseñas no coinciden.";
      return null;
    },

    /** 0 a 4 — usado para el medidor de seguridad de la contraseña. */
    fuerzaPassword(p) {
      if (!p) return 0;
      let s = 0;
      if (p.length >= 6) s++;
      if (p.length >= 10) s++;
      if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
      if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
      return Math.min(4, s);
    },

    existeCorreo(correo) {
      return !!leerTablaUsuarios()[normalizar(correo)];
    },

    listarUsuariosPublicos() {
      return Object.values(leerTablaUsuarios()).map(publico);
    },

    async registrar({ nombre, correo, password, password2, avatar }) {
      await promesaSemilla;
      const error = this.validarRegistro({ nombre, correo, password, password2 });
      if (error) return { ok: false, error };

      // Si el backend está activo, registrar también en el servidor
      const remoto = await peticionBackend("/api/db/auth/register", "POST", {
        nombre, correo, password, avatar
      });
      if (remoto && !remoto.ok) return remoto;

      const c = normalizar(correo);
      const lista = leerTablaUsuarios();
      if (lista[c]) return { ok: false, error: "Ya existe una cuenta registrada con ese correo." };

      const sal = generarSal();
      const hash = await hashPassword(password, sal);
      const idNum = remoto && remoto.usuario && remoto.usuario.id_usuario
        ? remoto.usuario.id_usuario
        : siguienteIdUsuario(lista);

      const usuario = {
        id_usuario: idNum,
        id: "u_" + idNum,
        nombre: nombre.trim(),
        correo: c,
        avatar: AVATARES.includes(avatar) ? avatar : AVATARES[0],
        rol: "consultor",
        xp_total: 0,
        creado: new Date().toISOString(),
        sal,
        hash,
        contrasena_hash: `${sal}:${hash}`
      };

      lista[c] = usuario;
      if (!guardarTablaUsuarios(lista)) {
        return { ok: false, error: "No se pudo guardar el usuario en la base de datos." };
      }

      this.cerrarSesion();
      guardarSesion(c, true);
      return { ok: true, usuario: publico(usuario) };
    },

    async iniciarSesion(correo, password, recordar = false) {
      await promesaSemilla;
      const c = normalizar(correo);
      if (!c || !password) return { ok: false, error: "Ingresa tu correo electrónico y tu contraseña." };

      // Intentar validar contra el servidor backend si está activo
      const remoto = await peticionBackend("/api/db/auth/login", "POST", { correo: c, password });
      if (remoto) {
        if (!remoto.ok) return remoto;
        const lista = leerTablaUsuarios();
        lista[c] = { ...(lista[c] || {}), ...remoto.usuario };
        guardarTablaUsuarios(lista);
        this.cerrarSesion();
        guardarSesion(c, recordar);
        return { ok: true, usuario: publico(lista[c]) };
      }

      const u = leerTablaUsuarios()[c];
      const ERROR = "Correo o contraseña incorrectos. Verifica tus datos o crea una cuenta.";
      if (!u) return { ok: false, error: ERROR };
      if ((await hashPassword(password, u.sal)) !== u.hash) return { ok: false, error: ERROR };

      this.cerrarSesion();
      guardarSesion(c, recordar);
      return { ok: true, usuario: publico(u) };
    },

    cerrarSesion() {
      try {
        sessionStorage.removeItem(SESION_KEY);
        localStorage.removeItem(SESION_KEY);
      } catch (e) { /* ignorar */ }
    },

    usuarioActual() {
      const s = leerSesion();
      if (!s) return null;
      return publico(leerTablaUsuarios()[s.correo]) || null;
    },

    actualizarPerfil(cambios) {
      const s = leerSesion();
      if (!s) return null;
      const lista = leerTablaUsuarios();
      const u = lista[s.correo];
      if (!u) return null;
      if (typeof cambios.nombre === "string") u.nombre = cambios.nombre.slice(0, 30);
      if (cambios.avatar && AVATARES.includes(cambios.avatar)) u.avatar = cambios.avatar;
      if (typeof cambios.xp_total === "number") u.xp_total = cambios.xp_total;
      guardarTablaUsuarios(lista);
      peticionBackend("/api/db/auth/profile", "PATCH", { correo: s.correo, ...cambios });
      return publico(u);
    }
  };
})();
