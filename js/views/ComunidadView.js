/* ============================================================
   VISTA · COMUNIDAD (composer, filtros y feed con botones en React)
   ============================================================ */
(function () {
  const $ = AQ.utils.$;
  const esc = AQ.utils.escapeHtml;

  let categoriaActiva = "accion";
  let filtroActivo = "todos";
  let publicarHabilitado = false;
  let composerHandlers = {};
  let filtroHandler = null;

  function renderCategorias() {
    const { h, mount, ComposerCategoryButtons } = AQ.components;
    mount(
      $("composer-categorias"),
      h(ComposerCategoryButtons, {
        activa: categoriaActiva,
        onSelect: cat => {
          categoriaActiva = cat;
          renderCategorias();
          if (composerHandlers.onCategoria) composerHandlers.onCategoria(cat);
        }
      })
    );
  }

  function renderComposerFooter() {
    const { h, mount, ComposerFooterActions, RemovePreviewButton } = AQ.components;
    mount(
      $("composer-quitar-root"),
      h(RemovePreviewButton, {
        onClick: () => composerHandlers.onQuitarFoto && composerHandlers.onQuitarFoto()
      })
    );
    mount(
      $("composer-footer-root"),
      h(ComposerFooterActions, {
        publicarHabilitado,
        onAdjuntar: () => {
          const inputFoto = $("input-foto");
          if (inputFoto) inputFoto.click();
        },
        onPublicar: () => composerHandlers.onPublicar && composerHandlers.onPublicar()
      })
    );
  }

  function renderFiltros() {
    const { h, mount, CommunityFilterButtons } = AQ.components;
    mount(
      $("filtros"),
      h(CommunityFilterButtons, {
        activo: filtroActivo,
        onSelect: f => {
          filtroActivo = f;
          renderFiltros();
          if (filtroHandler) filtroHandler(f);
        }
      })
    );
  }

  function plantillaPost(p, cat) {
    return `
      <div class="post-header">
        <div class="post-avatar">${esc(p.avatar || "AQ")}</div>
        <div class="post-meta">
          <div class="nombre">${esc(p.autor)}${p.esMio ? ' <span class="tu-tag">tú</span>' : ""}</div>
          <div class="fecha">${esc(p.fecha)}</div>
        </div>
        <span class="post-cat ${cat.clase}">${cat.label}</span>
      </div>
      <div class="post-cuerpo">${esc(p.texto)}</div>
      ${p.imagen && String(p.imagen).startsWith("data:image/")
        ? `<div class="post-imagen"><img src="${p.imagen}" alt="Imagen del post" loading="lazy"></div>` : ""}
      <div class="post-footer" data-post-footer></div>
      <div class="comentarios" data-comentarios>
        <div class="comentarios-lista">
          ${p.comentarios.map(c => `
            <div class="comentario">
              <span class="c-nombre">${esc(c.autor)}</span>
              <span class="c-fecha">${esc(c.fecha)}</span><br>
              <span class="c-texto">${esc(c.texto)}</span>
            </div>`).join("")}
        </div>
        <div class="comentario-form">
          <input type="text" placeholder="Escribe un comentario..." maxlength="200" data-input-comentario>
          <span data-comentario-btn-root style="display:contents"></span>
        </div>
      </div>`;
  }

  AQ.views.Comunidad = {
    /**
     * @param posts       lista ya preparada por el modelo
     * @param categorias  diccionario de categorías
     * @param handlers    { onLike(id), onComentar(id, texto), onToggleComentarios(id, abierto) }
     * @param abiertos    Set de ids con comentarios desplegados
     */
    renderFeed(posts, categorias, handlers, abiertos) {
      const { h, mount, PostFooterButtons, CommentSendButton } = AQ.components;
      const cont = $("feed");
      cont.innerHTML = "";

      if (posts.length === 0) {
        cont.innerHTML = `<div class="feed-vacio">No hay publicaciones en esta categoría todavía.<br>¡Sé la primera persona en compartir algo!</div>`;
        return;
      }

      posts.forEach(p => {
        const cat = categorias[p.categoria] || categorias.accion;
        const el = document.createElement("article");
        el.className = "post";
        el.innerHTML = plantillaPost(p, cat);

        const bloque = el.querySelector("[data-comentarios]");
        if (abiertos.has(p.id)) bloque.classList.add("abierto");

        mount(
          el.querySelector("[data-post-footer]"),
          h(PostFooterButtons, {
            reaccionado: p.reaccionado,
            totalLikes: p.totalLikes,
            totalComentarios: p.comentarios.length,
            onLike: () => handlers.onLike(p.id),
            onToggleComentarios: () => {
              bloque.classList.toggle("abierto");
              handlers.onToggleComentarios(p.id, bloque.classList.contains("abierto"));
            }
          })
        );

        const input = el.querySelector("[data-input-comentario]");
        const enviar = () => handlers.onComentar(p.id, input.value);
        mount(
          el.querySelector("[data-comentario-btn-root]"),
          h(CommentSendButton, { onSend: enviar })
        );
        input.addEventListener("keydown", e => { if (e.key === "Enter") enviar(); });

        cont.appendChild(el);
      });
    },

    /* ---------- Composer ---------- */
    renderComposerAvatar(avatar) { $("composer-avatar").textContent = avatar; },
    textoComposer() { return $("post-texto").value; },
    setPublicarHabilitado(ok) {
      publicarHabilitado = Boolean(ok);
      renderComposerFooter();
    },

    mostrarPreview(dataUrl) {
      $("composer-preview-img").src = dataUrl;
      $("composer-preview").classList.add("activa");
    },
    ocultarPreview() {
      $("composer-preview").classList.remove("activa");
      $("composer-preview-img").removeAttribute("src");
    },
    limpiarComposer() {
      $("post-texto").value = "";
      this.ocultarPreview();
      this.setPublicarHabilitado(false);
    },

    /* ---------- Bindings ---------- */
    bindComposer({ onTexto, onCategoria, onFoto, onQuitarFoto, onPublicar }) {
      composerHandlers = { onTexto, onCategoria, onFoto, onQuitarFoto, onPublicar };
      $("post-texto").addEventListener("input", e => onTexto(e.target.value));

      renderCategorias();
      renderComposerFooter();

      const inputFoto = $("input-foto");
      inputFoto.addEventListener("change", e => {
        const file = e.target.files[0];
        inputFoto.value = "";
        if (file) onFoto(file);
      });
    },

    bindFiltros(handler) {
      filtroHandler = handler;
      renderFiltros();
    }
  };
})();
