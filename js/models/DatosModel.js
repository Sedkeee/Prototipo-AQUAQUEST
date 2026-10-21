/* ============================================================
   MODELO · DATOS REALES — subconjunto del CSV del IDEAM
   Datos de solo lectura: no son modificables por el usuario.
   ============================================================ */
(function () {
  const PUNTO = {
    nombre: "RCA_ATRATO_CHO_EL CARMEN_SIETE EL",
    codigo: "11027030", corriente: "Atrato", cuenca: "Atrato - Darién",
    subzona: "Alto Atrato", departamento: "Chocó", municipio: "El Carmen",
    lat: 5.8620, lon: -76.15205556, elevacion: 2300
  };

  const VARIABLES = {
    ph:      { nombre: "pH",                  unidad: "unidades de pH", categoria: "Fisicoquímico" },
    od:      { nombre: "Oxígeno disuelto",    unidad: "mg O2/L",        categoria: "Fisicoquímico" },
    temp:    { nombre: "Temperatura",         unidad: "°C",             categoria: "Fisicoquímico" },
    cond:    { nombre: "Conductividad",       unidad: "µS/cm",          categoria: "Fisicoquímico" },
    turb:    { nombre: "Turbidez",            unidad: "NTU",            categoria: "Fisicoquímico" },
    dqo:     { nombre: "DQO",                 unidad: "mg O2/L",        categoria: "Materia orgánica" },
    sst:     { nombre: "Sólidos suspendidos", unidad: "mg/L",           categoria: "Fisicoquímico" },
    fe:      { nombre: "Hierro total",        unidad: "mg Fe/L",        categoria: "Metal" },
    al:      { nombre: "Aluminio total",      unidad: "mg Al/L",        categoria: "Metal" },
    mn:      { nombre: "Manganeso total",     unidad: "mg Mn/L",        categoria: "Metal" },
    zn:      { nombre: "Zinc total",          unidad: "mg Zn/L",        categoria: "Metal" },
    no3:     { nombre: "Nitrato",             unidad: "mg N-NO3-/L",    categoria: "Nutriente" },
    p_total: { nombre: "Fósforo total",       unidad: "mg P/L",         categoria: "Nutriente" }
  };

  const MUESTRAS = [
    { fecha: "30/07/2014", valores: { ph:"7.89", od:"6.6", temp:"21.7", cond:"103.5", turb:"13", dqo:"20", sst:"32", fe:"3.18", al:"1.68", mn:"0.082", zn:"0.055", no3:"0.25", p_total:"0.1" } },
    { fecha: "25/05/2015", valores: { ph:"6.49", od:"7.2", temp:"17.8", cond:"104.2", turb:"1910", dqo:"130", sst:"1950", fe:"127", al:"95.1", mn:"1.49", zn:"0.292", no3:"1.3", p_total:null } },
    { fecha: "21/06/2016", valores: { ph:"7.43", od:"7.4", temp:"20.9", cond:"79.2", turb:"1200", dqo:"21", sst:"1050", fe:"38.1", al:"36", mn:"0.484", zn:"0.178", no3:"1.2", p_total:null } },
    { fecha: "19/10/2016", valores: { ph:"7.89", od:"7.3", temp:"19.7", cond:"82.2", turb:"180", dqo:"16", sst:"300", fe:"18.2", al:"12.3", mn:"0.213", zn:"0.142", no3:"1.3", p_total:"0.29" } },
    { fecha: "06/04/2018", valores: { ph:"5.09", od:"6.9", temp:"16.5", cond:"73.2", turb:null, dqo:null, sst:null, fe:"52", al:"34.2", mn:"1", zn:"0.208", no3:"2.8", p_total:"0.53" } },
    { fecha: "19/07/2021", valores: { ph:"7.64", od:"5.9", temp:"21.5", cond:"87", turb:"170", dqo:"<10", sst:"210", fe:"6.37", al:"3.88", mn:"<0.2", zn:"<0.2", no3:null, p_total:"0.23" } },
    { fecha: "26/04/2022", valores: { ph:"7.77", od:"7.6", temp:"16.2", cond:"89.8", turb:"90", dqo:"<10", sst:"86", fe:"3.674", al:"2.216", mn:"<0.2", zn:"<0.2", no3:null, p_total:"0.085" } },
    { fecha: "22/05/2024", valores: { ph:"7.44", od:"7.4", temp:"22.1", cond:"94.6", turb:"380", dqo:"14", sst:"436", fe:"16.2", al:"9.11", mn:"0.235", zn:"<0.2", no3:"0.167", p_total:"0.24" } }
  ];

  const esBajoLCM = raw => typeof raw === "string" && raw.startsWith("<");

  AQ.models.Datos = {
    PUNTO,
    VARIABLES,
    MUESTRAS,

    /** Serie numérica graficable de una variable (excluye nulos y valores "<LCM"). */
    serie(varId) {
      const puntos = [];
      MUESTRAS.forEach((m, i) => {
        const raw = m.valores[varId];
        if (raw === null || raw === undefined || esBajoLCM(raw)) return;
        const num = parseFloat(raw);
        if (isNaN(num)) return;
        puntos.push({ idx: i, fecha: m.fecha, valor: num });
      });
      return {
        puntos,
        totalMuestras: MUESTRAS.length,
        primeraFecha: MUESTRAS[0].fecha,
        ultimaFecha: MUESTRAS[MUESTRAS.length - 1].fecha
      };
    },

    /** Filas de las últimas N muestras, una por variable medida. */
    ultimasMediciones(n = 4) {
      const filas = [];
      [...MUESTRAS].slice(-n).reverse().forEach(m => {
        Object.entries(VARIABLES).forEach(([id, v]) => {
          const raw = m.valores[id];
          if (raw === null || raw === undefined) return;
          filas.push({ fecha: m.fecha, variable: v, raw, esBajo: esBajoLCM(raw) });
        });
      });
      return filas;
    }
  };
})();
