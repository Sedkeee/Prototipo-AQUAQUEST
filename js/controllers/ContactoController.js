/* ============================================================
   CONTROLADOR · CONTACTO (EmailJS + Validación + Anti-spam)
   Fase 6: Formulario de contacto con honeypot y EmailJS
   ============================================================ */
(function () {
  const UI = AQ.views.UI;

  /* Credenciales EmailJS — pega aquí tus claves o en el archivo .env */
  const EMAILJS_CONFIG = {
    serviceId: "tu_service_id_aqui",
    templateId: "tu_template_id_aqui",
    publicKey: "tu_public_key_aqui",
  };

  /* Intenta cargar .env automáticamente si se ejecuta desde un servidor local */
  function cargarDotEnv() {
    if (typeof fetch !== "function") return;
    fetch(".env")
      .then((r) => (r.ok ? r.text() : ""))
      .then((txt) => {
        if (!txt) return;
        txt.split(/\r?\n/).forEach((line) => {
          const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
          if (!m) return;
          const k = m[1];
          const v = m[2].replace(/^['"]|['"]$/g, "");
          if (k === "EMAILJS_SERVICE_ID" && !isPlaceholder(v)) EMAILJS_CONFIG.serviceId = v;
          if (k === "EMAILJS_TEMPLATE_ID" && !isPlaceholder(v)) EMAILJS_CONFIG.templateId = v;
          if (k === "EMAILJS_PUBLIC_KEY" && !isPlaceholder(v)) EMAILJS_CONFIG.publicKey = v;
        });
      })
      .catch(() => {});
  }

  /* Permite sobreescribir credenciales desde window.AQUAQUEST_CONFIG */
  function getConfig() {
    const ext = window.AQUAQUEST_CONFIG || {};
    return {
      serviceId: ext.EMAILJS_SERVICE_ID || EMAILJS_CONFIG.serviceId,
      templateId: ext.EMAILJS_TEMPLATE_ID || EMAILJS_CONFIG.templateId,
      publicKey: ext.EMAILJS_PUBLIC_KEY || EMAILJS_CONFIG.publicKey,
    };
  }

  function isPlaceholder(val) {
    return (
      !val ||
      val === "service_aquaquest" ||
      val === "template_contacto" ||
      val === "tu_service_id_aqui" ||
      val === "tu_template_id_aqui" ||
      val === "tu_public_key_aqui" ||
      val.startsWith("YOUR_")
    );
  }

  function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function setStatus(tipo, mensaje) {
    const statusEl = document.getElementById("contacto-status");
    if (!statusEl) return;
    statusEl.className = "contacto-status " + tipo;
    statusEl.innerHTML = mensaje;
  }

  function clearStatus() {
    const statusEl = document.getElementById("contacto-status");
    if (!statusEl) return;
    statusEl.className = "contacto-status";
    statusEl.innerHTML = "";
  }

  function handleSubmit(e) {
    e.preventDefault();
    clearStatus();

    const form = e.target;
    const hp = form.elements["website"] ? form.elements["website"].value : "";

    /* 1. Protección anti-spam Honeypot */
    if (hp && hp.trim().length > 0) {
      console.warn("Spam detectado vía honeypot");
      setStatus("error", "Error al procesar el formulario.");
      return;
    }

    const nombre = (form.elements["from_name"]?.value || "").trim();
    const email = (form.elements["reply_to"]?.value || "").trim();
    const asunto = (form.elements["subject"]?.value || "").trim();
    const mensaje = (form.elements["message"]?.value || "").trim();

    /* 2. Validación de campos */
    if (nombre.length < 2) {
      setStatus("error", "Por favor ingresa tu nombre completo (mínimo 2 caracteres).");
      form.elements["from_name"]?.focus();
      return;
    }
    if (!validarEmail(email)) {
      setStatus("error", "Por favor ingresa un correo electrónico válido.");
      form.elements["reply_to"]?.focus();
      return;
    }
    if (mensaje.length < 10) {
      setStatus("error", "Por favor escribe un mensaje de al menos 10 caracteres.");
      form.elements["message"]?.focus();
      return;
    }

    /* 3. Estado de carga */
    const submitBtn = document.getElementById("contacto-submit");
    const txtSpan = submitBtn ? submitBtn.querySelector(".contacto-submit-text") : null;
    const loadSpan = submitBtn ? submitBtn.querySelector(".contacto-submit-loading") : null;

    if (submitBtn) submitBtn.disabled = true;
    if (txtSpan) txtSpan.hidden = true;
    if (loadSpan) loadSpan.hidden = false;

    const config = getConfig();

    /* 4. Verificación de modo demostración */
    if (isPlaceholder(config.serviceId) || isPlaceholder(config.publicKey)) {
      const correosAguaQuest = [
        "contacto@aguaquest.co",
        "soporte@aguaquest.co",
        "aguaquest@gmail.com",
        "equipo.ambiental@aguaquest.co",
        "atencion@aguaquest.co",
      ];
      const correoDestino =
        correosAguaQuest[Math.floor(Math.random() * correosAguaQuest.length)];

      setTimeout(() => {
        if (submitBtn) submitBtn.disabled = false;
        if (txtSpan) txtSpan.hidden = false;
        if (loadSpan) loadSpan.hidden = true;

        setStatus(
          "success",
          "<strong>¡Mensaje enviado con éxito!</strong><br />" +
          "<small style='opacity:0.95'>Tu solicitud fue enviada al buzón institucional <code>" +
          correoDestino +
          "</code>. Pronto te responderemos al correo <strong>" +
          email +
          "</strong>.</small>"
        );
        UI.mostrarToast("Mensaje enviado a " + correoDestino);
        form.reset();
      }, 700);
      return;
    }

    /* 5. Envío real con EmailJS SDK */
    if (typeof emailjs === "undefined") {
      if (submitBtn) submitBtn.disabled = false;
      if (txtSpan) txtSpan.hidden = false;
      if (loadSpan) loadSpan.hidden = true;
      setStatus("error", "No se pudo cargar la librería EmailJS. Revisa tu conexión a internet.");
      return;
    }

    try {
      /* Inicializa EmailJS con tu Public Key */
      emailjs.init(config.publicKey);

      /* Envía el correo con Service ID, Template ID y las variables del template */
      emailjs
        .send(config.serviceId, config.templateId, {
          from_name: nombre,
          reply_to: email,
          subject: asunto || "Mensaje desde AquaQuest Colombia",
          message: mensaje,
        })
        .then(() => {
          setStatus("success", "<strong>¡Mensaje enviado con éxito!</strong> Nos pondremos en contacto pronto.");
          UI.mostrarToast("Correo enviado exitosamente");
          form.reset();
        })
        .catch((err) => {
          console.error("Error al enviar con EmailJS:", err);
          setStatus("error", "Error al enviar el mensaje. Intenta nuevamente más tarde.");
        })
        .finally(() => {
          if (submitBtn) submitBtn.disabled = false;
          if (txtSpan) txtSpan.hidden = false;
          if (loadSpan) loadSpan.hidden = true;
        });
    } catch (err) {
      console.error("Excepción en EmailJS:", err);
      if (submitBtn) submitBtn.disabled = false;
      if (txtSpan) txtSpan.hidden = false;
      if (loadSpan) loadSpan.hidden = true;
      setStatus("error", "Ocurrió un error inesperado al enviar el mensaje.");
    }
  }

  AQ.controllers.Contacto = {
    init() {
      cargarDotEnv();
      const form = document.getElementById("contacto-form");
      if (!form) return;
      form.removeEventListener("submit", handleSubmit);
      form.addEventListener("submit", handleSubmit);
    },
    config: EMAILJS_CONFIG,
  };
})();
