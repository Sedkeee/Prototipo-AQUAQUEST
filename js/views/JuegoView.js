/* ============================================================
   VISTA · JUEGO (perfil, retos, bitácora y modal)
   ============================================================ */
(function () {
  const $ = AQ.utils.$;
  const esc = AQ.utils.escapeHtml;

  AQ.views.Juego = {
    renderPerfil(usuario, xp, nivel) {
      const input = $("usuario-nombre");
      if (document.activeElement !== input) input.value = usuario.nombre;
      $("perfil-avatar").textContent = usuario.avatar;
      $("usuario-xp").textContent = xp;
      $("usuario-nivel").textContent = `Nivel ${nivel.numero} · ${nivel.actual.nombre}`;
      $("progreso-fill").style.width = nivel.pct + "%";
      $("progreso-txt-min").textContent = `${xp} XP`;
      $("progreso-txt-max").textContent =
        nivel.siguiente ? `${nivel.techo} XP al siguiente nivel` : "Nivel máximo alcanzado";
    },

    renderRetos(retos, completados, onRegistrar) {
      const cont = $("retos-lista");
      cont.innerHTML = "";
      retos.forEach(r => {
        const hecho = completados.includes(r.id);
        const el = document.createElement("div");
        el.className = "reto" + (hecho ? " completado" : "");
        el.innerHTML = `
          <div class="reto-icon">${r.icono}</div>
          <div class="reto-body">
            <h4>${r.titulo}</h4>
            <p>${r.desc}</p>
            <div class="reto-meta">
              <span class="xp-tag">+${r.xp} XP</span>
              <button class="btn-completar" ${hecho ? "disabled" : ""}>
                ${hecho ? "Completado" : "Registrar acción"}
              </button>
            </div>
          </div>`;
        if (!hecho) el.querySelector(".btn-completar").addEventListener("click", () => onRegistrar(r.id));
        cont.appendChild(el);
      });
    },

    renderBitacora(acciones, obtenerReto) {
      const cont = $("bitacora");
      if (acciones.length === 0) {
        cont.innerHTML = `<div class="bitacora-vacia">Aún no has registrado acciones.<br>Completa un reto para empezar.</div>`;
        return;
      }
      cont.innerHTML = "";
      acciones.slice().reverse().forEach(a => {
        const reto = obtenerReto(a.retoId);
        const div = document.createElement("div");
        div.className = "bitacora-item";
        div.innerHTML = `
          <span class="f">${a.fecha}</span>
          <span class="t">
            <strong>${reto ? reto.icono + " · " + reto.titulo : esc(a.retoId)}</strong><br>
            <span style="color:var(--muted);font-size:11.5px">${esc(a.evidencia || "(sin evidencia)")}</span>
          </span>
          <span class="xp">+${a.xp}</span>`;
        cont.appendChild(div);
      });
    },

    /* ---------- Modal ---------- */
    abrirModal(reto) {
      $("modal-titulo").textContent = "Registrar: " + reto.titulo;
      $("modal-desc").innerHTML =
        `Cuéntanos brevemente qué hiciste. Esta evidencia es para ti y quedará en tu bitácora.<br><br>
         <span style="color:var(--green-1);font-weight:600">Recompensa: +${reto.xp} XP por la acción.</span>`;
      $("modal-evidencia").value = "";
      $("modal-confirmar").disabled = true;
      $("modal-fondo").classList.add("activo");
      setTimeout(() => $("modal-evidencia").focus(), 100);
    },
    cerrarModal() { $("modal-fondo").classList.remove("activo"); },
    evidencia() { return $("modal-evidencia").value; },
    setConfirmarHabilitado(ok) { $("modal-confirmar").disabled = !ok; },

    /* ---------- Bindings ---------- */
    bindNombre(handler) {
      $("usuario-nombre").addEventListener("input", e => handler(e.target.value));
    },
    bindModal({ onCancelar, onConfirmar, onEvidencia }) {
      $("modal-cancelar").addEventListener("click", onCancelar);
      $("modal-confirmar").addEventListener("click", onConfirmar);
      $("modal-evidencia").addEventListener("input", e => onEvidencia(e.target.value));
      $("modal-fondo").addEventListener("click", e => { if (e.target.id === "modal-fondo") onCancelar(); });
      document.addEventListener("keydown", e => {
        if (e.key === "Escape" && $("modal-fondo").classList.contains("activo")) onCancelar();
      });
    },
    bindReset(handler) {
      $("btn-reset").addEventListener("click", handler);
    }
  };
})();
