/* ============================================================
   CONTROLADOR · DATOS REALES + CONEXIÓN CSV / BASE DE DATOS
   ============================================================ */
(function () {
  const Model = AQ.models.Datos;
  const View = AQ.views.Datos;
  const UI = AQ.views.UI;

  let variableActual = "ph";

  function refrescarVista() {
    const p = Model.PUNTO;
    View.renderEstadoBD(
      Model.resumenBD(),
      Model.estaciones(),
      p.codigo || p.id,
      cambiarEstacion,
      importarArchivoCSV
    );
    View.renderInfoPunto(p);
    View.renderChips(Model.VARIABLES, variableActual, seleccionarVariable);
    View.renderChart(Model.VARIABLES[variableActual], Model.serie(variableActual));
    View.renderTabla(Model.ultimasMediciones(4));
  }

  function seleccionarVariable(id) {
    variableActual = id;
    View.renderChips(Model.VARIABLES, variableActual, seleccionarVariable);
    View.renderChart(Model.VARIABLES[variableActual], Model.serie(variableActual));
  }

  function cambiarEstacion(idOCodigo) {
    const p = Model.seleccionarEstacion(idOCodigo);
    refrescarVista();
    UI.mostrarToast(`Estación activa: ${p.municipio} (${p.corriente})`);
  }

  function importarArchivoCSV(file) {
    const reader = new FileReader();
    reader.onload = e => {
      const r = Model.importarCSV(e.target.result, file.name);
      if (!r.ok) {
        UI.mostrarToast(r.error || "Error al importar el CSV");
        return;
      }
      refrescarVista();
      UI.mostrarToast(
        `BD actualizada: ${r.estaciones} estaciones y ${r.filas.toLocaleString("es-CO")} filas cargadas`
      );
    };
    reader.onerror = () => UI.mostrarToast("No se pudo leer el archivo CSV");
    reader.readAsText(file, "utf-8");
  }

  AQ.controllers.Datos = {
    init() {
      refrescarVista();
    },
    refrescar: refrescarVista
  };
})();
