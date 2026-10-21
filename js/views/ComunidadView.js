/* ============================================================
   VISTA · COMUNIDAD (composer, filtros y feed)
   ============================================================ */
(function () {
  const $ = AQ.utils.$;
  const esc = AQ.utils.escapeHtml;

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
      <div class="post-footer">
        <button class="btn-reaccion ${p.reaccionado ? "reaccionado" : ""}" data-accion="like">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="${p.reaccionado ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> <span class="num">${p.totalLikes}</span>
        </button>
        <button class="btn-comentar" data-accion="comentar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> <span class="num">${p.comentarios.length}</span>
        </button>
      </div>
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
          <button data-accion="enviar-comentario">Enviar</button>
        </div>
      </div>`;
  }

  AQ.views.Comunidad = {
    /**
     * @param posts       lista ya preparada por el modelo
     * @param categorias  diccionario de categorías
     * @param handlers    { onLike(id), onComentar(id, texto) }
     * @param abiertos    Set de ids con comentarios desplegados
     */
    renderFeed(posts, categorias, handlers, abiertos) {
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

        el.querySelector('[data-accion="like"]').addEventListener("click", () => handlers.onLike(p.id));
        el.querySelector('[data-accion="comentar"]').addEventListener("click", () => {
          bloque.classList.toggle("abierto");
          handlers.onToggleComentarios(p.id, bloque.classList.contains("abierto"));
        });

        const input = el.querySelector("[data-input-comentario]");
        const enviar = () => handlers.onComentar(p.id, input.value);
        el.querySelector('[data-accion="enviar-comentario"]').addEventListener("click", enviar);
        input.addEventListener("keydown", e => { if (e.key === "Enter") enviar(); });

        cont.appendChild(el);
      });
    },

    /* ---------- Composer ---------- */
    renderComposerAvatar(avatar) { $("composer-avatar").textContent = avatar; },
    textoComposer() { return $("post-texto").value; },
    setPublicarHabilitado(ok) { $("btn-publicar").disabled = !ok; },

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

    marcarActivo(selectorGrupo, boton) {
      document.querySelectorAll(selectorGrupo).forEach(x => x.classList.toggle("active", x === boton));
    },

    /* ---------- Bindings ---------- */
    bindComposer({ onTexto, onCategoria, onFoto, onQuitarFoto, onPublicar }) {
      $("post-texto").addEventListener("input", e => onTexto(e.target.value));

      document.querySelectorAll("#composer-categorias .cat-btn").forEach(b =>
        b.addEventListener("click", () => {
          this.marcarActivo("#composer-categorias .cat-btn", b);
          onCategoria(b.dataset.cat);
        }));

      const inputFoto = $("input-foto");
      $("btn-adjuntar").addEventListener("click", () => inputFoto.click());
      inputFoto.addEventListener("change", e => {
        const file = e.target.files[0];
        inputFoto.value = "";
        if (file) onFoto(file);
      });
      $("composer-quitar").addEventListener("click", onQuitarFoto);
      $("btn-publicar").addEventListener("click", onPublicar);
    },

    bindFiltros(handler) {
      document.querySelectorAll("#filtros .filtro-btn").forEach(b =>
        b.addEventListener("click", () => {
          this.marcarActivo("#filtros .filtro-btn", b);
          handler(b.dataset.filtro);
        }));
    }
  };
})();
