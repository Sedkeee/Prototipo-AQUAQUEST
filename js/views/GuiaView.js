/* ============================================================
   VISTA · Guía interactiva para cuidar el agua
   ============================================================ */
(function () {
  const $ = AQ.utils.$;

  function formatearLitros(valor) {
    return valor.toLocaleString("es-CO", { maximumFractionDigits: 1 });
  }

  AQ.views.Guia = {
    bind(handlers) {
      $("guia-empezar").addEventListener("click", handlers.onEmpezar);
      $("guia-abrir-pregunta").addEventListener(
        "click",
        handlers.onAbrirPregunta,
      );
      $("guia-anterior").addEventListener("click", handlers.onAnterior);
      $("guia-siguiente").addEventListener("click", handlers.onSiguiente);
      $("guia-reiniciar").addEventListener("click", handlers.onReiniciar);
      $("guia-compartir").addEventListener("click", handlers.onCompartir);
      $("guia-minutos-ducha").addEventListener("input", handlers.onCalcular);
      $("guia-opciones").addEventListener("click", (evento) => {
        const boton =
          evento.target.closest &&
          evento.target.closest("[data-guia-respuesta]");
        if (boton && !boton.disabled) {
          handlers.onResponder(Number(boton.dataset.guiaRespuesta));
        }
      });
    },

    mostrarPantalla(nombre) {
      $("guia-intro").hidden = nombre !== "intro";
      $("guia-recorrido").hidden = nombre !== "recorrido";
      $("guia-final").hidden = nombre !== "final";
    },

    renderPaso(
      paso,
      pregunta,
      indice,
      total,
      respuesta,
      esCorrecta,
      preguntaAbierta,
    ) {
      $("guia-icono").textContent = paso.icono;
      $("guia-numero-paso").textContent = indice + 1;
      $("guia-paso-resumen").textContent = `Paso ${indice + 1} de ${total}`;
      $("guia-titulo-paso").textContent = paso.titulo;
      $("guia-consejo-texto").textContent = paso.consejo;
      $("guia-dato-texto").textContent = paso.dato;

      const fuente = $("guia-fuente");
      fuente.href = paso.fuente.url;
      fuente.textContent = paso.fuente.nombre + " ↗";

      $("guia-lectura").hidden = preguntaAbierta;
      $("guia-abrir-pregunta").hidden = preguntaAbierta;
      $("guia-pregunta").hidden = !preguntaAbierta;
      $("guia-pregunta-texto").textContent = pregunta.texto;
      const opciones = $("guia-opciones");
      opciones.replaceChildren();
      pregunta.opciones.forEach((opcion, indiceOpcion) => {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "guia-opcion";
        boton.textContent = opcion;
        boton.dataset.guiaRespuesta = indiceOpcion;
        boton.setAttribute("aria-pressed", String(respuesta === indiceOpcion));
        if (respuesta === indiceOpcion) {
          boton.classList.add(esCorrecta ? "correcta" : "incorrecta");
        }
        boton.disabled = respuesta !== null;
        opciones.appendChild(boton);
      });

      const mensaje = $("guia-respuesta-mensaje");
      mensaje.className = "guia-respuesta-mensaje";
      mensaje.textContent = "";
      if (respuesta !== null) {
        if (esCorrecta) {
          mensaje.classList.add("correcto");
          mensaje.textContent = "¡Correcto! " + pregunta.explicacion;
        } else {
          mensaje.classList.add("incorrecto");
          mensaje.textContent =
            `Incorrecto. La respuesta era: ${pregunta.opciones[pregunta.correcta]}. ` +
            pregunta.explicacion;
        }
      }

      $("guia-calculadora").hidden = indice !== 0;
      $("guia-anterior").disabled = indice === 0;
      const siguiente = $("guia-siguiente");
      siguiente.disabled = false;
      siguiente.textContent =
        indice === total - 1 ? "Terminar guía →" : "Siguiente →";
    },

    mostrarAviso(mensaje) {
      const aviso = $("guia-aviso-pregunta");
      aviso.textContent = mensaje;
      aviso.hidden = !mensaje;
    },

    renderProgreso(completados, total) {
      const alto = 72 * (completados / total);
      const agua = $("guia-agua");
      agua.setAttribute("y", String(82 - alto));
      agua.setAttribute("height", String(alto));
      $("guia-progreso").setAttribute("aria-valuenow", completados);
      $("guia-progreso-texto").textContent = `${completados} de ${total} pasos`;
    },

    leerMinutosDucha() {
      return $("guia-minutos-ducha").value.trim();
    },

    renderAhorro(resultado) {
      if (!resultado) {
        $("guia-ahorro-dia").textContent = "—";
        $("guia-ahorro-mes").textContent = "—";
        $("guia-ahorro-anio").textContent = "—";
        $("guia-calculadora-mensaje").textContent =
          "Ingresa tus minutos para ver una estimación.";
        return;
      }

      $("guia-ahorro-dia").textContent = formatearLitros(resultado.dia);
      $("guia-ahorro-mes").textContent = formatearLitros(resultado.mes);
      $("guia-ahorro-anio").textContent = formatearLitros(resultado.anio);
      $("guia-calculadora-mensaje").textContent =
        resultado.minutos <= 5
          ? "¡Excelente! Ya estás en la meta de 5 minutos o menos."
          : `Al reducir de ${resultado.minutos} a 5 minutos, podrías ahorrar aproximadamente:`;
    },

    mostrarErrorCalculadora(mensaje) {
      this.renderAhorro(null);
      $("guia-calculadora-mensaje").textContent = mensaje;
    },

    reset() {
      $("guia-minutos-ducha").value = "";
      this.renderAhorro(null);
      this.renderProgreso(0, 6);
      this.mostrarAviso("");
      this.mostrarPantalla("intro");
    },
  };
})();
