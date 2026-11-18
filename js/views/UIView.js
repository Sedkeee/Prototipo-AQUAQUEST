/* ============================================================
   VISTA · Elementos de UI compartidos (toast, pantallas, header)
   ============================================================ */
(function () {
  const $ = AQ.utils.$;
  const esc = AQ.utils.escapeHtml;
  let toastTimer = null;
  let logoutHandler = null;
  let verSwaggerHandler = null;

  function mostrarSeccion(nombre) {
    let existe = false;
    document.querySelectorAll("[data-app-page]").forEach((pagina) => {
      const activa = pagina.dataset.appPage === nombre;
      pagina.hidden = !activa;
      if (activa) existe = true;
    });
    if (!existe) return;

    document.querySelectorAll(".sidebar-link").forEach((enlace) => {
      const activo = enlace.dataset.irSeccion === nombre;
      enlace.classList.toggle("active", activo);
      if (activo) enlace.setAttribute("aria-current", "page");
      else enlace.removeAttribute("aria-current");
    });
    window.scrollTo(0, 0);
  }

  function renderBotonesHeader() {
    const { h, mount, HeaderActions } = AQ.components;
    mount(
      $("header-actions-root"),
      h(HeaderActions, {
        esAdmin: $("app").dataset.role === "admin",
        onVerSwagger: () => verSwaggerHandler && verSwaggerHandler(),
        onLogout: () => logoutHandler && logoutHandler(),
      }),
    );
  }

  AQ.views.UI = {
    mostrarToast(msg, tipo) {
      const t = $("toast");
      t.innerHTML = esc(msg).replace(
        /(\+?\d+\s*XP)/,
        '<span class="xp">$1</span>',
      );
      t.className = "toast" + (tipo ? " " + tipo : "");
      void t.offsetWidth;
      t.classList.add("visible");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => t.classList.remove("visible"), 2600);
    },

    confirmar(msg) {
      return window.confirm(msg);
    },

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
      $("dashboard-nombre").textContent = usuario.nombre;
      $("app").dataset.role = usuario.rol === "admin" ? "admin" : "consultor";
      renderBotonesHeader();
    },

    bindLogout(handler) {
      logoutHandler = handler;
      renderBotonesHeader();
    },

    bindVerSwagger(handler) {
      verSwaggerHandler = handler;
      renderBotonesHeader();
    },

    bindNavegacion() {
      const hamburger = $("hamburger-btn");
      const sidebar = document.querySelector(".app-sidebar");
      const overlay = $("sidebar-overlay");

      function toggleSidebar(open) {
        if (!sidebar) return;
        const isOpen = typeof open === "boolean" ? open : !sidebar.classList.contains("open");
        sidebar.classList.toggle("open", isOpen);
        if (overlay) overlay.classList.toggle("active", isOpen);
        if (hamburger) hamburger.setAttribute("aria-expanded", String(isOpen));
        document.body.style.overflow = isOpen ? "hidden" : "";
      }

      if (hamburger) {
        hamburger.addEventListener("click", function () { toggleSidebar(); });
      }
      if (overlay) {
        overlay.addEventListener("click", function () { toggleSidebar(false); });
      }

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && sidebar && sidebar.classList.contains("open")) {
          toggleSidebar(false);
        }
      });

      $("app").addEventListener("click", (evento) => {
        const enlace =
          evento.target.closest && evento.target.closest("[data-ir-seccion]");
        if (!enlace || !$("app").contains(enlace)) return;
        evento.preventDefault();
        mostrarSeccion(enlace.dataset.irSeccion);
        /* Close sidebar on mobile after navigation */
        if (window.innerWidth <= 768) {
          toggleSidebar(false);
        }
      });
    },

    mostrarSeccion,
  };
})();
