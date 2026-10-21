# Prototipo-AQUAQUEST
prototipo inicial de futura pagina web 

## Cómo ejecutar
Abre `index.html` en el navegador (doble clic). No requiere instalar nada.
La primera vez crea una cuenta en la pestaña **Crear cuenta**.

## Arquitectura MVC

```
index.html              → plantilla HTML (login + app)
css/
  styles.css            → estilos de la aplicación
  auth.css              → estilos del login / registro
js/
  utils/helpers.js      → namespace global AQ + utilidades
  models/               → DATOS y reglas de negocio (no tocan el DOM)
    StorageService.js   → acceso a localStorage
    AuthModel.js        → usuarios, contraseñas (SHA-256 + sal), sesión
    DatosModel.js       → datos IDEAM (solo lectura)
    JuegoModel.js       → retos, XP, niveles, bitácora (por usuario)
    ComunidadModel.js   → posts, likes, comentarios
  views/                → solo pintan el DOM y capturan eventos
    UIView.js, AuthView.js, DatosView.js, JuegoView.js, ComunidadView.js
  controllers/          → conectan vistas con modelos
    AuthController.js, DatosController.js, JuegoController.js,
    ComunidadController.js, AppController.js (arranque + sesión)
```

Orden de carga de scripts: `utils → models → views → controllers`.

> **Nota:** El login es una simulación en el navegador (localStorage). Para producción
> se necesita un backend con base de datos (ver `diagrama de aquaquest.jpeg`).
