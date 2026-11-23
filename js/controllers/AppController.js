/* ============================================================
   CONTROLADOR PRINCIPAL · Arranque y control de sesión
   Permite explorar la aplicación libremente sin obligar a iniciar
   sesión, manteniendo disponible el acceso al Login/Registro.
   ============================================================ */
(function () {
  const Auth = AQ.models.Auth;
  const UI = AQ.views.UI;
  let datosIniciados = false;

  const USUARIO_INVITADO = {
    id_usuario: 0,
    id: "invitado",
    nombre: "Explorador/a Invitado",
    correo: "Modo libre (sin sesión)",
    avatar: "AQ",
    rol: "invitado",
    esInvitado: true,
    xp_total: 0,
  };

  function entrarApp(usuario, esNuevo) {
    const uActivo = usuario || USUARIO_INVITADO;
    UI.mostrarPantalla("app");
    UI.renderHeaderUsuario(uActivo);
    UI.mostrarSeccion("inicio");

    if (!datosIniciados) {
      AQ.controllers.Datos.init();
      datosIniciados = true;
    }
    AQ.controllers.Comunidad.init(uActivo);
    AQ.controllers.Juego.init(uActivo, (u) => {
      UI.renderHeaderUsuario(u);
      AQ.controllers.Comunidad.actualizarUsuario(u);
    });

    if (!uActivo.esInvitado) {
      UI.mostrarToast(
        esNuevo
          ? `¡Bienvenida/o a AquaQuest, ${uActivo.nombre}!`
          : `Hola de nuevo, ${uActivo.nombre}`,
      );
    }
  }

  function mostrarLoginVisual() {
    UI.mostrarPantalla("auth");
    AQ.controllers.Auth.mostrar("login");
  }

  function entrarComoInvitado() {
    entrarApp(Auth.usuarioActual() || USUARIO_INVITADO, false);
  }

  function salir() {
    Auth.cerrarSesion();
    entrarApp(USUARIO_INVITADO, false);
    UI.mostrarToast("Sesión cerrada — estás en modo invitado");
  }

  AQ.controllers.App = {
    init() {
      AQ.controllers.Auth.init(entrarApp, entrarComoInvitado);
      AQ.controllers.Guia.init();
      UI.bindLogout(salir);
      if (UI.bindVerLogin) UI.bindVerLogin(mostrarLoginVisual);
      UI.bindVerSwagger(() => AQ.controllers.Swagger.abrirModal());
      UI.bindNavegacion();
      AQ.controllers.Swagger.init();
      if (AQ.controllers.Contacto) AQ.controllers.Contacto.init();

      // Entra directamente a la página principal (con sesión activa o como invitado)
      const usuario = Auth.usuarioActual();
      entrarApp(usuario || USUARIO_INVITADO, false);
    },
  };

  document.addEventListener("DOMContentLoaded", () =>
    AQ.controllers.App.init(),
  );
})();
