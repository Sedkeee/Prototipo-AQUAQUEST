/* ============================================================
   CONTROLADOR · SWAGGER / OPENAPI 3.0 INTEGRADO
   Renderiza Swagger UI dentro de index.html e intercepta las
   peticiones "Try it out" hacia https://api.aquaquest.local/v1
   para conectarlas en vivo con la Base de Datos y modelos de AquaQuest.
   ============================================================ */
(function () {
  const $ = AQ.utils.$;
  let swaggerIniciado = false;
  let interceptorInstalado = false;

  const SPEC = {
    openapi: "3.0.3",
    info: {
      title: "AquaQuest Colombia API + Base de Datos IDEAM",
      version: "1.1.0",
      description:
        "Documentación interactiva OpenAPI 3.0 de **AquaQuest Colombia** (Base de Datos Relacional IDEAM, Autenticación, Juego de retos de acción real y Comunidad). Usa **Try it out → Execute** para probar cualquier endpoint en vivo contra las tablas y estaciones del CSV del IDEAM."
    },
    servers: [
      {
        url: "https://api.aquaquest.local/v1",
        description: "Conexión interactiva en vivo con la Base de Datos de AquaQuest"
      }
    ],
    tags: [
      { name: "Base de Datos Relacional", description: "Estado de conexión, tablas del Diagrama Relacional (ZONAS_HIDROGRAFICAS, PUNTOS_MONITOREO, MUESTRAS, MEDICIONES) e importación CSV" },
      { name: "Datos IDEAM", description: "Consulta de datos reales de calidad del agua por estación y variable" },
      { name: "Autenticación", description: "Registro, inicio de sesión (SHA-256 + sal) y perfil del explorador/a" },
      { name: "Juego y Retos", description: "Retos de acción real (tipo B), reputación XP, niveles y bitácora" },
      { name: "Comunidad", description: "Muro comunitario de acciones, ideas, preguntas, logros, likes y comentarios" }
    ],
    paths: {
      "/api/db/status": {
        get: {
          tags: ["Base de Datos Relacional"],
          summary: "Consultar estado de la base de datos relacional y resumen del CSV del IDEAM",
          responses: {
            "200": { description: "Resumen de tablas, registros totales del CSV y estación activa" }
          }
        }
      },
      "/api/datos/zonas": {
        get: {
          tags: ["Base de Datos Relacional"],
          summary: "Listar tabla ZONAS_HIDROGRAFICAS cargadas desde el CSV",
          responses: {
            "200": { description: "Lista de zonas y subzonas hidrográficas (SZH)" }
          }
        }
      },
      "/api/datos/estaciones": {
        get: {
          tags: ["Base de Datos Relacional"],
          summary: "Listar tabla PUNTOS_MONITOREO (estaciones del IDEAM disponibles)",
          responses: {
            "200": { description: "Lista de estaciones de monitoreo con coordenadas y muestras" }
          }
        }
      },
      "/api/datos/estacion-activa": {
        patch: {
          tags: ["Base de Datos Relacional"],
          summary: "Cambiar la estación de monitoreo activa en la aplicación",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["codigo"],
                  properties: {
                    codigo: {
                      type: "string",
                      example: "21207960",
                      description: "Código IDEAM de la estación (ej. 11027030, 21027010, 21207960, 26167070)"
                    }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Estación seleccionada y actualizada en pantalla" }
          }
        }
      },
      "/api/datos/punto": {
        get: {
          tags: ["Datos IDEAM"],
          summary: "Obtener información de la estación de monitoreo activa",
          responses: {
            "200": { description: "Metadatos geográficos e hidrológicos de la estación activa" }
          }
        }
      },
      "/api/datos/variables": {
        get: {
          tags: ["Datos IDEAM"],
          summary: "Listar tabla VARIABLES (las 13 variables medidas por el IDEAM)",
          responses: {
            "200": { description: "Diccionario de variables con nombre, unidad, categoría y matriz" }
          }
        }
      },
      "/api/datos/serie/{variableId}": {
        get: {
          tags: ["Datos IDEAM"],
          summary: "Obtener la serie histórica graficable de una variable en la estación activa",
          parameters: [
            {
              name: "variableId",
              in: "path",
              required: true,
              description: "Identificador de la variable medida",
              schema: {
                type: "string",
                enum: ["ph", "od", "temp", "cond", "turb", "dqo", "sst", "fe", "al", "mn", "zn", "no3", "p_total"],
                default: "ph"
              }
            }
          ],
          responses: {
            "200": { description: "Serie histórica de puntos numéricos" },
            "404": { description: "Variable no encontrada" }
          }
        }
      },
      "/api/datos/mediciones": {
        get: {
          tags: ["Datos IDEAM"],
          summary: "Consultar tabla MEDICIONES / MUESTRAS recientes de la estación activa",
          parameters: [
            {
              name: "limite",
              in: "query",
              required: false,
              description: "Cantidad de fechas de muestreo recientes a incluir (1–16)",
              schema: { type: "integer", default: 4, minimum: 1, maximum: 16 }
            }
          ],
          responses: {
            "200": { description: "Lista de mediciones con valores exactos o bajo LCM (<X)" }
          }
        }
      },
      "/api/auth/register": {
        post: {
          tags: ["Autenticación"],
          summary: "Registrar una nueva cuenta en la tabla USUARIOS",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegistroInput" }
              }
            }
          },
          responses: {
            "201": { description: "Usuario creado exitosamente" },
            "400": { description: "Datos inválidos o correo ya registrado" }
          }
        }
      },
      "/api/auth/login": {
        post: {
          tags: ["Autenticación"],
          summary: "Iniciar sesión con correo y contraseña",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginInput" }
              }
            }
          },
          responses: {
            "200": { description: "Sesión iniciada correctamente" },
            "401": { description: "Credenciales inválidas" }
          }
        }
      },
      "/api/auth/me": {
        get: {
          tags: ["Autenticación"],
          summary: "Obtener el perfil del usuario actual",
          responses: {
            "200": { description: "Perfil del usuario activo o invitado" }
          }
        }
      },
      "/api/auth/profile": {
        patch: {
          tags: ["Autenticación"],
          summary: "Actualizar nombre o avatar del usuario actual",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    nombre: { type: "string", example: "Guardiana del Atrato" },
                    avatar: { type: "string", enum: ["AQ", "CO", "AG", "EX", "PR", "ID", "CU", "SN"], example: "AG" }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Perfil actualizado" }
          }
        }
      },
      "/api/auth/logout": {
        post: {
          tags: ["Autenticación"],
          summary: "Cerrar la sesión activa",
          responses: {
            "200": { description: "Sesión cerrada correctamente" }
          }
        }
      },
      "/api/juego/retos": {
        get: {
          tags: ["Juego y Retos"],
          summary: "Listar tablas RETOS y LOGROS (niveles de reputación)",
          responses: {
            "200": { description: "Catálogo de retos y niveles de reputación" }
          }
        }
      },
      "/api/juego/progreso": {
        get: {
          tags: ["Juego y Retos"],
          summary: "Consultar XP, nivel actual y tabla ACCIONES_USUARIO del jugador",
          responses: {
            "200": { description: "Estado de progreso del jugador actual" }
          }
        },
        delete: {
          tags: ["Juego y Retos"],
          summary: "Reiniciar el progreso (XP, bitácora y retos) del usuario actual",
          responses: {
            "200": { description: "Progreso reiniciado a cero" }
          }
        }
      },
      "/api/juego/acciones": {
        post: {
          tags: ["Juego y Retos"],
          summary: "Insertar registro en ACCIONES_USUARIO (completar reto y ganar XP)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AccionInput" }
              }
            }
          },
          responses: {
            "201": { description: "Acción registrada y XP sumado" },
            "400": { description: "Reto ya completado, inexistente o evidencia insuficiente" }
          }
        }
      },
      "/api/comunidad/posts": {
        get: {
          tags: ["Comunidad"],
          summary: "Obtener publicaciones del muro comunitario",
          parameters: [
            {
              name: "categoria",
              in: "query",
              required: false,
              description: "Filtrar por categoría de publicación",
              schema: {
                type: "string",
                enum: ["todos", "accion", "idea", "pregunta", "logro"],
                default: "todos"
              }
            }
          ],
          responses: {
            "200": { description: "Lista de publicaciones ordenadas de más reciente a más antigua" }
          }
        },
        post: {
          tags: ["Comunidad"],
          summary: "Crear una nueva publicación en la comunidad (sin XP)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NuevoPostInput" }
              }
            }
          },
          responses: {
            "201": { description: "Publicación creada exitosamente" },
            "400": { description: "Texto demasiado corto" }
          }
        }
      },
      "/api/comunidad/posts/{postId}/like": {
        post: {
          tags: ["Comunidad"],
          summary: "Alternar reacción 'Me gusta' en una publicación",
          parameters: [
            {
              name: "postId",
              in: "path",
              required: true,
              schema: { type: "string", example: "seed1" }
            }
          ],
          responses: {
            "200": { description: "Reacción actualizada" }
          }
        }
      },
      "/api/comunidad/posts/{postId}/comentarios": {
        post: {
          tags: ["Comunidad"],
          summary: "Agregar un comentario a una publicación",
          parameters: [
            {
              name: "postId",
              in: "path",
              required: true,
              schema: { type: "string", example: "seed1" }
            }
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["texto"],
                  properties: {
                    texto: { type: "string", example: "¡Excelente iniciativa por el agua!" }
                  }
                }
              }
            }
          },
          responses: {
            "201": { description: "Comentario agregado exitosamente" },
            "400": { description: "Comentario inválido o publicación no encontrada" }
          }
        }
      }
    },
    components: {
      schemas: {
        RegistroInput: {
          type: "object",
          required: ["nombre", "correo", "password"],
          properties: {
            nombre: { type: "string", example: "Camila Ríos" },
            correo: { type: "string", example: "camila@aquaquest.co" },
            password: { type: "string", example: "AguaSegura2026!" },
            avatar: { type: "string", enum: ["AQ", "CO", "AG", "EX", "PR", "ID", "CU", "SN"], default: "AQ" }
          }
        },
        LoginInput: {
          type: "object",
          required: ["correo", "password"],
          properties: {
            correo: { type: "string", example: "camila@aquaquest.co" },
            password: { type: "string", example: "AguaSegura2026!" },
            recordar: { type: "boolean", default: true }
          }
        },
        AccionInput: {
          type: "object",
          required: ["retoId", "evidencia"],
          properties: {
            retoId: { type: "string", enum: ["r1", "r2", "r3", "r4", "r5", "r6"], example: "r1" },
            evidencia: { type: "string", example: "Cerré la llave durante el cepillado de dientes toda la mañana." }
          }
        },
        NuevoPostInput: {
          type: "object",
          required: ["categoria", "texto"],
          properties: {
            categoria: { type: "string", enum: ["accion", "idea", "pregunta", "logro"], default: "accion" },
            texto: { type: "string", example: "Hoy revisamos todas las llaves del colegio para detectar fugas a tiempo." }
          }
        }
      }
    }
  };

  function jsonResponse(status, data) {
    return new Response(JSON.stringify(data, null, 2), {
      status,
      headers: { "Content-Type": "application/json" }
    });
  }

  function usuarioActivo() {
    return AQ.models.Auth.usuarioActual() || {
      id: "u_demo",
      nombre: "Explorador/a",
      correo: "invitado@aquaquest.co",
      avatar: "AQ",
      rol: "explorador"
    };
  }

  function refrescarVistas(usuario) {
    const u = usuario || usuarioActivo();
    AQ.views.UI.renderHeaderUsuario(u);
    AQ.controllers.Juego.init(u, actualizado => {
      AQ.views.UI.renderHeaderUsuario(actualizado);
      AQ.controllers.Comunidad.actualizarUsuario(actualizado);
    });
    AQ.controllers.Comunidad.refrescar();
  }

  async function manejarPeticionSimulada(urlStr, init = {}) {
    const url = new URL(urlStr);
    const path = url.pathname.replace(/^\/v1/, "");
    const method = (init.method || "GET").toUpperCase();
    let body = {};
    if (init.body) {
      try { body = typeof init.body === "string" ? JSON.parse(init.body) : init.body; } catch (e) { body = {}; }
    }

    // --- BASE DE DATOS Y DATOS IDEAM ---
    if (path === "/api/db/status" && method === "GET") {
      return jsonResponse(200, {
        conectado: true,
        esquemaSQL: "database/schema_mysql.sql",
        tablasRelacionales: [
          "ZONAS_HIDROGRAFICAS",
          "PUNTOS_MONITOREO",
          "VARIABLES",
          "MUESTRAS",
          "MEDICIONES",
          "USUARIOS",
          "RETOS",
          "ACCIONES_USUARIO",
          "LOGROS",
          "USUARIO_LOGROS"
        ],
        ...AQ.models.Datos.resumenBD()
      });
    }
    if (path === "/api/datos/zonas" && method === "GET") {
      return jsonResponse(200, AQ.models.Datos.zonasHidrograficas());
    }
    if (path === "/api/datos/estaciones" && method === "GET") {
      return jsonResponse(200, AQ.models.Datos.estaciones().map(e => ({
        id_punto: e.id_punto,
        codigo: e.codigo,
        nombre: e.nombre,
        corriente: e.corriente,
        departamento: e.departamento,
        municipio: e.municipio,
        cuenca: e.cuenca,
        subzona: e.subzona,
        lat: e.lat,
        lon: e.lon,
        elevacion: e.elevacion,
        muestrasCargadas: (e.muestras || []).length
      })));
    }
    if (path === "/api/datos/estacion-activa" && method === "PATCH") {
      const p = AQ.models.Datos.seleccionarEstacion(body.codigo);
      if (AQ.controllers.Datos && AQ.controllers.Datos.refrescar) {
        AQ.controllers.Datos.refrescar();
      }
      return jsonResponse(200, { ok: true, estacionActiva: p });
    }
    if (path === "/api/datos/punto" && method === "GET") {
      return jsonResponse(200, AQ.models.Datos.PUNTO);
    }
    if (path === "/api/datos/variables" && method === "GET") {
      return jsonResponse(200, AQ.models.Datos.VARIABLES);
    }
    if (path.startsWith("/api/datos/serie/") && method === "GET") {
      const varId = decodeURIComponent(path.split("/").pop());
      const variable = AQ.models.Datos.VARIABLES[varId];
      if (!variable) return jsonResponse(404, { ok: false, error: "Variable no encontrada: " + varId });
      return jsonResponse(200, { estacion: AQ.models.Datos.PUNTO.nombre, variable, ...AQ.models.Datos.serie(varId) });
    }
    if (path === "/api/datos/mediciones" && method === "GET") {
      const limite = parseInt(url.searchParams.get("limite") || "4", 10);
      return jsonResponse(200, AQ.models.Datos.ultimasMediciones(limite));
    }

    // --- AUTENTICACIÓN ---
    if (path === "/api/auth/register" && method === "POST") {
      const r = await AQ.models.Auth.registrar(body);
      return jsonResponse(r.ok ? 201 : 400, r);
    }
    if (path === "/api/auth/login" && method === "POST") {
      const r = await AQ.models.Auth.iniciarSesion(body.correo, body.password, body.recordar);
      if (r.ok) refrescarVistas(r.usuario);
      return jsonResponse(r.ok ? 200 : 401, r);
    }
    if (path === "/api/auth/me" && method === "GET") {
      return jsonResponse(200, usuarioActivo());
    }
    if (path === "/api/auth/profile" && method === "PATCH") {
      const u = AQ.models.Auth.actualizarPerfil(body) || { ...usuarioActivo(), ...body };
      refrescarVistas(u);
      return jsonResponse(200, u);
    }
    if (path === "/api/auth/logout" && method === "POST") {
      AQ.models.Auth.cerrarSesion();
      refrescarVistas();
      return jsonResponse(200, { ok: true, mensaje: "Sesión cerrada" });
    }

    // --- JUEGO Y RETOS ---
    if (path === "/api/juego/retos" && method === "GET") {
      return jsonResponse(200, { retos: AQ.models.Juego.RETOS, niveles: AQ.models.Juego.NIVELES });
    }
    if (path === "/api/juego/progreso" && method === "GET") {
      const xp = AQ.models.Juego.xp();
      return jsonResponse(200, {
        xp,
        nivel: AQ.models.Juego.calcularNivel(xp),
        retosCompletados: AQ.models.Juego.retosCompletados(),
        bitacora: AQ.models.Juego.acciones()
      });
    }
    if (path === "/api/juego/progreso" && method === "DELETE") {
      AQ.models.Juego.reset();
      refrescarVistas();
      return jsonResponse(200, { ok: true, mensaje: "Progreso del jugador reiniciado" });
    }
    if (path === "/api/juego/acciones" && method === "POST") {
      const xpGanado = AQ.models.Juego.registrarAccion(body.retoId, body.evidencia);
      if (xpGanado === null) {
        return jsonResponse(400, {
          ok: false,
          error: "El reto ya fue completado, no existe o la evidencia tiene menos de 3 caracteres."
        });
      }
      refrescarVistas();
      AQ.views.UI.mostrarToast(`+${xpGanado} XP · ¡Acción registrada desde Swagger!`);
      const xp = AQ.models.Juego.xp();
      return jsonResponse(201, {
        ok: true,
        xpGanado,
        xpTotal: xp,
        nivel: AQ.models.Juego.calcularNivel(xp),
        retosCompletados: AQ.models.Juego.retosCompletados(),
        bitacora: AQ.models.Juego.acciones()
      });
    }

    // --- COMUNIDAD ---
    if (path === "/api/comunidad/posts" && method === "GET") {
      const cat = url.searchParams.get("categoria") || "todos";
      return jsonResponse(200, AQ.models.Comunidad.obtenerPosts(cat));
    }
    if (path === "/api/comunidad/posts" && method === "POST") {
      const texto = String(body.texto || "").trim();
      if (texto.length < 3) return jsonResponse(400, { ok: false, error: "El texto debe tener mínimo 3 caracteres." });
      const u = usuarioActivo();
      const post = AQ.models.Comunidad.publicar({
        autor: u.nombre,
        avatar: u.avatar,
        categoria: body.categoria || "accion",
        texto,
        imagen: null
      });
      refrescarVistas();
      AQ.views.UI.mostrarToast("Publicado desde Swagger API", "purple");
      return jsonResponse(201, post);
    }
    const matchLike = path.match(/^\/api\/comunidad\/posts\/([^/]+)\/like$/);
    if (matchLike && method === "POST") {
      const postId = decodeURIComponent(matchLike[1]);
      AQ.models.Comunidad.toggleLike(postId);
      refrescarVistas();
      return jsonResponse(200, { ok: true, postId });
    }
    const matchComent = path.match(/^\/api\/comunidad\/posts\/([^/]+)\/comentarios$/);
    if (matchComent && method === "POST") {
      const postId = decodeURIComponent(matchComent[1]);
      const texto = String(body.texto || "").trim();
      if (texto.length < 2) return jsonResponse(400, { ok: false, error: "El comentario es demasiado corto." });
      const u = usuarioActivo();
      const ok = AQ.models.Comunidad.comentar(postId, u.nombre, texto);
      if (!ok) return jsonResponse(400, { ok: false, error: "No se encontró la publicación." });
      refrescarVistas();
      return jsonResponse(201, { ok: true, postId, autor: u.nombre, texto });
    }

    return jsonResponse(404, { ok: false, error: "Endpoint no encontrado: " + method + " " + path });
  }

  function instalarInterceptorFetch() {
    if (interceptorInstalado) return;
    const origFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      const url = typeof input === "string" ? input : (input && input.url) || "";
      if (url.startsWith("https://api.aquaquest.local")) {
        return manejarPeticionSimulada(url, init);
      }
      return origFetch(input, init);
    };
    interceptorInstalado = true;
  }

  function montarSwaggerUI() {
    if (swaggerIniciado) return;
    instalarInterceptorFetch();

    const cont = $("swagger-ui");
    if (!cont) return;

    if (window.SwaggerUIBundle) {
      window.SwaggerUIBundle({
        spec: SPEC,
        dom_id: "#swagger-ui",
        deepLinking: true,
        docExpansion: "list",
        defaultModelsExpandDepth: 1,
        filter: true
      });
      swaggerIniciado = true;
    } else {
      cont.innerHTML = `<div style="padding:20px;color:var(--muted)">No se pudo cargar Swagger UI desde el CDN. Verifica tu conexión a internet o consulta el archivo <code>openapi.json</code>.</div>`;
    }
  }

  AQ.controllers.Swagger = {
    SPEC,
    abrirModal() {
      const modal = $("swagger-modal-fondo");
      if (!modal) return;
      modal.classList.add("activo");
      montarSwaggerUI();
    },
    cerrarModal() {
      const modal = $("swagger-modal-fondo");
      if (modal) modal.classList.remove("activo");
    },
    init() {
      const { h, mount, SwaggerCloseButton } = AQ.components;
      mount(
        $("swagger-close-root"),
        h(SwaggerCloseButton, { onClick: () => this.cerrarModal() })
      );
      const fondo = $("swagger-modal-fondo");
      if (fondo) {
        fondo.addEventListener("click", e => {
          if (e.target.id === "swagger-modal-fondo") this.cerrarModal();
        });
      }
      document.addEventListener("keydown", e => {
        if (e.key === "Escape" && fondo && fondo.classList.contains("activo")) {
          this.cerrarModal();
        }
      });
    }
  };
})();

