/* ============================================================
   VISTA · Login / Registro
   Solo manipula el DOM; la lógica vive en AuthController.
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

  let avatarSel = null;

  AQ.views.Auth = {
    init(avatares) {
      avatarSel = avatares[0];
      const cont = $("reg-avatares");
      cont.innerHTML = "";
      avatares.forEach(a => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "avatar-opt" + (a === avatarSel ? " active" : "");
        b.textContent = a;
        b.setAttribute("aria-label", "Elegir avatar " + a);
        b.addEventListener("click", () => {
          avatarSel = a;
          cont.querySelectorAll(".avatar-opt").forEach(x => x.classList.toggle("active", x === b));
        });
        cont.appendChild(b);
      });

      // Mostrar / ocultar contraseña
      document.querySelectorAll("[data-toggle-pass]").forEach(btn => {
        btn.addEventListener("click", () => {
          const input = $(btn.dataset.togglePass);
          const visible = input.type === "text";
          input.type = visible ? "password" : "text";
          btn.innerHTML = visible
            ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`
            : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`;
          btn.setAttribute("aria-label", visible ? "Mostrar contraseña" : "Ocultar contraseña");
        });
      });
    },

    mostrarTab(tab) {
      const login = tab === "login";
      $("tab-login").classList.toggle("active", login);
      $("tab-registro").classList.toggle("active", !login);
      $("tab-login").setAttribute("aria-selected", login);
      $("tab-registro").setAttribute("aria-selected", !login);
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
      const btn = $(form === "login" ? "btn-login" : "btn-registro");
      btn.disabled = cargando;
      btn.classList.toggle("cargando", cargando);
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
      $("tab-login").addEventListener("click", () => handler("login"));
      $("tab-registro").addEventListener("click", () => handler("registro"));
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
    }
  };
})();
