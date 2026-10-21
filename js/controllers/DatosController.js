/* ============================================================
   CONTROLADOR · DATOS REALES
   ============================================================ */
(function () {
  const Model = AQ.models.Datos;
  const View = AQ.views.Datos;

  let variableActual = "ph";

  function seleccionarVariable(id) {
    variableActual = id;
    View.renderChips(Model.VARIABLES, variableActual, seleccionarVariable);
    View.renderChart(Model.VARIABLES[variableActual], Model.serie(variableActual));
  }

  AQ.controllers.Datos = {
    init() {
      View.renderInfoPunto(Model.PUNTO);
      seleccionarVariable(variableActual);
      View.renderTabla(Model.ultimasMediciones(4));
    }
  };
})();
