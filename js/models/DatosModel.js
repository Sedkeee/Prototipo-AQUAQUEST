/* ============================================================
   MODELO · DATOS REALES + CONEXIÓN A BASE DE DATOS CSV IDEAM
   Conecta los datos del archivo oficial del IDEAM:
   "Data_Histórica_de_Calidad_de_Agua_Superficial_y_Sedimentos_20260911.csv"
   siguiendo el Diagrama Relacional (ZONAS_HIDROGRAFICAS,
   PUNTOS_MONITOREO, VARIABLES, MUESTRAS y MEDICIONES).
   ============================================================ */
(function () {
  const VARIABLES = {
    ph:      { id_variable: 1,  nombre: "pH",                  unidad: "unidades de pH", categoria: "Fisicoquímico",    matriz: "Agua superficial" },
    od:      { id_variable: 2,  nombre: "Oxígeno disuelto",    unidad: "mg O2/L",        categoria: "Fisicoquímico",    matriz: "Agua superficial" },
    temp:    { id_variable: 3,  nombre: "Temperatura",         unidad: "°C",             categoria: "Fisicoquímico",    matriz: "Agua superficial" },
    cond:    { id_variable: 4,  nombre: "Conductividad",       unidad: "µS/cm",          categoria: "Fisicoquímico",    matriz: "Agua superficial" },
    turb:    { id_variable: 5,  nombre: "Turbidez",            unidad: "NTU",            categoria: "Fisicoquímico",    matriz: "Agua superficial" },
    dqo:     { id_variable: 6,  nombre: "DQO",                 unidad: "mg O2/L",        categoria: "Materia orgánica", matriz: "Agua superficial" },
    sst:     { id_variable: 7,  nombre: "Sólidos suspendidos", unidad: "mg/L",           categoria: "Fisicoquímico",    matriz: "Agua superficial" },
    fe:      { id_variable: 8,  nombre: "Hierro total",        unidad: "mg Fe/L",        categoria: "Metal",            matriz: "Agua superficial" },
    al:      { id_variable: 9,  nombre: "Aluminio total",      unidad: "mg Al/L",        categoria: "Metal",            matriz: "Agua superficial" },
    mn:      { id_variable: 10, nombre: "Manganeso total",     unidad: "mg Mn/L",        categoria: "Metal",            matriz: "Agua superficial" },
    zn:      { id_variable: 11, nombre: "Zinc total",          unidad: "mg Zn/L",        categoria: "Metal",            matriz: "Agua superficial" },
    no3:     { id_variable: 12, nombre: "Nitrato",             unidad: "mg N-NO3-/L",    categoria: "Nutriente",        matriz: "Agua superficial" },
    p_total: { id_variable: 13, nombre: "Fósforo total",       unidad: "mg P/L",         categoria: "Nutriente",        matriz: "Agua superficial" }
  };

  const MAPA_PROPIEDADES_CSV = {
    "PH": "ph",
    "OXIGENO DISUELTO (OD)": "od",
    "TEMPERATURA": "temp",
    "CONDUCTIVIDAD ELECTRICA": "cond",
    "TURBIDEZ": "turb",
    "DEMANDA QUIMICA DE OXIGENO (DQO)": "dqo",
    "SOLIDOS SUSPENDIDOS TOTALES": "sst",
    "HIERRO TOTAL EN AGUA": "fe",
    "ALUMINIO TOTAL EN AGUA": "al",
    "MANGANESO TOTAL EN AGUA": "mn",
    "ZINC TOTAL EN AGUA": "zn",
    "NITRATO": "no3",
    "FOSFORO TOTAL": "p_total"
  };

  // Respaldo inicial por si no se ha cargado IdeamCsvData.js
  const ESTACION_RESPALDO = {
    id_punto: 1,
    id: "11027030",
    nombre: "RCA_ATRATO_CHO_EL CARMEN_SIETE EL",
    codigo: "11027030",
    corriente: "Atrato",
    cuenca: "Atrato - Darién",
    subzona: "Alto Atrato",
    codigo_szh: "1102",
    id_zona: 1,
    departamento: "Chocó",
    municipio: "El Carmen",
    lat: 5.8620,
    lon: -76.15205556,
    elevacion: 2300,
    totalMuestrasCSV: 8,
    muestras: [
      { fecha: "30/07/2014", codigo_muestra: "23386", proyecto: "Ideam", valores: { ph:"7.89", od:"6.6", temp:"21.7", cond:"103.5", turb:"13", dqo:"20", sst:"32", fe:"3.18", al:"1.68", mn:"0.082", zn:"0.055", no3:"0.25", p_total:"0.1" } },
      { fecha: "25/05/2015", codigo_muestra: "23900", proyecto: "Ideam", valores: { ph:"6.49", od:"7.2", temp:"17.8", cond:"104.2", turb:"1910", dqo:"130", sst:"1950", fe:"127", al:"95.1", mn:"1.49", zn:"0.292", no3:"1.3", p_total:null } },
      { fecha: "21/06/2016", codigo_muestra: "24700", proyecto: "Ideam", valores: { ph:"7.43", od:"7.4", temp:"20.9", cond:"79.2", turb:"1200", dqo:"21", sst:"1050", fe:"38.1", al:"36", mn:"0.484", zn:"0.178", no3:"1.2", p_total:null } },
      { fecha: "19/10/2016", codigo_muestra: "25100", proyecto: "Ideam", valores: { ph:"7.89", od:"7.3", temp:"19.7", cond:"82.2", turb:"180", dqo:"16", sst:"300", fe:"18.2", al:"12.3", mn:"0.213", zn:"0.142", no3:"1.3", p_total:"0.29" } },
      { fecha: "06/04/2018", codigo_muestra: "26888", proyecto: "Ideam", valores: { ph:"5.09", od:"6.9", temp:"16.5", cond:"73.2", turb:null, dqo:null, sst:null, fe:"52", al:"34.2", mn:"1", zn:"0.208", no3:"2.8", p_total:"0.53" } },
      { fecha: "19/07/2021", codigo_muestra: "28424", proyecto: "Ideam", valores: { ph:"7.64", od:"5.9", temp:"21.5", cond:"87", turb:"170", dqo:"<10", sst:"210", fe:"6.37", al:"3.88", mn:"<0.2", zn:"<0.2", no3:null, p_total:"0.23" } },
      { fecha: "26/04/2022", codigo_muestra: "28791", proyecto: "Ideam", valores: { ph:"7.77", od:"7.6", temp:"16.2", cond:"89.8", turb:"90", dqo:"<10", sst:"86", fe:"3.674", al:"2.216", mn:"<0.2", zn:"<0.2", no3:null, p_total:"0.085" } },
      { fecha: "22/05/2024", codigo_muestra: "29822", proyecto: "Ideam", valores: { ph:"7.44", od:"7.4", temp:"22.1", cond:"94.6", turb:"380", dqo:"14", sst:"436", fe:"16.2", al:"9.11", mn:"0.235", zn:"<0.2", no3:"0.167", p_total:"0.24" } }
    ]
  };

  const precargado = AQ.models.IdeamCsvData || {
    fuente: "Data_Histórica_de_Calidad_de_Agua_Superficial_y_Sedimentos_20260911.csv",
    totalFilasCSV: 143818,
    totalZonasCSV: 101,
    totalEstacionesCSV: 243,
    zonas_hidrograficas: [],
    estaciones: [ESTACION_RESPALDO]
  };

  let metaBD = {
    fuente: precargado.fuente,
    totalFilasCSV: precargado.totalFilasCSV,
    totalZonasCSV: precargado.totalZonasCSV,
    totalEstacionesCSV: precargado.totalEstacionesCSV
  };
  let listaZonas = precargado.zonas_hidrograficas || [];
  let listaEstaciones = (precargado.estaciones && precargado.estaciones.length)
    ? precargado.estaciones
    : [ESTACION_RESPALDO];
  let estacionActual = listaEstaciones[0];

  const esBajoLCM = raw => typeof raw === "string" && raw.startsWith("<");

  function parseCSVLine(line) {
    const res = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        res.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    res.push(cur);
    return res;
  }

  function parseFechaOrden(f) {
    const p = String(f || "").split("/");
    if (p.length !== 3) return 0;
    return parseInt(p[2] + p[1].padStart(2, "0") + p[0].padStart(2, "0"), 10);
  }

  AQ.models.Datos = {
    VARIABLES,

    get PUNTO() { return estacionActual; },
    get MUESTRAS() { return estacionActual.muestras || []; },

    estaciones() { return listaEstaciones; },
    zonasHidrograficas() { return listaZonas; },

    resumenBD() {
      return {
        ...metaBD,
        estacionesDisponibles: listaEstaciones.length,
        estacionActiva: {
          codigo: estacionActual.codigo,
          nombre: estacionActual.nombre,
          departamento: estacionActual.departamento,
          municipio: estacionActual.municipio,
          muestras: (estacionActual.muestras || []).length
        }
      };
    },

    seleccionarEstacion(idOCodigo) {
      const encontrada = listaEstaciones.find(
        e => e.id === idOCodigo || e.codigo === idOCodigo || String(e.id_punto) === String(idOCodigo)
      );
      if (encontrada) estacionActual = encontrada;
      return estacionActual;
    },

    /**
     * Importa en el navegador un archivo CSV del IDEAM (como el Excel exportado a CSV)
     * y puebla las tablas relacionales ZONAS_HIDROGRAFICAS, PUNTOS_MONITOREO, MUESTRAS y MEDICIONES.
     */
    importarCSV(contenidoCSV, nombreArchivo = "CSV_IDEAM.csv") {
      const lineas = String(contenidoCSV || "").split(/\r?\n/);
      if (lineas.length < 2) return { ok: false, error: "El archivo CSV está vacío." };

      const zonasMap = new Map();
      const puntosMap = new Map();
      const muestrasPorPunto = new Map();
      let filasValidas = 0;

      for (let i = 1; i < lineas.length; i++) {
        const linea = lineas[i].trim();
        if (!linea) continue;
        const cols = parseCSVLine(linea);
        if (cols.length < 14) continue;
        filasValidas++;

        const prop = String(cols[11] || "").trim().toUpperCase();
        const varKey = MAPA_PROPIEDADES_CSV[prop];
        if (!varKey) continue;

        const rawNombre = String(cols[0] || "").trim();
        const m = rawNombre.match(/^(.*?)\s*\[([^\]]+)\]\s*$/);
        const nombre = m ? m[1].trim() : rawNombre;
        const codigo = m ? m[2].trim() : "S/C";
        const clavePunto = codigo !== "S/C" ? codigo : nombre;

        const codigoSzh = String(cols[6] || "").trim();
        const zonaNombre = String(cols[5] || "").trim();
        const subzonaNombre = String(cols[7] || "").trim();
        const claveZona = `${codigoSzh}|${zonaNombre}|${subzonaNombre}`;

        if (!zonasMap.has(claveZona)) {
          zonasMap.set(claveZona, {
            id_zona: zonasMap.size + 1,
            codigo_szh: codigoSzh,
            zona: zonaNombre,
            subzona: subzonaNombre
          });
        }
        const zonaObj = zonasMap.get(claveZona);

        if (!puntosMap.has(clavePunto)) {
          const lat = parseFloat(String(cols[1] || "0").replace(",", ".")) || 0;
          const lon = parseFloat(String(cols[2] || "0").replace(",", ".")) || 0;
          const elev = parseFloat(String(cols[3] || "0").replace(/,/g, "")) || 0;
          puntosMap.set(clavePunto, {
            id_punto: puntosMap.size + 1,
            id: clavePunto,
            nombre,
            codigo,
            corriente: String(cols[4] || "").trim(),
            cuenca: zonaNombre,
            subzona: subzonaNombre,
            codigo_szh: codigoSzh,
            id_zona: zonaObj.id_zona,
            departamento: String(cols[8] || "").trim(),
            municipio: String(cols[9] || "").trim(),
            lat,
            lon,
            elevacion: elev
          });
          muestrasPorPunto.set(clavePunto, new Map());
        }

        const fecha = String(cols[10] || "").trim();
        const resultado = String(cols[12] || "").trim();
        if (!fecha || !resultado) continue;

        const mapaFechas = muestrasPorPunto.get(clavePunto);
        if (!mapaFechas.has(fecha)) {
          mapaFechas.set(fecha, {
            fecha,
            orden: parseFechaOrden(fecha),
            codigo_muestra: String(cols[15] || "").trim(),
            proyecto: String(cols[14] || "Ideam").trim(),
            valores: {}
          });
        }
        mapaFechas.get(fecha).valores[varKey] = resultado.replace(",", ".");
      }

      const nuevasEstaciones = Array.from(puntosMap.values())
        .map(p => {
          const muestras = Array.from(muestrasPorPunto.get(p.id).values())
            .sort((a, b) => a.orden - b.orden);
          return { ...p, totalMuestrasCSV: muestras.length, muestras };
        })
        .filter(p => p.muestras.length > 0);

      if (nuevasEstaciones.length === 0) {
        return { ok: false, error: "No se encontraron mediciones compatibles con el formato del IDEAM." };
      }

      listaZonas = Array.from(zonasMap.values());
      listaEstaciones = nuevasEstaciones;
      estacionActual = listaEstaciones[0];
      metaBD = {
        fuente: nombreArchivo,
        totalFilasCSV: filasValidas,
        totalZonasCSV: listaZonas.length,
        totalEstacionesCSV: listaEstaciones.length
      };

      return {
        ok: true,
        estaciones: listaEstaciones.length,
        zonas: listaZonas.length,
        filas: filasValidas
      };
    },

    /** Serie numérica graficable de una variable en la estación actual. */
    serie(varId) {
      const muestras = this.MUESTRAS;
      const puntos = [];
      muestras.forEach((m, i) => {
        const raw = m.valores[varId];
        if (raw === null || raw === undefined || esBajoLCM(raw)) return;
        const num = parseFloat(raw);
        if (isNaN(num)) return;
        puntos.push({ idx: i, fecha: m.fecha, valor: num });
      });
      return {
        puntos,
        totalMuestras: Math.max(muestras.length, 2),
        primeraFecha: muestras.length ? muestras[0].fecha : "—",
        ultimaFecha: muestras.length ? muestras[muestras.length - 1].fecha : "—"
      };
    },

    /** Filas de las últimas N muestras de la estación actual. */
    ultimasMediciones(n = 4) {
      const muestras = this.MUESTRAS;
      const filas = [];
      [...muestras].slice(-n).reverse().forEach(m => {
        Object.entries(VARIABLES).forEach(([id, v]) => {
          const raw = m.valores[id];
          if (raw === null || raw === undefined) return;
          const esBajo = esBajoLCM(raw);
          filas.push({
            fecha: m.fecha,
            codigo_muestra: m.codigo_muestra || "—",
            variable: v,
            raw,
            esBajo,
            limite_cuantificacion: esBajo ? parseFloat(raw.slice(1)) : null
          });
        });
      });
      return filas;
    }
  };
})();
