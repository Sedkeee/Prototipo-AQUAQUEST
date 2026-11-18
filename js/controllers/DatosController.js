/* ============================================================
   CONTROLADOR · DATOS REALES + CONEXIÓN CSV / BASE DE DATOS
   Fase 2: Selector de tipo de gráfico (line, bar, doughnut, area)
   ============================================================ */
(function () {
  const Model = AQ.models.Datos;
  const View = AQ.views.Datos;
  const UI = AQ.views.UI;

  let variableActual = "ph";
  let tipoGrafico = "line"; /* session-only: resets on page reload */

  function refrescarVista() {
    const p = Model.PUNTO;
    View.renderEstadoBD(
      Model.resumenBD(),
      Model.estaciones(),
      p.codigo || p.id,
      cambiarEstacion,
      importarArchivoCSV,
    );
    View.renderInfoPunto(p);
    View.renderChips(Model.VARIABLES, variableActual, seleccionarVariable);
    View.renderChart(
      Model.VARIABLES[variableActual],
      Model.serie(variableActual),
      tipoGrafico,
    );
    View.renderTabla(Model.ultimasMediciones(4));
    View.updateChartTypeButtons(tipoGrafico);
  }

  function seleccionarVariable(id) {
    variableActual = id;
    View.renderChips(Model.VARIABLES, variableActual, seleccionarVariable);
    View.renderChart(
      Model.VARIABLES[variableActual],
      Model.serie(variableActual),
      tipoGrafico,
    );
  }

  function cambiarEstacion(idOCodigo) {
    var p = Model.seleccionarEstacion(idOCodigo);
    refrescarVista();
    UI.mostrarToast("Estación activa: " + p.municipio + " (" + p.corriente + ")");
  }

  function cambiarTipoGrafico(nuevoTipo) {
    if (nuevoTipo === tipoGrafico) return;
    tipoGrafico = nuevoTipo;
    View.updateChartTypeButtons(tipoGrafico);
    View.renderChart(
      Model.VARIABLES[variableActual],
      Model.serie(variableActual),
      tipoGrafico,
    );
  }

  function importarArchivoCSV(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var r = Model.importarCSV(e.target.result, file.name);
      if (!r.ok) {
        UI.mostrarToast(r.error || "Error al importar el CSV");
        return;
      }
      refrescarVista();
      UI.mostrarToast(
        "BD actualizada: " + r.estaciones + " estaciones y " + r.filas.toLocaleString("es-CO") + " filas cargadas",
      );
    };
    reader.onerror = function () { UI.mostrarToast("No se pudo leer el archivo CSV"); };
    reader.readAsText(file, "utf-8");
  }

  function bindChartTypeSelector() {
    var container = document.getElementById("chart-type-selector");
    if (!container) return;
    container.addEventListener("click", function (e) {
      var btn = e.target.closest && e.target.closest("[data-chart-type]");
      if (!btn) return;
      cambiarTipoGrafico(btn.dataset.chartType);
    });
  }

  AQ.controllers.Datos = {
    init() {
      bindChartTypeSelector();
      refrescarVista();
    },
    refrescar: refrescarVista,
  };
})();
