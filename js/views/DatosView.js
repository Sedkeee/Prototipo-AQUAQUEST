/* ============================================================
   VISTA · DATOS REALES (info del punto, chips, gráfica, tabla)
   ============================================================ */
(function () {
  const $ = AQ.utils.$;
  const fmt = AQ.utils.formatearNumero;
  const SVG_NS = "http://www.w3.org/2000/svg";

  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  AQ.views.Datos = {
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
      const cont = $("chips-vars");
      cont.innerHTML = "";
      Object.entries(variables).forEach(([id, v]) => {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "chip" + (id === actual ? " active" : "");
        el.innerHTML = `${v.nombre}<span class="u">${v.unidad}</span>`;
        el.addEventListener("click", () => onSelect(id));
        cont.appendChild(el);
      });
    },

    renderChart(variable, serie) {
      $("chart-nombre").textContent = variable.nombre;
      $("chart-unidad").textContent = variable.unidad;

      const svg = $("chart");
      const W = 520, H = 200, pad = { l: 40, r: 14, t: 16, b: 22 };
      const innerW = W - pad.l - pad.r, innerH = H - pad.t - pad.b;
      const { puntos, totalMuestras } = serie;

      svg.innerHTML = "";
      if (puntos.length === 0) {
        svg.innerHTML = `<text x="${W / 2}" y="${H / 2}" fill="#8ba3b8" font-size="12" text-anchor="middle" font-style="italic">Sin datos numéricos para graficar</text>`;
        $("chart-rango").textContent = "—";
        $("chart-min").textContent = "";
        $("chart-max").textContent = "";
        return;
      }

      const vals = puntos.map(p => p.valor);
      let min = Math.min(...vals), max = Math.max(...vals);
      if (min === max) { min -= 1; max += 1; }
      const rangoY = max - min;
      const x = i => pad.l + (i / (totalMuestras - 1)) * innerW;
      const y = val => pad.t + innerH - ((val - min) / rangoY) * innerH;

      // Cuadrícula + etiquetas
      const grid = svgEl("g", {});
      for (let i = 0; i <= 4; i++) {
        const yv = pad.t + (i / 4) * innerH;
        grid.appendChild(svgEl("line", { x1: pad.l, x2: W - pad.r, y1: yv, y2: yv, stroke: "#1f4160", "stroke-dasharray": "3 4" }));
        const t = svgEl("text", { x: pad.l - 6, y: yv + 3, fill: "#8ba3b8", "font-size": "9.5", "text-anchor": "end" });
        t.textContent = fmt(max - (i / 4) * rangoY);
        grid.appendChild(t);
      }
      svg.appendChild(grid);

      // Área + línea
      if (puntos.length > 1) {
        let d = `M ${x(puntos[0].idx)} ${y(puntos[0].valor)}`;
        for (let i = 1; i < puntos.length; i++) d += ` L ${x(puntos[i].idx)} ${y(puntos[i].valor)}`;
        const base = pad.t + innerH;
        const dArea = `${d} L ${x(puntos[puntos.length - 1].idx)} ${base} L ${x(puntos[0].idx)} ${base} Z`;

        const defs = svgEl("defs", {});
        defs.innerHTML = `<linearGradient id="grad-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#00b4d8" stop-opacity=".35"/>
            <stop offset="100%" stop-color="#00b4d8" stop-opacity="0"/></linearGradient>`;
        svg.appendChild(defs);
        svg.appendChild(svgEl("path", { d: dArea, fill: "url(#grad-area)" }));
        svg.appendChild(svgEl("path", {
          d, fill: "none", stroke: "#00b4d8", "stroke-width": "2.2",
          "stroke-linejoin": "round", "stroke-linecap": "round", class: "chart-line"
        }));
      }

      // Puntos con tooltip
      puntos.forEach(p => {
        const c = svgEl("circle", {
          cx: x(p.idx), cy: y(p.valor), r: "4", fill: "#90e0ef",
          stroke: "#0077b6", "stroke-width": "1.5", class: "chart-dot"
        });
        const t = svgEl("title", {});
        t.textContent = `${p.fecha} · ${fmt(p.valor)} ${variable.unidad}`;
        c.appendChild(t);
        svg.appendChild(c);
      });

      $("chart-min").textContent = serie.primeraFecha;
      $("chart-max").textContent = serie.ultimaFecha;
      $("chart-rango").textContent = `Rango: ${fmt(min)} – ${fmt(max)} ${variable.unidad}`;
    },

    renderTabla(filas) {
      const tbody = document.querySelector("#tabla-datos tbody");
      tbody.innerHTML = "";
      filas.forEach(f => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="fecha">${f.fecha}</td>
          <td>${f.variable.nombre}</td>
          <td class="valor" style="text-align:right">
            ${f.esBajo
              ? `<span class="bajo-lcm">&lt;${f.raw.slice(1)}</span>`
              : `${f.raw} <span style="color:var(--muted);font-size:11px">${f.variable.unidad}</span>`}
          </td>`;
        tbody.appendChild(tr);
      });
    }
  };
})();
