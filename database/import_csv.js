/* ============================================================
   IMPORTADOR DE BASE DE DATOS DESDE CSV DEL IDEAM
   Lee el archivo CSV oficial del IDEAM:
   "Data_Histórica_de_Calidad_de_Agua_Superficial_y_Sedimentos_20260911.csv"
   y lo transforma al modelo relacional de AquaQuest:
   - ZONAS_HIDROGRAFICAS
   - PUNTOS_MONITOREO
   - VARIABLES
   - MUESTRAS
   - MEDICIONES
   Genera:
   1. database/ideam_db.json (tablas normalizadas)
   2. js/models/IdeamCsvData.js (estaciones precargadas para el navegador)
   ============================================================ */
const fs = require("fs");
const path = require("path");

const DEFAULT_CSV = "C:/Users/juanj/Downloads/Data_Histórica_de_Calidad_de_Agua_Superficial_y_Sedimentos_20260911.csv";
const csvPath = process.argv[2] || DEFAULT_CSV;

const MAPA_PROPIEDADES = {
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

function parseCSVLine(line) {
  const result = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

function parseNumeroCoord(str) {
  if (!str) return 0;
  const s = String(str).trim().replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function parseElevacion(str) {
  if (!str) return 0;
  // En el CSV del IDEAM "2,300" significa 2300 m.s.n.m.
  const s = String(str).trim().replace(/,/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function parseFechaOrden(f) {
  // DD/MM/YYYY -> YYYYMMDD
  const p = String(f || "").split("/");
  if (p.length !== 3) return 0;
  return parseInt(p[2] + p[1].padStart(2, "0") + p[0].padStart(2, "0"), 10);
}

function extraerCodigoNombre(rawNombre) {
  const m = String(rawNombre || "").match(/^(.*?)\s*\[([^\]]+)\]\s*$/);
  if (m) {
    return { nombre: m[1].trim(), codigo: m[2].trim() };
  }
  return { nombre: String(rawNombre || "").trim(), codigo: "S/C" };
}

function ejecutarImportacion() {
  if (!fs.existsSync(csvPath)) {
    console.error("No se encontró el archivo CSV en:", csvPath);
    process.exit(1);
  }

  console.log("Leyendo CSV del IDEAM:", csvPath);
  const contenido = fs.readFileSync(csvPath, "utf8");
  const lineas = contenido.split(/\r?\n/);
  console.log("Total de filas en el CSV:", lineas.length - 1);

  const zonasMap = new Map();
  const puntosMap = new Map();
  const muestrasPorPunto = new Map();

  for (let i = 1; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    if (!linea) continue;
    const cols = parseCSVLine(linea);
    if (cols.length < 15) continue;

    const rawNombre = cols[0];
    const prop = String(cols[11] || "").trim().toUpperCase();
    const varKey = MAPA_PROPIEDADES[prop];
    if (!varKey) continue;

    const { nombre, codigo } = extraerCodigoNombre(rawNombre);
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
        lat: parseNumeroCoord(cols[1]),
        lon: parseNumeroCoord(cols[2]),
        elevacion: parseElevacion(cols[3])
      });
      muestrasPorPunto.set(clavePunto, new Map());
    }

    const fecha = String(cols[10] || "").trim();
    const resultado = String(cols[12] || "").trim();
    const proyecto = String(cols[14] || "").trim();
    const codMuestra = String(cols[15] || "").trim();
    if (!fecha || !resultado) continue;

    const mapaFechas = muestrasPorPunto.get(clavePunto);
    if (!mapaFechas.has(fecha)) {
      mapaFechas.set(fecha, {
        fecha,
        orden: parseFechaOrden(fecha),
        codigo_muestra: codMuestra,
        proyecto,
        valores: {}
      });
    }
    mapaFechas.get(fecha).valores[varKey] = resultado.replace(",", ".");
  }

  // Seleccionar estaciones con mejor cobertura histórica (más fechas de muestreo)
  // asegurando que la estación original del Atrato (11027030) esté siempre primera
  const todosPuntos = Array.from(puntosMap.values()).map(p => {
    const listaMuestras = Array.from(muestrasPorPunto.get(p.id).values())
      .sort((a, b) => a.orden - b.orden);
    // Tomar hasta las últimas 16 fechas por estación para mantener ligereza y rapidez
    const muestrasRecientes = listaMuestras.slice(-16).map(m => ({
      fecha: m.fecha,
      codigo_muestra: m.codigo_muestra,
      proyecto: m.proyecto,
      valores: m.valores
    }));
    return {
      ...p,
      totalMuestrasCSV: listaMuestras.length,
      muestras: muestrasRecientes
    };
  });

  const atrato = todosPuntos.find(p => p.codigo === "11027030");
  // Elegir hasta 25 estaciones representativas de distintos departamentos/ríos con más muestras
  const departamentosVistos = new Set();
  const seleccionados = [];
  if (atrato) {
    seleccionados.push(atrato);
    departamentosVistos.add(atrato.departamento);
  }

  const ordenadosPorMuestras = todosPuntos
    .filter(p => p.codigo !== "11027030" && p.muestras.length >= 5)
    .sort((a, b) => b.totalMuestrasCSV - a.totalMuestrasCSV);

  // Primero uno por cada departamento distinto para máxima diversidad nacional
  for (const p of ordenadosPorMuestras) {
    if (!departamentosVistos.has(p.departamento) && seleccionados.length < 20) {
      seleccionados.push(p);
      departamentosVistos.add(p.departamento);
    }
  }
  // Completar hasta 25 estaciones con las de mayor número de muestras
  for (const p of ordenadosPorMuestras) {
    if (seleccionados.length >= 25) break;
    if (!seleccionados.includes(p)) seleccionados.push(p);
  }

  const resumenDB = {
    fuente: path.basename(csvPath),
    totalFilasCSV: lineas.length - 1,
    totalZonasCSV: zonasMap.size,
    totalEstacionesCSV: puntosMap.size,
    fechaImportacion: new Date().toISOString(),
    zonas_hidrograficas: Array.from(zonasMap.values()).slice(0, 50),
    estaciones: seleccionados
  };

  fs.mkdirSync(path.join(__dirname), { recursive: true });
  const jsonOut = path.join(__dirname, "ideam_db.json");
  fs.writeFileSync(jsonOut, JSON.stringify(resumenDB, null, 2), "utf8");

  const jsOut = path.join(__dirname, "..", "js", "models", "IdeamCsvData.js");
  const jsContent = `/* ============================================================
   DATOS PRECARGADOS DESDE EL CSV OFICIAL DEL IDEAM
   Archivo origen: ${path.basename(csvPath)} (${(lineas.length - 1).toLocaleString("es-CO")} registros,
   ${puntosMap.size} estaciones de monitoreo y ${zonasMap.size} subzonas hidrográficas)
   Generado automáticamente por database/import_csv.js
   ============================================================ */
window.AQ = window.AQ || { components: {}, models: {}, views: {}, controllers: {}, utils: {} };
AQ.models.IdeamCsvData = ${JSON.stringify(resumenDB, null, 2)};
`;
  fs.writeFileSync(jsOut, jsContent, "utf8");

  console.log(`¡Importación completada!`);
  console.log(`- Total estaciones en CSV: ${puntosMap.size}`);
  console.log(`- Total subzonas hidrográficas: ${zonasMap.size}`);
  console.log(`- Estaciones representativas exportadas a la app: ${seleccionados.length}`);
  console.log(`- Archivos generados: database/ideam_db.json y js/models/IdeamCsvData.js`);
}

ejecutarImportacion();

