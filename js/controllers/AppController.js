/* ============================================================
   CONTROLADOR PRINCIPAL · Arranque y control de sesión
   Decide si se muestra el login o la aplicación (guard de rutas).
   ============================================================ */
(function () {
  const Auth = AQ.models.Auth;
  const UI = AQ.views.UI;
  let datosIniciados = false;

  const USUARIO_INVITADO = {
    id: "u_demo",
    nombre: "Explorador/a",
    correo: "invitado@aquaquest.co",
    avatar: "AQ",
    rol: "explorador"
  };

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
      UI.bindLogout(salir);
      UI.bindVerLogin(mostrarLoginVisual);

      // Ingreso directo como invitado sin forzar login obligatorio
      const usuario = Auth.usuarioActual() || USUARIO_INVITADO;
      entrarApp(usuario, false);
    }
  };

  document.addEventListener("DOMContentLoaded", () => AQ.controllers.App.init());
})();
