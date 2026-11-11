/* ============================================================
   VISTA · Elementos de UI compartidos (toast, pantallas, header)
   ============================================================ */
(function () {
  const $ = AQ.utils.$;
  const esc = AQ.utils.escapeHtml;
  let toastTimer = null;
  let logoutHandler = null;
  let verLoginHandler = null;

  function renderBotonesHeader() {
    const { h, mount, HeaderActions } = AQ.components;
    mount(
      $("header-actions-root"),
      h(HeaderActions, {
        onVerLogin: () => verLoginHandler && verLoginHandler(),
        onLogout: () => logoutHandler && logoutHandler()
      })
    );
  }

  AQ.views.UI = {
    mostrarToast(msg, tipo) {
      const t = $("toast");
      t.innerHTML = esc(msg).replace(/(\+?\d+\s*XP)/, '<span class="xp">$1</span>');
      t.className = "toast" + (tipo ? " " + tipo : "");
      void t.offsetWidth;
      t.classList.add("visible");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => t.classList.remove("visible"), 2600);
    },

    confirmar(msg) { return window.confirm(msg); },

    /** Alterna entre la pantalla de login y la aplicación. */
    mostrarPantalla(nombre) {
      const auth = nombre === "auth";
      $("auth-screen").hidden = !auth;
      $("app").hidden = auth;
      document.title = auth
        ? "Iniciar sesión — AquaQuest Colombia"
        : "AquaQuest Colombia — Prueba de Concepto";
      window.scrollTo(0, 0);
    },

    renderHeaderUsuario(usuario) {
      $("header-avatar").textContent = usuario.avatar;
      $("header-nombre").textContent = usuario.nombre;
      $("header-correo").textContent = usuario.correo;
      renderBotonesHeader();
    },

    bindLogout(handler) {
      logoutHandler = handler;
      renderBotonesHeader();
    },

    bindVerLogin(handler) {
      verLoginHandler = handler;
      renderBotonesHeader();
    }
  };
})();
