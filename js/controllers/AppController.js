/* ============================================================
   CONTROLADOR PRINCIPAL · Arranque y control de sesión
   Decide si se muestra el login o la aplicación (guard de rutas).
   ============================================================ */
(function () {
  const Auth = AQ.models.Auth;
  const UI = AQ.views.UI;
  let datosIniciados = false;

  function entrarApp(usuario, esNuevo) {
    UI.mostrarPantalla("app");
    UI.renderHeaderUsuario(usuario);

    if (!datosIniciados) { AQ.controllers.Datos.init(); datosIniciados = true; }
    AQ.controllers.Comunidad.init(usuario);
    AQ.controllers.Juego.init(usuario, u => {
      UI.renderHeaderUsuario(u);
      AQ.controllers.Comunidad.actualizarUsuario(u);
    });

    UI.mostrarToast(esNuevo
      ? `¡Bienvenida/o a AquaQuest, ${usuario.nombre}!`
      : `Hola de nuevo, ${usuario.nombre}`);
  }

  function salir() {
    Auth.cerrarSesion();
    UI.mostrarPantalla("auth");
    AQ.controllers.Auth.mostrar("login");
  }

  AQ.controllers.App = {
    init() {
      AQ.controllers.Auth.init(entrarApp);
      UI.bindLogout(salir);

      const usuario = Auth.usuarioActual();
      if (usuario) entrarApp(usuario, false);
      else { UI.mostrarPantalla("auth"); AQ.controllers.Auth.mostrar("login"); }
    }
  };

  document.addEventListener("DOMContentLoaded", () => AQ.controllers.App.init());
})();
