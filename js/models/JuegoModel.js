/* ============================================================
   MODELO · JUEGO — retos tipo B, XP, niveles y bitácora
   El progreso se guarda POR USUARIO (clave aquaquest_juego_<id>).
   ============================================================ */
(function () {
  const S = AQ.models.Storage;

  const RETOS = [
    { id:"r1", icono:"01", xp:20, titulo:"Cierra la llave mientras te cepillas",
      desc:"Durante tu próximo cepillado, cierra la llave mientras no la necesites. Es una de las acciones más simples y con mayor impacto diario." },
    { id:"r2", icono:"02", xp:40, titulo:"Reporta una fuga de agua",
      desc:"Encuentra una fuga en tu colegio, casa o barrio. Repórtala a quien corresponda (profesor, administración, acueducto)." },
    { id:"r3", icono:"03", xp:50, titulo:"Recoge 5 residuos de una fuente hídrica",
      desc:"Ve a un río, quebrada o humedal cercano. Recoge al menos 5 residuos y dispónlos correctamente." },
    { id:"r4", icono:"04", xp:30, titulo:"Aprende y explica qué es la DQO",
      desc:"Investiga qué significa la Demanda Química de Oxígeno y explícalo a alguien (familiar, amigo, compañero). Enseñar es la mejor forma de aprender." },
    { id:"r5", icono:"05", xp:25, titulo:"Un día de ducha corta",
      desc:"Reduce tu ducha a 5 minutos o menos durante un día completo. Anota cuánta agua crees que ahorraste." },
    { id:"r6", icono:"06", xp:15, titulo:"Comparte algo aprendido",
      desc:"Cuéntale a alguien de tu familia o a un amigo algo que hayas visto en la sección de datos reales. Compartir es proteger." }
  ];

  const NIVELES = [
    { xp: 0,    nombre: "Semilla" },
    { xp: 100,  nombre: "Brote" },
    { xp: 250,  nombre: "Guardián de quebrada" },
    { xp: 500,  nombre: "Guardián de río" },
    { xp: 900,  nombre: "Guardián de cuenca" },
    { xp: 1500, nombre: "Guardián del agua" }
  ];

  const nuevoEstado = () => ({ xp: 0, acciones: [], retosCompletados: [] });

  let clave = null;
  let estado = nuevoEstado();
  const guardar = () => S.set(clave, estado);

  AQ.models.Juego = {
    RETOS,
    NIVELES,

    cargar(usuarioId) {
      clave = "aquaquest_juego_" + usuarioId;
      estado = { ...nuevoEstado(), ...S.get(clave, {}) };
    },

    xp() { return estado.xp; },
    acciones() { return [...estado.acciones]; },
    retosCompletados() { return [...estado.retosCompletados]; },
    obtenerReto(id) { return RETOS.find(r => r.id === id) || null; },

    calcularNivel(xp) {
      let actual = NIVELES[0], siguiente = NIVELES[1] || null;
      for (let i = NIVELES.length - 1; i >= 0; i--) {
        if (xp >= NIVELES[i].xp) { actual = NIVELES[i]; siguiente = NIVELES[i + 1] || null; break; }
      }
      const piso = actual.xp, techo = siguiente ? siguiente.xp : actual.xp + 1;
      const pct = siguiente ? Math.min(100, ((xp - piso) / (techo - piso)) * 100) : 100;
      return { actual, siguiente, piso, techo, pct, numero: NIVELES.indexOf(actual) + 1 };
    },

    /** Registra la acción y devuelve el XP ganado, o null si no es válida. */
    registrarAccion(retoId, evidencia) {
      const reto = this.obtenerReto(retoId);
      const texto = String(evidencia || "").trim();
      if (!reto || estado.retosCompletados.includes(retoId) || texto.length < 3) return null;

      estado.acciones.push({ retoId, fecha: AQ.utils.hoyDisplay(), evidencia: texto, xp: reto.xp });
      estado.retosCompletados.push(retoId);
      estado.xp += reto.xp;
      guardar();
      return reto.xp;
    },

    reset() {
      estado = nuevoEstado();
      guardar();
    }
  };
})();
