/* ============================================================
   CONTROLADOR · Autenticación conectada a la Base de Datos (USUARIOS)
   Valida credenciales contra la tabla USUARIOS (SHA-256 + sal) y
   registra nuevas cuentas persistentes.
   ============================================================ */
(function () {
  const Model = AQ.models.Auth;
  const View = AQ.views.Auth;

  let onAutenticado = () => {};

  function usuarioInvitado() {
    return {
      id_usuario: 0,
      id: "u_demo",
      nombre: "Explorador/a (Invitado)",
      correo: "invitado@aquaquest.co",
      avatar: "AQ",
      rol: "consultor",
      esInvitado: true
    };
  }

  async function login() {
    View.limpiarErrores();
    const { correo, password, recordar } = View.datosLogin();
    View.setCargando("login", true);

    const r = await Model.iniciarSesion(correo, password, recordar);
    View.setCargando("login", false);

    if (!r.ok) {
      View.mostrarError("login", r.error);
      return;
    }

    View.resetForms();
    onAutenticado(r.usuario, false);
  }

  async function registro() {
    View.limpiarErrores();
    const d = View.datosRegistro();
    View.setCargando("registro", true);

    const r = await Model.registrar(d);
    View.setCargando("registro", false);

    if (!r.ok) {
      View.mostrarError("registro", r.error);
      return;
    }

    View.resetForms();
    onAutenticado(r.usuario, true);
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
