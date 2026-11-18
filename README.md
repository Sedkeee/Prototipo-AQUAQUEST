# 🌊 AquaQuest Colombia

> **Plataforma web interactiva para la democratización y visualización de datos abiertos sobre la calidad del recurso hídrico en Colombia (IDEAM), gamificación ciudadana y comunidad ambiental.**

Desarrollado por estudiantes de la **Universidad Libre de Pereira**.

---

## 📑 Tabla de Contenidos

1. [Descripción del Proyecto](#1-descripción-del-proyecto)
2. [Metodología de Desarrollo](#2-metodología-de-desarrollo)
3. [Arquitectura y Estructura del Software](#3-arquitectura-y-estructura-del-software)
4. [Requisitos Previos](#4-requisitos-previos)
5. [Instalación Paso a Paso](#5-instalación-paso-a-paso)
6. [Base de Datos y Modelado Relacional](#6-base-de-datos-y-modelado-relacional)
7. [Cómo Ejecutar el Proyecto](#7-cómo-ejecutar-el-proyecto)
8. [Tecnologías y Librerías Utilizadas](#8-tecnologías-y-librerías-utilizadas)
9. [Especificación API REST y Documentación OpenAPI (Swagger)](#9-especificación-api-rest-y-documentación-openapi-swagger)
10. [Equipo de Desarrollo y Contribución](#10-equipo-de-desarrollo-y-contribución)

---

## 1. Descripción del Proyecto

**AquaQuest Colombia** es una solución web integral diseñada para transformar datos técnicos y densos sobre la calidad del agua superficial en una experiencia comprensible, visual y accesible para cualquier ciudadano, investigador o estudiante en Colombia.

La plataforma se conecta a los registros históricos oficiales del **IDEAM** (*Instituto de Hidrología, Meteorología y Estudios Ambientales*), permitiendo:
- **Exploración geográfica y analítica:** Consulta interactiva de estaciones de monitoreo hidrológico en un mapa interactivo georreferenciado con tema oscuro.
- **Visualización dinámica de series de tiempo:** Gráficos multiformato (Líneas, Barras, Dona/Pastel y Área) para 13 variables fisicoquímicas y de nutrientes clave (pH, Oxígeno Disuelto, Temperatura, Conductividad, Turbidez, DQO, Metales, etc.).
- **Gamificación ambiental:** Retos de acción ecológica en la vida real que otorgan puntos de experiencia (XP), niveles y medallas para fomentar el ahorro y cuidado del agua.
- **Comunidad participativa:** Espacio para compartir evidencias, fotos y logros con otros miembros comprometidos.
- **Módulo educativo (Guía del agua):** Guía interactiva paso a paso con recomendaciones prácticas para el hogar y la comunidad.
- **Sistema de roles y seguridad:** Control de acceso basado en perfiles (`admin` y `consultor`), donde los códigos internos y conectores avanzados quedan restringidos a usuarios administrativos.

---

## 2. Metodología de Desarrollo

El proyecto fue concebido y desarrollado bajo el marco ágil **Scrum**, con un enfoque iterativo e incremental organizado en fases temáticas:

1. **Planificación y Análisis:**
   - Levantamiento de requisitos a partir del conjunto de datos del IDEAM (*Data Histórica de Calidad de Agua Superficial y Sedimentos* con más de 140.000 filas).
   - Definición de historias de usuario, épicas y diagramas de arquitectura C4 (Contexto, Contenedores y Componentes).
2. **Diseño de Interfaz (UI/UX) y Responsive First:**
   - Paleta de colores dark mode orientada al agua (`#0a1929`, `#122b40`, `#00b4d8`, `#52b788`).
   - Adaptabilidad rigurosa comprobada en resoluciones de **360px** (móviles compactos), **768px** (tablets) y **1024px+** (escritorio), integrando navegación con menú hamburguesa colapsable y drawer lateral accesible.
3. **Desarrollo por Fases Modulares:**
   - **Fase 1 (Responsive Global):** Menú hamburguesa accesible (WAI-ARIA, tecla Escape, backdrop blur), footer institucional y optimización de assets.
   - **Fase 2 (Motor de Gráficos):** Integración de Chart.js v4 vía CDN con selector de 4 tipos de gráfico y persistencia de sesión, conservando el fallback matemático a SVG nativo.
   - **Fase 3 (Geolocalización):** Mapa interactivo Leaflet + OpenStreetMap (tiles oscuros CartoDB Dark Matter), pines personalizados y popups informativos respetando la privacidad de códigos internos.
   - **Fase 4 (Metadatos del Estudio):** Cards visuales con iconos SVG para el Nombre del estudio, Objetivo técnico, Variable seleccionada en tiempo real y Sector hídrico.
   - **Fase 5 (Identidad Visual y Animación):** Animación CSS fluida del logo oficial con efectos de flotación y destello, compatible con `prefers-reduced-motion`.
   - **Fase 6 (Quiénes Somos & Contacto):** Sección del equipo y formulario de contacto integrado con EmailJS, validación en tiempo real y trampa anti-spam (honeypot).
   - **Fase 7 (Documentación Completa):** Manual de arquitectura, despliegue y mantenimiento.

---

## 3. Arquitectura y Estructura del Software

El sistema sigue el patrón arquitectónico **Modelo-Vista-Controlador (MVC)** desacoplado en el cliente, estructurado bajo el namespace global seguro `window.AQ`, complementado con un backend ligero en Node.js puro (cero dependencias de npm para máxima portabilidad):

### Diagrama de Carpetas

```
Prototipo-AQUAQUEST/
│
├── .env.example                 # Plantilla de variables de entorno y credenciales
├── index.html                   # Punto de entrada SPA (Single Page Application)
├── server.js                    # Servidor HTTP nativo en Node.js + API REST
├── openapi.json                 # Especificación OpenAPI 3.0 para Swagger UI
├── README.md                    # Documentación y manual del proyecto
│
├── assets/                      # Recursos multimedia e identidad visual
│   └── logo.webp                # Logo oficial de AquaQuest (gota + hoja)
│
├── css/                         # Hojas de estilo estructuradas
│   ├── auth.css                 # Estilos específicos para la pantalla de Login y Registro
│   └── styles.css               # Estilos globales, sidebar, responsive, mapa y cards
│
├── database/                    # Datos y persistencia
│   ├── ideam_db.json            # Base de datos relacional pre-procesada del IDEAM (JSON)
│   ├── usuarios_db.json         # Base de datos local de usuarios y perfiles
│   ├── import_csv.js            # Script Node.js de importación ETL para nuevos CSVs
│   └── schema_mysql.sql         # Script DDL SQL para despliegue opcional en MySQL / MariaDB
│
└── js/                          # Lógica de la aplicación en JavaScript Modular
    ├── utils/
    │   └── helpers.js           # Utilidades compartidas (DOM $, formato numérico, escapeHtml)
    ├── components/
    │   └── ReactButtons.js      # Componentes React 18 montados en el DOM (chips, botones)
    ├── models/
    │   ├── StorageService.js    # Capa de abstracción para persistencia en localStorage
    │   ├── AuthModel.js         # Autenticación, hashing seguro SHA-256 + salt y roles
    │   ├── IdeamCsvData.js      # Respaldo embebido de estaciones del IDEAM
    │   ├── DatosModel.js        # Modelo de estaciones, muestras, series y metadatos del estudio
    │   ├── JuegoModel.js        # Lógica de gamificación, retos, XP, niveles y medallas
    │   └── ComunidadModel.js    # Publicaciones, comentarios e interacciones sociales
    ├── views/
    │   ├── UIView.js            # Interfaz global, navegación, toasts y drawer responsive
    │   ├── AuthView.js          # Renderizado de formularios de acceso y registro
    │   ├── DatosView.js         # Vista de datos: tabla, gráficas (Chart.js/SVG) y mapa Leaflet
    │   ├── JuegoView.js         # Vista de retos ambientales y bitácora de acciones
    │   ├── ComunidadView.js     # Muro comunitario y feed de acciones
    │   └── GuiaView.js          # Guía interactiva de cuidados del agua
    └── controllers/
        ├── AppController.js     # Orquestador general del ciclo de vida y guards de sesión
        ├── AuthController.js    # Controlador de inicio de sesión y registro
        ├── DatosController.js   # Controlador de selección de estación, variables y tipo de gráfica
        ├── ContactoController.js# Controlador del formulario de contacto (EmailJS + Honeypot)
        ├── JuegoController.js   # Controlador de gamificación y registro de retos
        ├── ComunidadController.js# Controlador de interacción social
        ├── GuiaController.js    # Controlador de la guía de cuidados del agua
        └── SwaggerController.js # Controlador del visor interactivo Swagger OpenAPI
```

---

## 4. Requisitos Previos

- **Navegador Web Moderno:** Google Chrome, Mozilla Firefox, Microsoft Edge, Safari u Opera con soporte para ES6+.
- **Node.js (Opcional, pero recomendado):** Versión 16.x, 18.x, 20.x o superior si se desea ejecutar el servidor local y la API REST.
- **Conexión a Internet (opcional para librerías CDN):**
  - Si no hay conexión a internet, la plataforma degrada elegantemente: las gráficas utilizan el motor nativo SVG interno y el mapa oculta su contenedor sin arrojar errores ni bloquear la navegación.

---

## 5. Instalación Paso a Paso

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/Prototipo-AQUAQUEST.git
cd Prototipo-AQUAQUEST
```

### 2. Configuración de Variables de Entorno (Opcional para EmailJS)
Copia el archivo de plantilla a tu configuración local si deseas habilitar el envío real de correos de contacto:
```bash
cp .env.example .env
```
Edita `.env` o configura tus claves en `js/controllers/ContactoController.js`:
- `EMAILJS_SERVICE_ID`: ID del servicio de correo en EmailJS.
- `EMAILJS_TEMPLATE_ID`: ID de la plantilla en EmailJS.
- `EMAILJS_PUBLIC_KEY`: Llave pública de tu cuenta en EmailJS.

*(Nota: Si no configuras las claves, el formulario funciona en modo demostración validando todos los campos y notificando al usuario).*

---

## 6. Base de Datos y Modelado Relacional

El modelo de datos se diseñó a partir de la estructura relacional del archivo de monitoreo oficial del IDEAM:

### Diagrama Entidad-Relación (10 Tablas)
1. `ZONAS_HIDROGRAFICAS`: Identificadores de área y subzonas hidrográficas (`codigo_szh`).
2. `PUNTOS_MONITOREO`: Estaciones de monitoreo con latitud, longitud, elevación, cuenca, departamento y municipio.
3. `VARIABLES`: Diccionario de parámetros de calidad del agua (pH, OD, DQO, etc.) con sus unidades y categorías.
4. `MUESTRAS`: Registros de toma de muestra asociados a una fecha, estación y proyecto.
5. `MEDICIONES`: Valor cuantitativo registrado para cada variable en cada muestra.
6. `USUARIOS`: Cuentas registradas con contraseñas encriptadas con sal SHA-256 y roles (`admin`, `consultor`).
7. `RETOS`: Retos ecológicos disponibles con puntos de experiencia asociados.
8. `ACCIONES_USUARIO`: Historial de retos completados por los usuarios con evidencias.
9. `LOGROS`: Medallas y condecoraciones del sistema.
10. `USUARIO_LOGROS`: Relación muchos a muchos entre usuarios y medallas desbloqueadas.

Para desplegar esta estructura en motores **MySQL** o **MariaDB**, ejecuta el script provisto en:
```bash
database/schema_mysql.sql
```

---

## 7. Cómo Ejecutar el Proyecto

### Opción 1: Ejecución Directa en el Navegador (Sin dependencias)
1. Navega hasta la carpeta del proyecto.
2. Haz **doble clic** sobre el archivo `index.html` (o haz clic derecho y selecciona *Abrir con Google Chrome / tu navegador preferido*).
3. ¡Listo! La aplicación cargará automáticamente con las 25 estaciones representativas precargadas en memoria.

### Opción 2: Servidor Backend Node.js (Recomendado)
El proyecto incluye un servidor HTTP nativo escrito en Node.js sin frameworks externos (`express` no es requerido):

```bash
node server.js
```

El servidor imprimirá en consola:
```
Servidor AquaQuest escuchando en http://localhost:3000
Base de datos: database/ideam_db.json conectada
```
Abre en tu navegador: **`http://localhost:3000`**

### Re-importar Datos desde un nuevo CSV del IDEAM
Si dispones de un archivo CSV actualizado del IDEAM, puedes procesarlo con el script ETL:
```bash
node database/import_csv.js "ruta/a/tu/archivo_ideam.csv"
```

---

## 8. Tecnologías y Librerías Utilizadas

| Categoría | Tecnología / Librería | Propósito en AquaQuest |
|-----------|----------------------|------------------------|
| **Lenguaje Core** | HTML5 Semántico, CSS3 Vanilla, JavaScript (ES6+) | Estructura, diseño responsive y lógica de negocio sin transpiladores |
| **Componentes UI** | React 18 (vía CDN sin JSX) | Renderizado dinámico de chips de variables y botones interactivos |
| **Gráficos** | Chart.js v4 (vía CDN) | Gráficas interactivas de Línea, Barras, Dona y Área (limitadas a los 10 primeros registros) |
| **Fallback Gráfico** | SVG nativo renderizado dinámicamente | Respaldo gráfico 100% offline si falla el CDN de Chart.js |
| **Cartografía** | Leaflet 1.9.4 + OpenStreetMap / CartoDB | Mapa interactivo georreferenciado de estaciones con tema oscuro |
| **Animación Logo** | CSS3 Keyframes (`flotar` + `brillo`) | Animación suave y destello en login con respeto a `prefers-reduced-motion` |
| **Formulario Contacto** | EmailJS Browser SDK (vía CDN) | Envío de correos directo desde el cliente con trampa anti-spam Honeypot |
| **Documentación API** | Swagger UI Dist 5.17 + OpenAPI 3.0 | Modal interactivo para consultar y probar los endpoints de la API |
| **Backend** | Node.js Nativo (`http`, `fs`, `path`, `crypto`) | Servidor de archivos estáticos y API REST relacional |
| **Tipografía** | Google Fonts (*Outfit*) | Tipografía moderna, geométrica y de alta legibilidad |

---

## 9. Especificación API REST y Documentación OpenAPI (Swagger)

AquaQuest implementa una API REST completa documentada bajo el estándar **OpenAPI 3.0**, accesible directamente desde la interfaz pulsando el botón **"API Docs"** en la barra superior.

### Endpoints Principales:

- `GET /api/db/status` — Retorna el estado de la conexión a la base de datos, total de registros, estaciones y subzonas.
- `GET /api/datos/estaciones` — Lista todas las estaciones de monitoreo disponibles con coordenadas geográficas.
- `GET /api/datos/estacion?id=:codigo` — Retorna el detalle completo de una estación y sus muestras asociadas.
- `GET /api/datos/serie?variable=:varId&estacion=:codigo` — Retorna la serie histórica depurada para graficación (limitada a los 10 primeros registros).
- `GET /openapi.json` — Descarga la especificación formal OpenAPI 3.0 utilizable en herramientas como Postman o Insomnia.

---

## 10. Equipo de Desarrollo y Contribución

### Integrantes — Universidad Libre de Pereira:

- **Rafael Hernandez Gomez** — *Frontend Developer*
- **Francisco Manuel Bermudez** — *Backend Developer*
- **Juan Jose Herrera Largo** — *UI/UX Designer*

---

### Lineamientos para Contribuir

1. Realiza un Fork del repositorio.
2. Crea una rama para tu funcionalidad (`git checkout -b feature/nueva-mejora`).
3. Realiza tus cambios asegurando la compatibilidad responsive en 360px, 768px y 1024px.
4. Confirma tus commits con mensajes semánticos (`git commit -m 'feat: nueva funcionalidad'`).
5. Empuja la rama (`git push origin feature/nueva-mejora`).
6. Abre un **Pull Request** detallando los cambios introducidos.

---

© 2026 **AquaQuest Colombia** — Proyecto de Innovación y Cuidado del Agua. Universidad Libre de Pereira.
