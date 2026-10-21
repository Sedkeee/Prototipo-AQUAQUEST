/* ============================================================
   CONTROLADOR · COMUNIDAD
   ============================================================ */
(function () {
  const Model = AQ.models.Comunidad;
  const View = AQ.views.Comunidad;
  const UI = AQ.views.UI;

  let usuario = null;
  let filtroActual = "todos";
  let categoriaComposer = "accion";
  let imagenComposer = null;
  let enlazado = false;
  const comentariosAbiertos = new Set();

  const handlersFeed = {
    onLike(id) { Model.toggleLike(id); refrescar(); },
    onComentar(id, texto) {
      const t = String(texto || "").trim();
      if (t.length < 2) return;
      if (!Model.comentar(id, usuario.nombre, t)) return UI.mostrarToast("No se pudo guardar el comentario");
      comentariosAbiertos.add(id);
      refrescar();
    },
    onToggleComentarios(id, abierto) {
      if (abierto) comentariosAbiertos.add(id); else comentariosAbiertos.delete(id);
    }
  };

  function refrescar() {
    View.renderFeed(Model.obtenerPosts(filtroActual), Model.CATEGORIAS, handlersFeed, comentariosAbiertos);
  }

  async function adjuntarFoto(file) {
    if (!file.type.startsWith("image/")) return UI.mostrarToast("Solo se permiten imágenes");
    try {
      imagenComposer = await AQ.utils.comprimirImagen(file, 800, 0.7);
      View.mostrarPreview(imagenComposer);
    } catch (e) {
      UI.mostrarToast("No se pudo procesar la imagen");
    }
  }

  function quitarFoto() {
    imagenComposer = null;
    View.ocultarPreview();
  }

  // Publicar — SIN XP. Solo se comparte.
  function publicar() {
    const texto = View.textoComposer().trim();
    if (texto.length < 3) return;
    const post = Model.publicar({
      autor: usuario.nombre, avatar: usuario.avatar,
      categoria: categoriaComposer, texto, imagen: imagenComposer
    });
    if (!post) return UI.mostrarToast("Espacio lleno. Considera borrar algunas fotos.");
    imagenComposer = null;
    View.limpiarComposer();
    refrescar();
    UI.mostrarToast("Publicado · Gracias por compartir", "purple");
  }

  AQ.controllers.Comunidad = {
    init(usuarioActual) {
      usuario = usuarioActual;
      Model.cargar(usuario.id);
      comentariosAbiertos.clear();

      if (!enlazado) {
        View.bindComposer({
          onTexto: t => View.setPublicarHabilitado(t.trim().length >= 3),
          onCategoria: c => { categoriaComposer = c; },
          onFoto: adjuntarFoto,
          onQuitarFoto: quitarFoto,
          onPublicar: publicar
        });
        View.bindFiltros(f => { filtroActual = f; refrescar(); });
        enlazado = true;
      }

      imagenComposer = null;
      View.limpiarComposer();
      View.renderComposerAvatar(usuario.avatar);
      refrescar();
    },

    actualizarUsuario(u) {
      usuario = u;
      View.renderComposerAvatar(u.avatar);
    },

    refrescar
  };
})();
