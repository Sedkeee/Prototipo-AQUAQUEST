# Prototipo-AQUAQUEST
prototipo inicial de futura pagina web 

## Cómo ejecutar

### Opción 1: Directo en el navegador (sin instalar nada)
Abre `index.html` con doble clic. Ya incluye 25 estaciones representativas extraídas del archivo oficial `Data_Histórica_de_Calidad_de_Agua_Superficial_y_Sedimentos_20260911.csv` (143.818 registros, 243 estaciones y 101 subzonas hidrográficas).
- Puedes cambiar de estación desde el **selector de Estación de monitoreo (`PUNTOS_MONITOREO`)**.
- También puedes pulsar el botón React **📂 Cargar CSV / Excel** para cargar el archivo `.csv` completo desde tu computador y explorar las 243 estaciones en vivo.

### Opción 2: Servidor Backend Node.js + Base de Datos Relacional
1. Para levantar el servidor backend y API REST:
   ```bash
   node server.js
   ```
   Y abre `http://localhost:3000`.
2. Para re-importar datos desde un archivo CSV del IDEAM:
   ```bash
   node database/import_csv.js "ruta/al/archivo.csv"
   ```
3. Para crear la base de datos en **MySQL / MariaDB** con las 10 tablas del Diagrama Relacional (`ZONAS_HIDROGRAFICAS`, `PUNTOS_MONITOREO`, `VARIABLES`, `MUESTRAS`, `MEDICIONES`, `USUARIOS`, `RETOS`, `ACCIONES_USUARIO`, `LOGROS`, `USUARIO_LOGROS`), ejecuta el script:
   - `database/schema_mysql.sql`

## Arquitectura MVC + React + Base de Datos + Swagger

```
index.html                  → plantilla HTML (login + app + Swagger modal + React 18 CDN)
server.js                   → servidor backend Node.js + API REST (/api/db/status, /api/datos/*)
openapi.json                → especificación OpenAPI 3.0 exportable (Swagger / Postman)
database/
  schema_mysql.sql          → script DDL MySQL con las 10 tablas del Diagrama Relacional
  import_csv.js             → importador Node.js del CSV del IDEAM a la BD relacional
  ideam_db.json             → base de datos relacional generada desde el CSV del IDEAM
css/
  styles.css                → estilos de la aplicación, conector BD y modal de Swagger
  auth.css                  → estilos del login / registro
js/
  utils/helpers.js          → namespace global AQ + utilidades
  components/
    ReactButtons.js         → todos los botones de la aplicación en React 18
  models/
    StorageService.js       → acceso a localStorage
    AuthModel.js            → usuarios, contraseñas (SHA-256 + sal), sesión
    IdeamCsvData.js         → estaciones e historial extraídos del CSV del IDEAM
    DatosModel.js           → conector de BD IDEAM, parser CSV en vivo y series
    JuegoModel.js           → retos, XP, niveles, bitácora (por usuario)
    ComunidadModel.js       → posts, likes, comentarios
  views/
    UIView.js, AuthView.js, DatosView.js, JuegoView.js, ComunidadView.js
  controllers/
    AuthController.js, DatosController.js, JuegoController.js,
    ComunidadController.js, SwaggerController.js, AppController.js
```
