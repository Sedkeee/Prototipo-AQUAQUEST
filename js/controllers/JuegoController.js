/* ============================================================
   CONTROLADOR · JUEGO
   ============================================================ */
(function () {
  const Model = AQ.models.Juego;
  const Auth = AQ.models.Auth;
  const View = AQ.views.Juego;
  const UI = AQ.views.UI;

  let usuario = null;
  let retoSeleccionado = null;
  let enlazado = false;
  let onPerfilCambiado = () => {};

  function renderTodo() {
    const xp = Model.xp();
    View.renderPerfil(usuario, xp, Model.calcularNivel(xp));
    View.renderRetos(Model.RETOS, Model.retosCompletados(), abrirModal);
    View.renderBitacora(Model.acciones(), id => Model.obtenerReto(id));
  }

  function abrirModal(retoId) {
    retoSeleccionado = Model.obtenerReto(retoId);
    if (retoSeleccionado) View.abrirModal(retoSeleccionado);
  }

  function cerrarModal() {
    View.cerrarModal();
    retoSeleccionado = null;
  }

  function confirmarAccion() {
    if (!retoSeleccionado) return;
    const xpGanado = Model.registrarAccion(retoSeleccionado.id, View.evidencia());
    if (xpGanado === null) return;
    cerrarModal();
    renderTodo();
    UI.mostrarToast(`+${xpGanado} XP · ¡Acción registrada!`);
  }

  function cambiarNombre(valor) {
    const actualizado = Auth.actualizarPerfil({ nombre: valor.trim() || "Anónimo" });
    if (!actualizado) return;
    usuario = actualizado;
    onPerfilCambiado(usuario);
  }

  function resetProgreso() {
    if (!UI.confirmar("¿Seguro que quieres borrar tu progreso (XP, retos, bitácora y posts propios)?\nLas publicaciones de otras personas se mantendrán.")) return;
    Model.reset();
    AQ.models.Comunidad.resetUsuario();
    renderTodo();
    AQ.controllers.Comunidad.refrescar();
    UI.mostrarToast("Progreso reiniciado");
  }

  AQ.controllers.Juego = {
    /** @param onCambioPerfil callback cuando el usuario edita su nombre */
    init(usuarioActual, onCambioPerfil) {
      usuario = usuarioActual;
      onPerfilCambiado = onCambioPerfil || (() => {});
      Model.cargar(usuario.id);

      if (!enlazado) {
        View.bindNombre(cambiarNombre);
        View.bindModal({
          onCancelar: cerrarModal,
          onConfirmar: confirmarAccion,
          onEvidencia: txt => View.setConfirmarHabilitado(txt.trim().length >= 3)
        });
        View.bindReset(resetProgreso);
        enlazado = true;
      }
      cerrarModal();
      renderTodo();
    }
  };
})();
