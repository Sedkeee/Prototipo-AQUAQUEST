/* ============================================================
   VISTA · DATOS REALES (selector BD, info del punto, chips en React,
   gráfica Chart.js con fallback SVG, tabla, mapa Leaflet)
   ============================================================ */
(function () {
  const $ = AQ.utils.$;
  const fmt = AQ.utils.formatearNumero;
  const SVG_NS = "http://www.w3.org/2000/svg";

  /* ---------- helpers SVG (fallback) ---------- */
  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  /* ---------- Chart.js instance management ---------- */
  let chartInstance = null;
  let chartJsAvailable = null; // null = not checked, true/false after check

  function isChartJsReady() {
    if (chartJsAvailable !== null) return chartJsAvailable;
    chartJsAvailable = typeof Chart !== "undefined" && Chart.register;
    return chartJsAvailable;
  }

  function destroyChart() {
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
  }

  /* ---------- Chart.js color palette ---------- */
  const COLORS = [
    "rgba(0, 180, 216, 0.85)",
    "rgba(82, 183, 136, 0.85)",
    "rgba(157, 78, 221, 0.85)",
    "rgba(255, 183, 3, 0.85)",
    "rgba(230, 57, 70, 0.85)",
    "rgba(144, 224, 239, 0.85)",
    "rgba(45, 106, 79, 0.85)",
    "rgba(255, 209, 102, 0.85)",
    "rgba(0, 119, 182, 0.85)",
    "rgba(200, 120, 255, 0.85)",
  ];
  const BORDERS = COLORS.map(c => c.replace("0.85", "1"));

  /* ---------- Leaflet map management ---------- */
  let mapInstance = null;
  let mapMarkers = [];
  let leafletAvailable = null;

  function isLeafletReady() {
    if (leafletAvailable !== null) return leafletAvailable;
    leafletAvailable = typeof L !== "undefined" && L.map;
    return leafletAvailable;
  }

  function createMarkerIcon(isActive) {
    if (!isLeafletReady()) return null;
    return L.divIcon({
      className: "marker-custom",
      html: '<div class="marker-pin' + (isActive ? " active" : "") + '"><span class="marker-pin-inner"></span></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -30],
    });
  }

  function buildPopupHTML(estacion) {
    return '<div class="popup-estacion">' +
      '<div class="popup-nombre">' + AQ.utils.escapeHtml(estacion.nombre) + '</div>' +
      '<div class="popup-row"><span class="popup-icon" aria-hidden="true">🌊</span><span class="popup-label">Corriente:</span><span class="popup-value">' + AQ.utils.escapeHtml(estacion.corriente) + '</span></div>' +
      '<div class="popup-row"><span class="popup-icon" aria-hidden="true">📍</span><span class="popup-label">Departamento:</span><span class="popup-value">' + AQ.utils.escapeHtml(estacion.departamento) + '</span></div>' +
      '<div class="popup-row"><span class="popup-icon" aria-hidden="true">🏘️</span><span class="popup-label">Municipio:</span><span class="popup-value">' + AQ.utils.escapeHtml(estacion.municipio) + '</span></div>' +
      '<div class="popup-row"><span class="popup-icon" aria-hidden="true">📊</span><span class="popup-label">Muestras:</span><span class="popup-value">' + estacion.muestras.length + '</span></div>' +
      '<button class="popup-btn" data-select-estacion="' + estacion.codigo + '" aria-label="Seleccionar estación ' + AQ.utils.escapeHtml(estacion.nombre) + '">📌 Seleccionar estación</button>' +
      '</div>';
  }

  /* ---------- Render chart with Chart.js ---------- */
  function renderChartJS(canvas, tipo, variable, serie) {
    destroyChart();
    const ctx = canvas.getContext("2d");
    const { puntos } = serie;
    if (puntos.length === 0) {
      canvas.style.display = "none";
      return false;
    }
    canvas.style.display = "block";

    /* Limit to first 10 records */
    const data10 = puntos.slice(0, 10);
    const labels = data10.map(p => p.fecha);
    const values = data10.map(p => p.valor);

    /* Chart.js dark theme defaults */
    const textColor = "#8ba3b8";
    const gridColor = "rgba(31, 65, 96, 0.5)";

    /* Base dataset config */
    const baseDataset = {
      label: variable.nombre + " (" + variable.unidad + ")",
      data: values,
    };

    let config;

    if (tipo === "bar") {
      config = {
        type: "bar",
        data: {
          labels: labels,
          datasets: [{
            ...baseDataset,
            backgroundColor: COLORS.slice(0, data10.length),
            borderColor: BORDERS.slice(0, data10.length),
            borderWidth: 1,
            borderRadius: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(10, 25, 41, 0.95)",
              titleColor: "#90e0ef",
              bodyColor: "#e8f1f8",
              borderColor: "rgba(0, 180, 216, 0.3)",
              borderWidth: 1,
            },
          },
          scales: {
            x: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } },
            y: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } },
          },
        },
      };
    } else if (tipo === "doughnut") {
      config = {
        type: "doughnut",
        data: {
          labels: labels,
          datasets: [{
            ...baseDataset,
            backgroundColor: COLORS.slice(0, data10.length),
            borderColor: "rgba(10, 25, 41, 0.9)",
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "right",
              labels: { color: textColor, font: { size: 10 }, boxWidth: 12 },
            },
            tooltip: {
              backgroundColor: "rgba(10, 25, 41, 0.95)",
              titleColor: "#90e0ef",
              bodyColor: "#e8f1f8",
              borderColor: "rgba(0, 180, 216, 0.3)",
              borderWidth: 1,
            },
          },
        },
      };
    } else if (tipo === "area") {
      config = {
        type: "line",
        data: {
          labels: labels,
          datasets: [{
            ...baseDataset,
            fill: true,
            backgroundColor: "rgba(0, 180, 216, 0.18)",
            borderColor: "#00b4d8",
            borderWidth: 2.5,
            pointBackgroundColor: "#90e0ef",
            pointBorderColor: "#0077b6",
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.3,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(10, 25, 41, 0.95)",
              titleColor: "#90e0ef",
              bodyColor: "#e8f1f8",
              borderColor: "rgba(0, 180, 216, 0.3)",
              borderWidth: 1,
            },
          },
          scales: {
            x: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } },
            y: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } },
          },
        },
      };
    } else {
      /* line (default) */
      config = {
        type: "line",
        data: {
          labels: labels,
          datasets: [{
            ...baseDataset,
            fill: false,
            borderColor: "#00b4d8",
            borderWidth: 2.5,
            pointBackgroundColor: "#90e0ef",
            pointBorderColor: "#0077b6",
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(10, 25, 41, 0.95)",
              titleColor: "#90e0ef",
              bodyColor: "#e8f1f8",
              borderColor: "rgba(0, 180, 216, 0.3)",
              borderWidth: 1,
            },
          },
          scales: {
            x: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } },
            y: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } },
          },
        },
      };
    }

    canvas.parentElement.style.position = "relative";
    canvas.style.height = "260px";
    chartInstance = new Chart(ctx, config);
    return true;
  }

  /* ---------- SVG fallback renderer (original) ---------- */
  function renderChartSVG(variable, serie) {
    const svg = $("chart");
    svg.style.display = "block";

    const W = 520, H = 200, pad = { l: 40, r: 14, t: 16, b: 22 };
    const innerW = W - pad.l - pad.r, innerH = H - pad.t - pad.b;
    const { puntos, totalMuestras } = serie;

    svg.innerHTML = "";
    /* Limit to 10 records for consistency */
    const pts = puntos.slice(0, 10);

    if (pts.length === 0) {
      svg.innerHTML =
        '<text x="' + (W / 2) + '" y="' + (H / 2) + '" fill="#8ba3b8" font-size="12" text-anchor="middle" font-style="italic">Sin datos numéricos para graficar en esta estación</text>';
      $("chart-rango").textContent = "—";
      $("chart-min").textContent = "";
      $("chart-max").textContent = "";
      return;
    }

    const vals = pts.map(p => p.valor);
    let min = Math.min(...vals), max = Math.max(...vals);
    if (min === max) { min -= 1; max += 1; }
    const rangoY = max - min;
    const divisorX = Math.max(pts.length - 1, 1);
    const x = i => pad.l + (i / divisorX) * innerW;
    const y = val => pad.t + innerH - ((val - min) / rangoY) * innerH;

    const grid = svgEl("g", {});
    for (let i = 0; i <= 4; i++) {
      const yv = pad.t + (i / 4) * innerH;
      grid.appendChild(svgEl("line", { x1: pad.l, x2: W - pad.r, y1: yv, y2: yv, stroke: "#1f4160", "stroke-dasharray": "3 4" }));
      const t = svgEl("text", { x: pad.l - 6, y: yv + 3, fill: "#8ba3b8", "font-size": "9.5", "text-anchor": "end" });
      t.textContent = fmt(max - (i / 4) * rangoY);
      grid.appendChild(t);
    }
    svg.appendChild(grid);

    if (pts.length > 1) {
      let d = "M " + x(0) + " " + y(pts[0].valor);
      for (let i = 1; i < pts.length; i++) d += " L " + x(i) + " " + y(pts[i].valor);
      const base = pad.t + innerH;
      const dArea = d + " L " + x(pts.length - 1) + " " + base + " L " + x(0) + " " + base + " Z";

      const defs = svgEl("defs", {});
      defs.innerHTML = '<linearGradient id="grad-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#00b4d8" stop-opacity=".35"/><stop offset="100%" stop-color="#00b4d8" stop-opacity="0"/></linearGradient>';
      svg.appendChild(defs);
      svg.appendChild(svgEl("path", { d: dArea, fill: "url(#grad-area)" }));
      svg.appendChild(svgEl("path", { d: d, fill: "none", stroke: "#00b4d8", "stroke-width": "2.2", "stroke-linejoin": "round", "stroke-linecap": "round", class: "chart-line" }));
    }

    pts.forEach((p, i) => {
      const c = svgEl("circle", { cx: x(i), cy: y(p.valor), r: "4", fill: "#90e0ef", stroke: "#0077b6", "stroke-width": "1.5", class: "chart-dot" });
      const t = svgEl("title", {});
      t.textContent = p.fecha + " · " + fmt(p.valor) + " " + variable.unidad;
      c.appendChild(t);
      svg.appendChild(c);
    });

    $("chart-min").textContent = serie.primeraFecha;
    $("chart-max").textContent = serie.ultimaFecha;
    $("chart-rango").textContent = "Rango: " + fmt(min) + " – " + fmt(max) + " " + variable.unidad;
  }

  /* ============================================================
     PUBLIC VIEW API
     ============================================================ */
  AQ.views.Datos = {
    renderEstadoBD(resumen, estaciones, codigoActual, onSelectEstacion, onImportarArchivo) {
      const infoEl = $("db-status-texto");
      if (infoEl) {
        infoEl.innerHTML =
          '<strong>BD Relacional IDEAM conectada:</strong> <code>' + resumen.fuente + '</code> · ' +
          resumen.totalFilasCSV.toLocaleString("es-CO") + " registros · " +
          estaciones.length + " estaciones cargadas (" + resumen.totalZonasCSV + " subzonas)";
      }

      const sel = $("select-estacion");
      if (sel) {
        sel.innerHTML = "";
        estaciones.forEach(e => {
          const opt = document.createElement("option");
          opt.value = e.codigo || e.id;
          opt.textContent = e.departamento + " · " + e.municipio + " — " + e.corriente + " [" + e.codigo + "] (" + e.muestras.length + " muestras)";
          if ((e.codigo || e.id) === codigoActual) opt.selected = true;
          sel.appendChild(opt);
        });
        sel.onchange = ev => onSelectEstacion && onSelectEstacion(ev.target.value);
      }

      const { h, mount, ImportCsvButton } = AQ.components;
      const inputCsv = $("input-csv-ideam");
      mount(
        $("btn-importar-csv-root"),
        h(ImportCsvButton, { onClick: () => inputCsv && inputCsv.click() }),
      );
      if (inputCsv) {
        inputCsv.onchange = ev => {
          const file = ev.target.files && ev.target.files[0];
          inputCsv.value = "";
          if (file && onImportarArchivo) onImportarArchivo(file);
        };
      }
    },

    renderInfoPunto(p) {
      $("punto-nombre").textContent = p.nombre;
      $("punto-codigo").textContent = p.codigo;
      $("punto-corriente").textContent = p.corriente;
      $("punto-cuenca").textContent = p.cuenca;
      $("punto-subzona").textContent = p.subzona;
      $("punto-depto").textContent = p.departamento;
      $("punto-muni").textContent = p.municipio;
      $("punto-coord").textContent = p.lat.toFixed(4) + ", " + p.lon.toFixed(4);
      $("punto-elev").textContent = p.elevacion.toLocaleString("es-CO") + " m.s.n.m.";
    },

    renderChips(variables, actual, onSelect) {
      const { h, mount, VariableChips } = AQ.components;
      mount($("chips-vars"), h(VariableChips, { variables, actual, onSelect }));
    },

    /**
     * Render study description cards (Phase 4).
     * @param {object} meta - { nombre, objetivo, sector, variable, variableCategoria }
     */
    renderResenaEstudio(meta) {
      var el;
      el = $("resena-nombre");
      if (el) el.textContent = meta.nombre;
      el = $("resena-objetivo");
      if (el) el.textContent = meta.objetivo;
      el = $("resena-variable");
      if (el) el.textContent = meta.variable;
      el = $("resena-variable-cat");
      if (el) el.textContent = meta.variableCategoria ? "Categoría: " + meta.variableCategoria : "";
      el = $("resena-sector");
      if (el) el.textContent = meta.sector;
    },

    /**
     * Render chart with Chart.js or fallback SVG.
     * @param {object} variable - Variable metadata { nombre, unidad, ... }
     * @param {object} serie - { puntos, totalMuestras, primeraFecha, ultimaFecha }
     * @param {string} tipo - Chart type: "line" | "bar" | "doughnut" | "area"
     */
    renderChart(variable, serie, tipo) {
      tipo = tipo || "line";
      $("chart-nombre").textContent = variable.nombre;
      $("chart-unidad").textContent = variable.unidad;

      const canvas = $("chart-canvas");
      const svg = $("chart");
      const pts10 = serie.puntos.slice(0, 10);

      /* Update date range labels */
      if (pts10.length > 0) {
        $("chart-min").textContent = pts10[0].fecha;
        $("chart-max").textContent = pts10[pts10.length - 1].fecha;
        const vals = pts10.map(p => p.valor);
        const min = Math.min(...vals), max = Math.max(...vals);
        $("chart-rango").textContent = "Rango: " + fmt(min) + " – " + fmt(max) + " " + variable.unidad;
      } else {
        $("chart-min").textContent = "";
        $("chart-max").textContent = "";
        $("chart-rango").textContent = "—";
      }

      /* Try Chart.js first */
      if (isChartJsReady() && canvas) {
        svg.style.display = "none";
        canvas.style.display = "block";
        const serieSliced = { ...serie, puntos: pts10 };
        if (pts10.length === 0) {
          destroyChart();
          canvas.style.display = "none";
          svg.style.display = "block";
          svg.innerHTML = '<text x="260" y="100" fill="#8ba3b8" font-size="12" text-anchor="middle" font-style="italic">Sin datos numéricos para graficar en esta estación</text>';
          return;
        }
        renderChartJS(canvas, tipo, variable, serieSliced);
        /* Hide date range below canvas for pie/doughnut since it's not relevant */
        var dateRow = canvas.parentElement.querySelector('[style*="justify-content: space-between"]');
        if (dateRow) dateRow.style.display = (tipo === "doughnut") ? "none" : "flex";
        return;
      }

      /* Fallback: SVG — disable type selector buttons */
      if (canvas) canvas.style.display = "none";
      svg.style.display = "block";
      destroyChart();
      var selectorBtns = document.querySelectorAll(".chart-type-btn");
      selectorBtns.forEach(function(btn) {
        btn.disabled = true;
        btn.title = "Gráfico interactivo no disponible (Chart.js no cargado)";
        btn.style.opacity = "0.4";
        btn.style.cursor = "not-allowed";
      });
      renderChartSVG(variable, serie);
    },

    /** Update chart type selector buttons active state */
    updateChartTypeButtons(tipo) {
      var btns = document.querySelectorAll(".chart-type-btn");
      btns.forEach(function(btn) {
        var isActive = btn.dataset.chartType === tipo;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-pressed", String(isActive));
      });
    },

    renderTabla(filas) {
      const tbody = document.querySelector("#tabla-datos tbody");
      tbody.innerHTML = "";
      filas.slice(0, 10).forEach(f => {
        const tr = document.createElement("tr");
        tr.innerHTML =
          '<td class="fecha">' + f.fecha + '</td>' +
          '<td>' + f.variable.nombre + '</td>' +
          '<td class="valor" style="text-align:right">' +
          (f.esBajo
            ? '<span class="bajo-lcm">&lt;' + f.raw.slice(1) + '</span>'
            : f.raw + ' <span style="color:var(--muted);font-size:11px">' + f.variable.unidad + '</span>') +
          '</td>';
        tbody.appendChild(tr);
      });
    },

    /**
     * Render interactive Leaflet map with station markers.
     * @param {Array} estaciones - All stations with lat/lon
     * @param {string} codigoActual - Current selected station code
     * @param {function} onSelectEstacion - Callback when a station is selected from map
     */
    renderMapa(estaciones, codigoActual, onSelectEstacion) {
      var wrap = $("mapa-wrap");
      var container = $("mapa-estaciones");
      if (!wrap || !container) return;

      /* CDN fallback: if Leaflet didn't load, hide the map section entirely */
      if (!isLeafletReady()) {
        wrap.innerHTML = '<div class="mapa-fallback" role="status"><span aria-hidden="true">⚠️</span> Mapa no disponible (Leaflet no cargado)</div>';
        return;
      }

      /* Initialize map only once */
      if (!mapInstance) {
        mapInstance = L.map(container, {
          zoomControl: true,
          attributionControl: true,
          scrollWheelZoom: true,
        });

        /* Dark tile layer (CartoDB Dark Matter) */
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 18,
        }).addTo(mapInstance);

        /* Handle popup button clicks (event delegation) */
        mapInstance.on("popupopen", function (e) {
          var popup = e.popup;
          var content = popup.getElement();
          if (!content) return;
          var btn = content.querySelector("[data-select-estacion]");
          if (btn) {
            btn.addEventListener("click", function () {
              var codigo = this.getAttribute("data-select-estacion");
              mapInstance.closePopup();
              if (onSelectEstacion) onSelectEstacion(codigo);
            });
          }
        });
      }

      /* Clear previous markers */
      mapMarkers.forEach(function (m) { mapInstance.removeLayer(m); });
      mapMarkers = [];

      /* Add markers for all stations */
      var bounds = [];
      estaciones.forEach(function (est) {
        if (typeof est.lat !== "number" || typeof est.lon !== "number") return;
        if (est.lat === 0 && est.lon === 0) return;

        var isActive = (est.codigo || est.id) === codigoActual;
        var icon = createMarkerIcon(isActive);
        var marker = L.marker([est.lat, est.lon], {
          icon: icon,
          title: est.nombre,
          alt: "Estación " + est.nombre,
          zIndexOffset: isActive ? 1000 : 0,
        });

        marker.bindPopup(buildPopupHTML(est), {
          maxWidth: 260,
          minWidth: 180,
          className: "dark-popup",
        });

        marker.addTo(mapInstance);
        mapMarkers.push(marker);
        bounds.push([est.lat, est.lon]);

        /* Auto-open popup for active station */
        if (isActive) {
          setTimeout(function () { marker.openPopup(); }, 300);
        }
      });

      /* Fit map to show all markers */
      if (bounds.length > 0) {
        mapInstance.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
      } else {
        /* Default: center on Colombia */
        mapInstance.setView([4.5, -73.5], 6);
      }

      /* Fix Leaflet rendering on initially hidden containers */
      setTimeout(function () {
        if (mapInstance) mapInstance.invalidateSize();
      }, 200);
    },
  };
})();
