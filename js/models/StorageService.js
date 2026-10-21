/* ============================================================
   MODELO · Servicio de persistencia (localStorage)
   Único punto de acceso al almacenamiento del navegador.
   ============================================================ */
AQ.models.Storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },

  /** Devuelve true si se guardó, false si falló (p. ej. límite de espacio). */
  set(key, valor) {
    try {
      localStorage.setItem(key, JSON.stringify(valor));
      return true;
    } catch (e) {
      console.warn("No se pudo guardar. Posible límite de almacenamiento alcanzado.");
      return false;
    }
  },

  remove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* ignorar */ }
  }
};
