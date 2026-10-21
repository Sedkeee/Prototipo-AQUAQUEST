/* ============================================================
   MODELO · Autenticación (usuarios y sesión)
   Simulado en el navegador: las cuentas viven en localStorage.
   Las contraseñas NO se guardan en texto plano: se guarda un hash
   SHA-256 con sal aleatoria. Para producción se necesita un backend.
   ============================================================ */
(function () {
  const S = AQ.models.Storage;

  const USUARIOS_KEY = "aquaquest_usuarios";
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
    // Respaldo (navegadores sin crypto.subtle): FNV-1a. Solo para el prototipo.
    let h = 2166136261;
    for (const b of data) { h ^= b; h = Math.imul(h, 16777619); }
    return "fnv" + (h >>> 0).toString(16);
  }

  const usuarios = () => S.get(USUARIOS_KEY, {});
  const guardarUsuarios = u => S.set(USUARIOS_KEY, u);

  /** Quita los campos sensibles antes de exponer el usuario. */
  function publico(u) {
    if (!u) return null;
    const { hash, sal, ...resto } = u;
    return resto;
  }

  function leerSesion() {
    try {
      const raw = sessionStorage.getItem(SESION_KEY) || localStorage.getItem(SESION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  AQ.models.Auth = {
    AVATARES,

    /** Devuelve un mensaje de error o null si los datos son válidos. */
    validarRegistro({ nombre, correo, password }) {
      if (!nombre || nombre.trim().length < 2) return "Tu nombre debe tener al menos 2 caracteres.";
      if (nombre.trim().length > 30) return "Tu nombre puede tener máximo 30 caracteres.";
      if (!RE_CORREO.test(normalizar(correo))) return "Escribe un correo válido.";
      if (!password || password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
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
      return !!usuarios()[normalizar(correo)];
    },

    async registrar({ nombre, correo, password, avatar }) {
      const error = this.validarRegistro({ nombre, correo, password });
      if (error) return { ok: false, error };

      const c = normalizar(correo);
      const lista = usuarios();
      if (lista[c]) return { ok: false, error: "Ya existe una cuenta con ese correo." };

      const sal = generarSal();
      const usuario = {
        id: "u_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        nombre: nombre.trim(),
        correo: c,
        avatar: AVATARES.includes(avatar) ? avatar : AVATARES[0],
        rol: "explorador",
        creado: new Date().toISOString(),
        sal,
        hash: await hashPassword(password, sal)
      };
      lista[c] = usuario;
      if (!guardarUsuarios(lista)) return { ok: false, error: "No se pudo guardar la cuenta en este navegador." };
      return { ok: true, usuario: publico(usuario) };
    },

    async iniciarSesion(correo, password, recordar = false) {
      const c = normalizar(correo);
      if (!c || !password) return { ok: false, error: "Escribe tu correo y tu contraseña." };

      const u = usuarios()[c];
      const ERROR = "Correo o contraseña incorrectos.";
      if (!u) return { ok: false, error: ERROR };
      if ((await hashPassword(password, u.sal)) !== u.hash) return { ok: false, error: ERROR };

      this.cerrarSesion();
      const sesion = JSON.stringify({ correo: c, inicio: Date.now() });
      (recordar ? localStorage : sessionStorage).setItem(SESION_KEY, sesion);
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
      return publico(usuarios()[s.correo]) || null;
    },

    actualizarPerfil(cambios) {
      const s = leerSesion();
      if (!s) return null;
      const lista = usuarios();
      const u = lista[s.correo];
      if (!u) return null;
      if (typeof cambios.nombre === "string") u.nombre = cambios.nombre.slice(0, 30);
      if (cambios.avatar && AVATARES.includes(cambios.avatar)) u.avatar = cambios.avatar;
      guardarUsuarios(lista);
      return publico(u);
    }
  };
})();
