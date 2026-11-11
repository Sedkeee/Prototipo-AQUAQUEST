/* ============================================================
   COMPONENTES REACT · Botones de toda la aplicación
   Usa React 18 (cargado por CDN) con React.createElement para
   funcionar directamente al abrir index.html sin compiladores.
   Incluye un respaldo ligero si no hay conexión a internet.
   ============================================================ */
(function () {
  const Fragment = (window.React && window.React.Fragment) ? window.React.Fragment : "__fragment__";

  // Respaldo mínimo en caso de abrir sin internet (offline)
  const h = (window.React && window.React.createElement)
    ? window.React.createElement
    : function fallbackCreateElement(type, props, ...children) {
      return { __fallback: true, type, props: props || {}, children };
    };

  const roots = new WeakMap();

  function renderFallbackNode(vnode) {
    if (vnode == null || vnode === false || vnode === true) return document.createTextNode("");
    if (typeof vnode === "string" || typeof vnode === "number") return document.createTextNode(String(vnode));
    if (Array.isArray(vnode)) {
      const frag = document.createDocumentFragment();
      vnode.forEach(c => frag.appendChild(renderFallbackNode(c)));
      return frag;
    }
    if (vnode.type === Fragment) {
      const frag = document.createDocumentFragment();
      (vnode.children || []).flat(Infinity).forEach(c => frag.appendChild(renderFallbackNode(c)));
      return frag;
    }
    if (typeof vnode.type === "function") {
      return renderFallbackNode(vnode.type(Object.assign({}, vnode.props, { children: vnode.children })));
    }
    const isSvg = ["svg", "path", "circle", "rect", "line"].includes(vnode.type);
    const el = isSvg
      ? document.createElementNS("http://www.w3.org/2000/svg", vnode.type)
      : document.createElement(vnode.type);

    Object.entries(vnode.props || {}).forEach(([k, val]) => {
      if (val == null || k === "key" || k === "children") return;
      if (k === "className") {
        if (isSvg) el.setAttribute("class", val);
        else el.className = val;
      } else if (k === "style" && typeof val === "object") {
        Object.assign(el.style, val);
      } else if (k.startsWith("on") && typeof val === "function") {
        el.addEventListener(k.slice(2).toLowerCase(), val);
      } else if (k === "disabled") {
        el.disabled = Boolean(val);
      } else if (k === "strokeWidth") {
        el.setAttribute("stroke-width", val);
      } else if (k === "strokeLinecap") {
        el.setAttribute("stroke-linecap", val);
      } else if (k === "strokeLinejoin") {
        el.setAttribute("stroke-linejoin", val);
      } else {
        el.setAttribute(k, String(val));
      }
    });

    (vnode.children || []).flat(Infinity).forEach(child => {
      el.appendChild(renderFallbackNode(child));
    });
    return el;
  }

  /**
   * Monta o actualiza un componente React en un contenedor DOM.
   */
  function mount(container, element) {
    if (!container) return;
    if (window.ReactDOM && window.ReactDOM.createRoot) {
      let root = roots.get(container);
      if (!root) {
        container.innerHTML = "";
        root = window.ReactDOM.createRoot(container);
        roots.set(container, root);
      }
      root.render(element);
    } else {
      container.innerHTML = "";
      container.appendChild(renderFallbackNode(element));
    }
  }

  /* ---------- Componente base AQButton ---------- */
  function AQButton(props) {
    const {
      id,
      type = "button",
      className = "",
      disabled = false,
      title,
      ariaLabel,
      ariaSelected,
      role,
      dataset = {},
      onClick,
      children
    } = props;

    const attrs = {
      id,
      type,
      className,
      disabled,
      title,
      role,
      onClick
    };
    if (ariaLabel !== undefined) attrs["aria-label"] = ariaLabel;
    if (ariaSelected !== undefined) attrs["aria-selected"] = ariaSelected;
    Object.entries(dataset).forEach(([k, v]) => {
      attrs["data-" + k] = v;
    });

    return h("button", attrs, children);
  }

  /* ---------- Iconos SVG en React ---------- */
  function EyeIcon({ visible }) {
    if (!visible) {
      return h(
        "svg",
        { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" },
        h("path", { d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" }),
        h("circle", { cx: "12", cy: "12", r: "3" })
      );
    }
    return h(
      "svg",
      { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" },
      h("path", { d: "M9.88 9.88a3 3 0 1 0 4.24 4.24" }),
      h("path", { d: "M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" }),
      h("path", { d: "M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" }),
      h("line", { x1: "2", x2: "22", y1: "2", y2: "22" })
    );
  }

  function HeartIcon({ active }) {
    return h(
      "svg",
      {
        width: "14",
        height: "14",
        viewBox: "0 0 24 24",
        fill: active ? "currentColor" : "none",
        stroke: "currentColor",
        strokeWidth: "2"
      },
      h("path", {
        d: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      })
    );
  }

  function CommentIcon() {
    return h(
      "svg",
      { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" },
      h("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" })
    );
  }

  /* ---------- 1. Botones de Cabecera (Header) ---------- */
  function HeaderActions({ onVerSwagger, onVerLogin, onLogout }) {
    return h(
      Fragment,
      null,
      h(AQButton, {
        id: "btn-swagger",
        className: "btn-swagger",
        title: "Abrir documentación interactiva OpenAPI / Swagger",
        onClick: onVerSwagger
      }, "{ } API Swagger"),
      h(AQButton, {
        id: "btn-ver-login",
        className: "btn-ver-login",
        title: "Iniciar sesión",
        onClick: onVerLogin
      }, "Iniciar sesión"),
      h(AQButton, {
        id: "btn-logout",
        className: "btn-logout",
        title: "Cerrar sesión",
        onClick: onLogout
      }, "Salir")
    );
  }

  function SwaggerCloseButton({ onClose, onClick }) {
    return h(AQButton, {
      id: "btn-cerrar-swagger",
      className: "btn-cerrar-swagger",
      title: "Cerrar documentación API",
      onClick: onClose || onClick
    }, "✕ Cerrar");
  }

  /* ---------- 2. Botones de Autenticación ---------- */
  function CloseAuthButton({ onOmitir }) {
    return h(AQButton, {
      className: "btn-volver-app",
      title: "Cerrar",
      onClick: e => {
        e.preventDefault();
        if (onOmitir) onOmitir();
      }
    }, "✕");
  }

  function AuthTabs({ activeTab, onSelectTab }) {
    const isLogin = activeTab === "login";
    return h(
      Fragment,
      null,
      h(AQButton, {
        id: "tab-login",
        className: "auth-tab" + (isLogin ? " active" : ""),
        role: "tab",
        ariaSelected: isLogin,
        onClick: () => onSelectTab && onSelectTab("login")
      }, "Iniciar sesión"),
      h(AQButton, {
        id: "tab-registro",
        className: "auth-tab" + (!isLogin ? " active" : ""),
        role: "tab",
        ariaSelected: !isLogin,
        onClick: () => onSelectTab && onSelectTab("registro")
      }, "Crear cuenta")
    );
  }

  function PasswordToggleButton({ inputId }) {
    const useState = window.React && window.React.useState;
    const [visible, setVisible] = useState ? useState(false) : [false, null];

    const handleClick = e => {
      const input = document.getElementById(inputId);
      if (!input) return;
      const nowVisible = input.type === "password";
      input.type = nowVisible ? "text" : "password";
      if (setVisible) {
        setVisible(nowVisible);
      } else {
        const btn = e.currentTarget;
        btn.innerHTML = "";
        btn.appendChild(renderFallbackNode(h(EyeIcon, { visible: nowVisible })));
      }
    };

    return h(
      AQButton,
      {
        className: "toggle-pass",
        ariaLabel: visible ? "Ocultar contraseña" : "Mostrar contraseña",
        onClick: handleClick
      },
      h(EyeIcon, { visible })
    );
  }

  function AvatarSelector({ avatares, seleccionado, onSelect }) {
    return h(
      Fragment,
      null,
      avatares.map(a =>
        h(
          AQButton,
          {
            key: a,
            className: "avatar-opt" + (a === seleccionado ? " active" : ""),
            ariaLabel: "Elegir avatar " + a,
            onClick: () => onSelect(a)
          },
          a
        )
      )
    );
  }

  function AuthFormActions({ modo, cargando, onOmitir }) {
    const esLogin = modo === "login";
    return h(
      Fragment,
      null,
      h(
        AQButton,
        {
          id: esLogin ? "btn-login" : "btn-registro",
          type: "submit",
          className: "btn-auth" + (esLogin ? "" : " verde") + (cargando ? " cargando" : ""),
          disabled: cargando
        },
        esLogin ? "Entrar" : "Crear cuenta y entrar"
      ),
      h(
        AQButton,
        {
          id: esLogin ? "btn-omitir-auth" : undefined,
          className: "btn-auth btn-invitado",
          onClick: e => {
            e.preventDefault();
            if (onOmitir) onOmitir();
          }
        },
        "Continuar sin cuenta"
      )
    );
  }

  /* ---------- 3. Botones de Datos Reales (Chips de Variables y Carga CSV) ---------- */
  function ImportCsvButton({ onClick }) {
    return h(
      AQButton,
      {
        id: "btn-importar-csv",
        className: "btn-importar-csv",
        title: "Cargar archivo CSV exportado desde Excel / IDEAM",
        onClick
      },
      "📂 Cargar CSV / Excel"
    );
  }

  function VariableChips({ variables, actual, onSelect }) {
    return h(
      Fragment,
      null,
      Object.entries(variables).map(([id, v]) =>
        h(
          AQButton,
          {
            key: id,
            className: "chip" + (id === actual ? " active" : ""),
            onClick: () => onSelect(id)
          },
          v.nombre,
          h("span", { className: "u" }, v.unidad)
        )
      )
    );
  }

  /* ---------- 4. Botones de Juego (Retos, Reiniciar y Modal) ---------- */
  function RetoActionButton({ hecho, onClick }) {
    return h(
      AQButton,
      {
        className: "btn-completar",
        disabled: hecho,
        onClick: hecho ? undefined : onClick
      },
      hecho ? "Completado" : "Registrar acción"
    );
  }

  function ResetProgressButton({ onClick }) {
    return h(
      AQButton,
      {
        id: "btn-reset",
        className: "btn-reset",
        onClick
      },
      "Reiniciar mi progreso"
    );
  }

  function ModalActions({ confirmarHabilitado, onCancelar, onConfirmar }) {
    return h(
      Fragment,
      null,
      h(
        AQButton,
        {
          id: "modal-cancelar",
          className: "btn btn-sec",
          onClick: onCancelar
        },
        "Cancelar"
      ),
      h(
        AQButton,
        {
          id: "modal-confirmar",
          className: "btn btn-pri",
          disabled: !confirmarHabilitado,
          onClick: onConfirmar
        },
        "Registrar y ganar XP"
      )
    );
  }

  /* ---------- 5. Botones de Comunidad ---------- */
  const CATEGORIAS_COMPOSER = [
    { id: "accion", label: "Acción" },
    { id: "idea", label: "Idea" },
    { id: "pregunta", label: "Pregunta" },
    { id: "logro", label: "Logro" }
  ];

  const FILTROS_COMUNIDAD = [
    { id: "todos", label: "Todos" },
    { id: "accion", label: "Acciones" },
    { id: "idea", label: "Ideas" },
    { id: "pregunta", label: "Preguntas" },
    { id: "logro", label: "Logros" }
  ];

  function ComposerCategoryButtons({ activa, onSelect }) {
    return h(
      Fragment,
      null,
      CATEGORIAS_COMPOSER.map(c =>
        h(
          AQButton,
          {
            key: c.id,
            className: "cat-btn" + (c.id === activa ? " active" : ""),
            dataset: { cat: c.id },
            onClick: () => onSelect(c.id)
          },
          c.label
        )
      )
    );
  }

  function RemovePreviewButton({ onClick }) {
    return h(
      AQButton,
      {
        id: "composer-quitar",
        className: "quitar",
        title: "Quitar foto",
        onClick
      },
      "✕"
    );
  }

  function ComposerFooterActions({ publicarHabilitado, onAdjuntar, onPublicar }) {
    return h(
      Fragment,
      null,
      h(
        AQButton,
        {
          id: "btn-adjuntar",
          className: "btn-adjuntar",
          onClick: onAdjuntar
        },
        "Adjuntar foto"
      ),
      h("span", { className: "xp-nota" }, "Compartir no da XP — solo inspira"),
      h(
        AQButton,
        {
          id: "btn-publicar",
          className: "btn-publicar",
          disabled: !publicarHabilitado,
          onClick: onPublicar
        },
        "Publicar"
      )
    );
  }

  function CommunityFilterButtons({ activo, onSelect }) {
    return h(
      Fragment,
      null,
      FILTROS_COMUNIDAD.map(f =>
        h(
          AQButton,
          {
            key: f.id,
            className: "filtro-btn" + (f.id === activo ? " active" : ""),
            dataset: { filtro: f.id },
            onClick: () => onSelect(f.id)
          },
          f.label
        )
      )
    );
  }

  function PostFooterButtons({ reaccionado, totalLikes, totalComentarios, onLike, onToggleComentarios }) {
    return h(
      Fragment,
      null,
      h(
        AQButton,
        {
          className: "btn-reaccion" + (reaccionado ? " reaccionado" : ""),
          dataset: { accion: "like" },
          onClick: onLike
        },
        h(HeartIcon, { active: reaccionado }),
        " ",
        h("span", { className: "num" }, String(totalLikes))
      ),
      h(
        AQButton,
        {
          className: "btn-comentar",
          dataset: { accion: "comentar" },
          onClick: onToggleComentarios
        },
        h(CommentIcon),
        " ",
        h("span", { className: "num" }, String(totalComentarios))
      )
    );
  }

  function CommentSendButton({ onSend }) {
    return h(
      AQButton,
      {
        dataset: { accion: "enviar-comentario" },
        onClick: onSend
      },
      "Enviar"
    );
  }

  AQ.components = {
    h,
    mount,
    AQButton,
    HeaderActions,
    SwaggerCloseButton,
    CloseAuthButton,
    AuthTabs,
    PasswordToggleButton,
    AvatarSelector,
    AuthFormActions,
    ImportCsvButton,
    VariableChips,
    RetoActionButton,
    ResetProgressButton,
    ModalActions,
    ComposerCategoryButtons,
    RemovePreviewButton,
    ComposerFooterActions,
    CommunityFilterButtons,
    PostFooterButtons,
    CommentSendButton
  };
})();

