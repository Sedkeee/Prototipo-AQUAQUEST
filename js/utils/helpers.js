/* ============================================================
   NAMESPACE GLOBAL + UTILIDADES
   Se usa un namespace (AQ) en lugar de módulos ES para que la app
   funcione abriendo el HTML con doble clic (file://), sin servidor.
   Este archivo SIEMPRE debe cargarse primero.
   ============================================================ */
window.AQ = window.AQ || { models: {}, views: {}, controllers: {}, utils: {} };

AQ.utils = {
  $(id) { return document.getElementById(id); },

  formatearNumero(n) {
    if (Math.abs(n) >= 1000) return n.toFixed(0);
    if (Math.abs(n) >= 100) return n.toFixed(1);
    if (Math.abs(n) >= 10) return n.toFixed(2);
    return n.toFixed(3).replace(/\.?0+$/, "");
  },

  escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  },

  hoyDisplay() {
    return new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
  },

  /* ---------- Comprimir imagen ---------- */
  comprimirImagen(file, maxW = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;
          if (width > maxW) { height = (height * maxW) / width; width = maxW; }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};
