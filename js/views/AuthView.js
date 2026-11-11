/* ============================================================
   VISTA · Login / Registro (con botones en React)
   Solo manipula el DOM / componentes React; la lógica vive en AuthController.
   ============================================================ */
(function () {
  const $ = AQ.utils.$;
  const NIVELES_FUERZA = [
    { txt: "", clase: "" },
    { txt: "Débil", clase: "f1" },
    { txt: "Aceptable", clase: "f2" },
    { txt: "Buena", clase: "f3" },
    { txt: "Muy segura", clase: "f4" }
  ];

  let listaAvatares = [];
  let avatarSel = null;
  let tabActual = "login";
  let cargandoLogin = false;
  let cargandoRegistro = false;
  let tabHandler = null;
  let omitirHandler = null;

  function renderTabs() {
    const { h, mount, AuthTabs } = AQ.components;
    mount(
      $("auth-tabs"),
      h(AuthTabs, {
        activeTab: tabActual,
        onSelectTab: t => tabHandler && tabHandler(t)
      })
    );
  }

  function renderAvatares() {
    const { h, mount, AvatarSelector } = AQ.components;
    mount(
      $("reg-avatares"),
      h(AvatarSelector, {
        avatares: listaAvatares,
        seleccionado: avatarSel,
        onSelect: a => {
          avatarSel = a;
          renderAvatares();
        }
      })
    );
  }

  function renderAccionesAuth() {
    const { h, mount, CloseAuthButton, AuthFormActions } = AQ.components;
    mount(
      $("auth-close-root"),
      h(CloseAuthButton, { onOmitir: () => omitirHandler && omitirHandler() })
    );
    mount(
      $("login-actions-root"),
      h(AuthFormActions, {
        modo: "login",
        cargando: cargandoLogin,
        onOmitir: () => omitirHandler && omitirHandler()
      })
    );
    mount(
      $("reg-actions-root"),
      h(AuthFormActions, {
        modo: "registro",
        cargando: cargandoRegistro,
        onOmitir: () => omitirHandler && omitirHandler()
      })
    );
  }

  function renderPasswordToggles() {
    const { h, mount, PasswordToggleButton } = AQ.components;
    document.querySelectorAll("[data-toggle-pass-root]").forEach(cont => {
      mount(cont, h(PasswordToggleButton, { inputId: cont.dataset.togglePassRoot }));
    });
  }

  AQ.views.Auth = {
    init(avatares) {
      listaAvatares = avatares;
      avatarSel = avatares[0];
      renderTabs();
      renderAvatares();
      renderAccionesAuth();
      renderPasswordToggles();
    },

    mostrarTab(tab) {
      tabActual = tab;
      const login = tab === "login";
      renderTabs();
      $("form-login").hidden = !login;
      $("form-registro").hidden = login;
      this.limpiarErrores();
      setTimeout(() => $(login ? "login-correo" : "reg-nombre").focus(), 50);
    },

    datosLogin() {
      return {
        correo: $("login-correo").value,
        password: $("login-password").value,
        recordar: $("login-recordar").checked
      };
    },

    datosRegistro() {
      return {
        nombre: $("reg-nombre").value,
        correo: $("reg-correo").value,
        password: $("reg-password").value,
        password2: $("reg-password2").value,
        avatar: avatarSel
      };
    },

    mostrarError(form, msg) {
      const el = $(form === "login" ? "login-error" : "reg-error");
      el.textContent = msg;
      el.hidden = false;
      const card = document.querySelector(".auth-card");
      card.classList.remove("shake");
      void card.offsetWidth;
      card.classList.add("shake");
    },

    limpiarErrores() {
      $("login-error").hidden = true;
      $("reg-error").hidden = true;
    },

    setCargando(form, cargando) {
      if (form === "login") cargandoLogin = cargando;
      else cargandoRegistro = cargando;
      renderAccionesAuth();
    },

    renderFuerza(nivel) {
      const f = NIVELES_FUERZA[nivel] || NIVELES_FUERZA[0];
      $("fuerza-barra").className = "fuerza-barra " + f.clase;
      $("fuerza-txt").textContent = f.txt;
    },

    resetForms() {
      $("form-login").reset();
      $("form-registro").reset();
      this.renderFuerza(0);
      this.limpiarErrores();
    },

    prellenarCorreo(correo) {
      $("login-correo").value = correo;
      $("login-password").value = "";
    },

    /* ---------- Bindings (la vista avisa, el controlador decide) ---------- */
    bindTabs(handler) {
      tabHandler = handler;
      renderTabs();
      document.querySelectorAll("[data-ir-tab]").forEach(a =>
        a.addEventListener("click", e => { e.preventDefault(); handler(a.dataset.irTab); }));
    },
    bindLogin(handler) {
      $("form-login").addEventListener("submit", e => { e.preventDefault(); handler(); });
    },
    bindRegistro(handler) {
      $("form-registro").addEventListener("submit", e => { e.preventDefault(); handler(); });
    },
    bindPasswordInput(handler) {
      $("reg-password").addEventListener("input", e => handler(e.target.value));
    },
    bindOmitir(handler) {
      omitirHandler = handler;
      renderAccionesAuth();
    }
  };
})();
