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
      ? `¡Cuenta creada en BD! Bienvenida/o, ${usuario.nombre}`
      : `Sesión activa: ${usuario.nombre}`);
  }

  function mostrarLoginVisual() {
    UI.mostrarPantalla("auth");
    AQ.controllers.Auth.mostrar("login");
  }

  function salir() {
    Auth.cerrarSesion();
    mostrarLoginVisual();
  }

  AQ.controllers.App = {
    init() {
      AQ.controllers.Auth.init(entrarApp);
      if (AQ.controllers.Swagger) AQ.controllers.Swagger.init();
      UI.bindLogout(salir);
      UI.bindVerLogin(mostrarLoginVisual);
      UI.bindVerSwagger(() => AQ.controllers.Swagger && AQ.controllers.Swagger.abrirModal());

      // Si hay una sesión activa en la BD entra directo; si no, abre el Login
      const usuario = Auth.usuarioActual();
      if (usuario) {
        entrarApp(usuario, false);
      } else {
        mostrarLoginVisual();
      }
    }
  };

  document.addEventListener("DOMContentLoaded", () => AQ.controllers.App.init());
})();
