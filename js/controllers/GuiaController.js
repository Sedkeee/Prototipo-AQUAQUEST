/* ============================================================
   CONTROLADOR · Guía interactiva para cuidar el agua
   ============================================================ */
(function () {
  const View = AQ.views.Guia;
  const PASOS = [
    {
      icono: "🚿",
      titulo: "Dúchate con ritmo",
      consejo:
        "Prueba poner una canción corta o un temporizador y apunta a una ducha de 5 minutos. Cierra el agua mientras te enjabonas.",
      dato: "Una ducha estándar puede usar hasta 2,5 galones por minuto (casi 9,5 litros). Las duchas con sello WaterSense usan como máximo 2 galones por minuto.",
      fuente: {
        nombre: "EPA WaterSense · Duchas",
        url: "https://www.epa.gov/watersense/showerheads",
      },
      pregunta: {
        texto: "¿Cuánta agua puede usar por minuto una ducha estándar?",
        opciones: [
          "Hasta 2,5 galones (aprox. 9,5 litros)",
          "Hasta 0,2 galones (menos de 1 litro)",
          "Hasta 25 galones (casi 95 litros)",
        ],
        correcta: 0,
        explicacion:
          "Por eso acortar la ducha unos minutos puede marcar una diferencia.",
      },
    },
    {
      icono: "🪥",
      titulo: "Cierra la llave mientras te cepillas",
      consejo:
        "Moja el cepillo, cierra la llave mientras te cepillas y usa un vaso para enjuagarte. Haz lo mismo al afeitarte o enjabonarte las manos.",
      dato: "Una llave que gotea una vez por segundo puede desperdiciar más de 3.000 galones (unos 11.356 litros) en un año.",
      fuente: {
        nombre: "EPA WaterSense · Detecta fugas",
        url: "https://www.epa.gov/watersense/fix-leak-week",
      },
      pregunta: {
        texto: "Un grifo con una gota por segundo puede desperdiciar al año…",
        opciones: [
          "Más de 3.000 galones",
          "Solo 3 galones",
          "Exactamente 30 galones",
        ],
        correcta: 0,
        explicacion:
          "Cerrar la llave y reparar los goteos son dos hábitos sencillos.",
      },
    },
    {
      icono: "🔧",
      titulo: "Persigue las fugas",
      consejo:
        "Escucha si el sanitario sigue llenándose y revisa grifos y tuberías. Para probar el sanitario, pon unas gotas de colorante en el tanque: si aparece color en la taza sin descargar, puede haber una fuga.",
      dato: "Las fugas domésticas promedio pueden desperdiciar más de 9.300 galones (unos 35.200 litros) al año; repararlas puede reducir cerca del 10 % de la factura de agua.",
      fuente: {
        nombre: "EPA WaterSense · Detecta fugas",
        url: "https://www.epa.gov/watersense/fix-leak-week",
      },
      pregunta: {
        texto:
          "¿Cuánta agua pueden desperdiciar al año las fugas de un hogar promedio?",
        opciones: [
          "Más de 9.300 galones",
          "Unos 90 galones",
          "Menos de 10 galones",
        ],
        correcta: 0,
        explicacion:
          "Revisar el medidor y el sanitario ayuda a descubrir fugas ocultas.",
      },
    },
    {
      icono: "🧺",
      titulo: "Lava cargas completas",
      consejo:
        "Espera a reunir suficiente ropa antes de usar la lavadora. Si la máquina permite ajustar el nivel de agua, elige el adecuado para cada carga.",
      dato: "Una familia estadounidense promedio lava unas 300 cargas al año. Las lavadoras certificadas ENERGY STAR usan alrededor de 30 % menos agua que las regulares.",
      fuente: {
        nombre: "ENERGY STAR · Lavadoras",
        url: "https://www.energystar.gov/products/clothes_washers",
      },
      pregunta: {
        texto:
          "¿Cuánta menos agua usan aproximadamente las lavadoras ENERGY STAR?",
        opciones: ["30 % menos", "3 % menos", "No ahorran agua"],
        correcta: 0,
        explicacion:
          "Las cargas completas también evitan hacer ciclos innecesarios.",
      },
    },
    {
      icono: "🌿",
      titulo: "Riega con inteligencia",
      consejo:
        "Riega las plantas cuando lo necesiten, revisa la humedad de la tierra y prefiere una regadera o manguera con boquilla de cierre. Las plantas nativas suelen adaptarse mejor al clima local.",
      dato: "En Estados Unidos, los hogares usan cerca de 8.000 millones de galones de agua al día en exteriores, principalmente para regar jardines.",
      fuente: {
        nombre: "EPA WaterSense · Ahorro en exteriores",
        url: "https://www.epa.gov/watersense/outdoors",
      },
      pregunta: {
        texto:
          "¿Cuántos galones diarios se usan en exteriores en hogares de EE. UU.?",
        opciones: [
          "Cerca de 8.000 millones",
          "Cerca de 8 millones",
          "Cerca de 80.000",
        ],
        correcta: 0,
        explicacion:
          "El riego eficiente ayuda a reducir ese consumo en exteriores.",
      },
    },
    {
      icono: "🌎",
      titulo: "Protege ríos y quebradas",
      consejo:
        "No arrojes aceite, medicamentos, pinturas ni basura al desagüe o a las fuentes de agua. Separa los residuos y participa en acciones de cuidado de tu río o quebrada.",
      dato: "Solo alrededor del 2,5 % del agua de la Tierra es dulce. De esa porción, poco más del 1,2 % está en aguas superficiales como ríos y lagos.",
      fuente: {
        nombre: "USGS · Distribución del agua",
        url: "https://www.usgs.gov/water-science-school/science/where-earths-water",
      },
      pregunta: {
        texto: "¿Qué porcentaje aproximado del agua de la Tierra es dulce?",
        opciones: ["2,5 %", "25 %", "50 %"],
        correcta: 0,
        explicacion:
          "Cuidar las fuentes superficiales protege una parte muy pequeña y valiosa.",
      },
    },
  ];

  function crearPreguntasMezcladas() {
    return PASOS.map((paso) => {
      const opciones = paso.pregunta.opciones.map((texto, indice) => ({
        texto,
        correcta: indice === paso.pregunta.correcta,
      }));

      for (let indice = opciones.length - 1; indice > 0; indice -= 1) {
        const aleatorio = Math.floor(Math.random() * (indice + 1));
        [opciones[indice], opciones[aleatorio]] = [
          opciones[aleatorio],
          opciones[indice],
        ];
      }

      return {
        ...paso.pregunta,
        opciones: opciones.map((opcion) => opcion.texto),
        correcta: opciones.findIndex((opcion) => opcion.correcta),
      };
    });
  }

  let pasoActual = 0;
  let preguntas = crearPreguntasMezcladas();
  let respuestas = Array(PASOS.length).fill(null);
  let preguntasAbiertas = Array(PASOS.length).fill(false);

  function pasosCompletados() {
    return respuestas.reduce(
      (total, respuesta) => total + (respuesta !== null ? 1 : 0),
      0,
    );
  }

  function renderPaso() {
    const paso = PASOS[pasoActual];
    const pregunta = preguntas[pasoActual];
    const respuesta = respuestas[pasoActual];
    View.renderPaso(
      paso,
      pregunta,
      pasoActual,
      PASOS.length,
      respuesta,
      respuesta === pregunta.correcta,
      preguntasAbiertas[pasoActual],
    );
    View.renderProgreso(pasosCompletados(), PASOS.length);
  }

  function calcularAhorroDucha() {
    const entrada = View.leerMinutosDucha();
    if (entrada === "") {
      View.mostrarErrorCalculadora("Ingresa un número entre 0 y 60 minutos.");
      return;
    }

    const minutos = Number(entrada);
    if (!Number.isFinite(minutos) || minutos < 0 || minutos > 60) {
      View.mostrarErrorCalculadora("Ingresa un número entre 0 y 60 minutos.");
      return;
    }

    const litrosPorMinuto = 9.5;
    const ahorroDiario = Math.max(0, minutos - 5) * litrosPorMinuto;
    View.renderAhorro({
      minutos,
      dia: ahorroDiario,
      mes: ahorroDiario * 30,
      anio: ahorroDiario * 365,
    });
  }

  function compartirGuia() {
    const texto =
      "¡Completé la guía interactiva de AquaQuest y me comprometo a cuidar el agua!";
    const url = window.location.href.split("#")[0];
    if (navigator.share) {
      navigator
        .share({ title: "Guía del agua · AquaQuest", text: texto, url })
        .catch((error) => {
          if (error.name !== "AbortError") {
            AQ.views.UI.mostrarToast(
              "No se pudo compartir la guía. Inténtalo de nuevo.",
              "error",
            );
          }
        });
      return;
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(`${texto} ${url}`)
        .then(() =>
          AQ.views.UI.mostrarToast("¡Enlace copiado! Compártelo con alguien."),
        )
        .catch(() =>
          AQ.views.UI.mostrarToast(
            "No se pudo copiar el enlace. Puedes volver a intentarlo.",
            "error",
          ),
        );
      return;
    }

    window.prompt("Copia este enlace para compartir la guía:", url);
  }

  AQ.controllers.Guia = {
    init() {
      View.bind({
        onEmpezar: () => {
          pasoActual = 0;
          View.mostrarAviso("");
          View.mostrarPantalla("recorrido");
          renderPaso();
        },
        onAbrirPregunta: () => {
          preguntasAbiertas[pasoActual] = true;
          View.mostrarAviso("");
          renderPaso();
        },
        onResponder: (respuesta) => {
          const pregunta = preguntas[pasoActual];
          if (
            !preguntasAbiertas[pasoActual] ||
            respuestas[pasoActual] !== null ||
            !Number.isInteger(respuesta) ||
            respuesta < 0 ||
            respuesta >= pregunta.opciones.length
          ) {
            return;
          }
          respuestas[pasoActual] = respuesta;
          View.mostrarAviso("");
          renderPaso();
        },
        onAnterior: () => {
          if (pasoActual === 0) return;
          View.mostrarAviso("");
          pasoActual -= 1;
          renderPaso();
        },
        onSiguiente: () => {
          if (respuestas[pasoActual] === null) {
            View.mostrarAviso(
              "Debes responder la pregunta relámpago antes de avanzar.",
            );
            return;
          }
          View.mostrarAviso("");
          if (pasoActual === PASOS.length - 1) {
            View.renderProgreso(PASOS.length, PASOS.length);
            View.mostrarPantalla("final");
            return;
          }
          pasoActual += 1;
          renderPaso();
        },
        onCalcular: calcularAhorroDucha,
        onCompartir: compartirGuia,
        onReiniciar: () => {
          pasoActual = 0;
          preguntas = crearPreguntasMezcladas();
          respuestas = Array(PASOS.length).fill(null);
          preguntasAbiertas = Array(PASOS.length).fill(false);
          View.reset();
        },
      });
      View.reset();
    },
  };
})();
