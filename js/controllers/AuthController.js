/* ============================================================
   CONTROLADOR · Autenticación (login, registro)
   Modo demostrativo visual: permite simular inicio y registro,
   o continuar directamente como invitado sin cuenta obligatoria.
   ============================================================ */
(function () {
  const Model = AQ.models.Auth;
  const View = AQ.views.Auth;

  let onAutenticado = () => {};

  function usuarioInvitado() {
    return {
      id: "u_demo",
      nombre: "Explorador/a",
      correo: "invitado@aquaquest.co",
      avatar: "AQ",
      rol: "explorador"
    };
  }

  async function login() {
    View.limpiarErrores();
    const { correo, password, recordar } = View.datosLogin();
    View.setCargando("login", true);

    setTimeout(async () => {
      let r = await Model.iniciarSesion(correo, password, recordar);
      View.setCargando("login", false);
      if (!r.ok) {
        // En modo demostrativo visual sin MySQL, genera perfil según los datos escritos
        const alias = (correo && correo.includes("@") ? correo.split("@")[0] : "") || "Explorador/a";
        const nombre = alias.charAt(0).toUpperCase() + alias.slice(1);
        r = {
          ok: true,
          usuario: {
            id: "u_vis_" + Date.now().toString(36),
            nombre,
            correo: correo || "invitado@aquaquest.co",
            avatar: "AQ",
            rol: "explorador"
          }
        };
      }
      View.resetForms();
      onAutenticado(r.usuario, false);
    }, 200);
  }

  async function registro() {
    View.limpiarErrores();
    const d = View.datosRegistro();
    View.setCargando("registro", true);

    setTimeout(() => {
      View.setCargando("registro", false);
      const nombre = (d.nombre && d.nombre.trim()) || "Explorador/a";
      const correo = (d.correo && d.correo.trim()) || "invitado@aquaquest.co";
      const avatar = d.avatar || "AQ";
      View.resetForms();
      onAutenticado({
        id: "u_vis_" + Date.now().toString(36),
        nombre,
        correo,
        avatar,
        rol: "explorador"
      }, true);
    }, 200);
  }

  function omitir() {
    View.resetForms();
    onAutenticado(Model.usuarioActual() || usuarioInvitado(), false);
  }

  AQ.controllers.Auth = {
    /** @param callback (usuario, esNuevo) => void */
    init(callback) {
      onAutenticado = callback;
      View.init(Model.AVATARES);
      View.bindTabs(tab => View.mostrarTab(tab));
      View.bindLogin(login);
      View.bindRegistro(registro);
      View.bindPasswordInput(p => View.renderFuerza(Model.fuerzaPassword(p)));
      View.bindOmitir(omitir);
    },

    mostrar(tab = "login") {
      View.mostrarTab(tab);
    }
  };
})();
