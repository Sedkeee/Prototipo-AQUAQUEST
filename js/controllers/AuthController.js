/* ============================================================
   CONTROLADOR · Autenticación (login, registro)
   Recibe eventos de AuthView, consulta AuthModel y avisa al
   AppController cuando hay una sesión válida.
   ============================================================ */
(function () {
  const Model = AQ.models.Auth;
  const View = AQ.views.Auth;

  let onAutenticado = () => {};

  async function login() {
    View.limpiarErrores();
    const { correo, password, recordar } = View.datosLogin();
    View.setCargando("login", true);
    const r = await Model.iniciarSesion(correo, password, recordar);
    View.setCargando("login", false);
    if (!r.ok) return View.mostrarError("login", r.error);
    View.resetForms();
    onAutenticado(r.usuario, false);
  }

  async function registro() {
    View.limpiarErrores();
    const d = View.datosRegistro();

    const error = Model.validarRegistro(d);
    if (error) return View.mostrarError("registro", error);
    if (d.password !== d.password2) return View.mostrarError("registro", "Las contraseñas no coinciden.");

    View.setCargando("registro", true);
    const r = await Model.registrar(d);
    if (!r.ok) { View.setCargando("registro", false); return View.mostrarError("registro", r.error); }

    // Inicia sesión automáticamente tras crear la cuenta
    const s = await Model.iniciarSesion(d.correo, d.password, false);
    View.setCargando("registro", false);
    View.resetForms();
    if (s.ok) onAutenticado(s.usuario, true);
    else { View.mostrarTab("login"); View.prellenarCorreo(d.correo); }
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
    },

    mostrar(tab = "login") {
      View.mostrarTab(tab);
    }
  };
})();
