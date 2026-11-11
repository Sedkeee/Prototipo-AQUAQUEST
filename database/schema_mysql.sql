-- ============================================================
-- BASE DE DATOS RELACIONAL · AQUAQUEST COLOMBIA (Calidad del Agua)
-- Basado en el Diagrama Relacional oficial del proyecto y en el CSV
-- "Data_Histórica_de_Calidad_de_Agua_Superficial_y_Sedimentos_20260911.csv"
-- Compatible con MySQL 8.0+ / MariaDB 10.5+
-- ============================================================

CREATE DATABASE IF NOT EXISTS aquaquest_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_spanish_ci;

USE aquaquest_db;

-- 1. ZONAS_HIDROGRAFICAS
CREATE TABLE IF NOT EXISTS ZONAS_HIDROGRAFICAS (
  id_zona INT AUTO_INCREMENT PRIMARY KEY,
  codigo_szh VARCHAR(20) NOT NULL,
  zona VARCHAR(100) NOT NULL,
  subzona VARCHAR(100) NOT NULL,
  UNIQUE KEY uk_zona_szh (codigo_szh, zona, subzona)
) ENGINE=InnoDB;

-- 2. PUNTOS_MONITOREO
CREATE TABLE IF NOT EXISTS PUNTOS_MONITOREO (
  id_punto INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(30) NULL,
  nombre VARCHAR(150) NOT NULL,
  corriente VARCHAR(100) NULL,
  latitud FLOAT NOT NULL,
  longitud FLOAT NOT NULL,
  elevacion FLOAT NOT NULL,
  id_zona INT NOT NULL,
  departamento VARCHAR(80) NOT NULL,
  municipio VARCHAR(80) NOT NULL,
  CONSTRAINT fk_punto_zona
    FOREIGN KEY (id_zona) REFERENCES ZONAS_HIDROGRAFICAS(id_zona)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 3. VARIABLES
CREATE TABLE IF NOT EXISTS VARIABLES (
  id_variable INT AUTO_INCREMENT PRIMARY KEY,
  clave VARCHAR(30) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  categoria VARCHAR(80) NOT NULL,
  matriz VARCHAR(50) NOT NULL DEFAULT 'Agua superficial',
  unidad_base VARCHAR(30) NOT NULL
) ENGINE=InnoDB;

-- 4. MUESTRAS
CREATE TABLE IF NOT EXISTS MUESTRAS (
  id_muestra INT AUTO_INCREMENT PRIMARY KEY,
  codigo_muestra VARCHAR(30) NOT NULL,
  id_punto INT NOT NULL,
  fecha DATE NOT NULL,
  proyecto VARCHAR(100) NOT NULL,
  CONSTRAINT fk_muestra_punto
    FOREIGN KEY (id_punto) REFERENCES PUNTOS_MONITOREO(id_punto)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. MEDICIONES
CREATE TABLE IF NOT EXISTS MEDICIONES (
  id_medicion INT AUTO_INCREMENT PRIMARY KEY,
  id_muestra INT NOT NULL,
  id_variable INT NOT NULL,
  resultado FLOAT NULL,
   unidad VARCHAR(30) NOT NULL,
  limite_cuantificacion FLOAT NULL,
  es_bajo_lcm BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_medicion_muestra
    FOREIGN KEY (id_muestra) REFERENCES MUESTRAS(id_muestra)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_medicion_variable
    FOREIGN KEY (id_variable) REFERENCES VARIABLES(id_variable)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 6. USUARIOS
CREATE TABLE IF NOT EXISTS USUARIOS (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(120) NOT NULL UNIQUE,
  contrasena_hash VARCHAR(255) NOT NULL,
  rol ENUM('consultor', 'admin') NOT NULL DEFAULT 'consultor',
  xp_total INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- 7. RETOS
CREATE TABLE IF NOT EXISTS RETOS (
  id_reto INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(10) NOT NULL UNIQUE,
  titulo VARCHAR(120) NOT NULL,
  descripcion TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'Acción real (Tipo B)',
  xp_recompensa INT NOT NULL,
  id_variable INT NULL,
  CONSTRAINT fk_reto_variable
    FOREIGN KEY (id_variable) REFERENCES VARIABLES(id_variable)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- 8. ACCIONES_USUARIO
CREATE TABLE IF NOT EXISTS ACCIONES_USUARIO (
  id_accion INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  id_reto INT NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  evidencia TEXT NOT NULL,
  estado ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'aprobado',
  xp_otorgado INT NOT NULL,
  CONSTRAINT fk_accion_usuario
    FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_accion_reto
    FOREIGN KEY (id_reto) REFERENCES RETOS(id_reto)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 9. LOGROS
CREATE TABLE IF NOT EXISTS LOGROS (
  id_logro INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT NOT NULL,
  xp_requerido INT NOT NULL
) ENGINE=InnoDB;

-- 10. USUARIO_LOGROS
CREATE TABLE IF NOT EXISTS USUARIO_LOGROS (
  id_usuario INT NOT NULL,
  id_logro INT NOT NULL,
  fecha_obtencion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario, id_logro),
  CONSTRAINT fk_ulogro_usuario
    FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_ulogro_logro
    FOREIGN KEY (id_logro) REFERENCES LOGROS(id_logro)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- DATOS SEMILLA INICIALES (Variables IDEAM, Retos, Logros y Estaciones)
-- ============================================================

INSERT IGNORE INTO VARIABLES (id_variable, clave, nombre, categoria, matriz, unidad_base) VALUES
(1,  'ph',      'pH',                               'Fisicoquímico',    'Agua superficial', 'unidades de pH'),
(2,  'od',      'Oxígeno disuelto (OD)',            'Fisicoquímico',    'Agua superficial', 'mg O2/L'),
(3,  'temp',    'Temperatura',                      'Fisicoquímico',    'Agua superficial', '°C'),
(4,  'cond',    'Conductividad eléctrica',          'Fisicoquímico',    'Agua superficial', 'µS/cm'),
(5,  'turb',    'Turbidez',                         'Fisicoquímico',    'Agua superficial', 'NTU'),
(6,  'dqo',     'Demanda Química de Oxígeno (DQO)', 'Materia orgánica', 'Agua superficial', 'mg O2/L'),
(7,  'sst',     'Sólidos suspendidos totales',      'Fisicoquímico',    'Agua superficial', 'mg/L'),
(8,  'fe',      'Hierro total en agua',             'Metal',            'Agua superficial', 'mg Fe/L'),
(9,  'al',      'Aluminio total en agua',           'Metal',            'Agua superficial', 'mg Al/L'),
(10, 'mn',      'Manganeso total en agua',          'Metal',            'Agua superficial', 'mg Mn/L'),
(11, 'zn',      'Zinc total en agua',               'Metal',            'Agua superficial', 'mg Zn/L'),
(12, 'no3',     'Nitrato',                          'Nutriente',        'Agua superficial', 'mg N-NO3-/L'),
(13, 'p_total', 'Fósforo total',                    'Nutriente',        'Agua superficial', 'mg P/L');

INSERT IGNORE INTO RETOS (id_reto, codigo, titulo, descripcion, tipo, xp_recompensa, id_variable) VALUES
(1, 'r1', 'Cierra la llave mientras te cepillas',    'Durante tu próximo cepillado, cierra la llave mientras no la necesites.', 'Tipo B', 20, 1),
(2, 'r2', 'Reporta una fuga de agua',                'Encuentra una fuga en tu colegio, casa o barrio y repórtala.',            'Tipo B', 40, 4),
(3, 'r3', 'Recoge 5 residuos de una fuente hídrica', 'Ve a un río, quebrada o humedal cercano y recoge al menos 5 residuos.',   'Tipo B', 50, 7),
(4, 'r4', 'Aprende y explica qué es la DQO',         'Investiga qué significa la Demanda Química de Oxígeno y explícalo.',      'Tipo B', 30, 6),
(5, 'r5', 'Un día de ducha corta',                   'Reduce tu ducha a 5 minutos o menos durante un día completo.',            'Tipo B', 25, 3),
(6, 'r6', 'Comparte algo aprendido',                 'Cuéntale a alguien algo que hayas visto en la sección de datos reales.',  'Tipo B', 15, 2);

INSERT IGNORE INTO LOGROS (id_logro, nombre, descripcion, xp_requerido) VALUES
(1, 'Semilla',              'Iniciaste tu camino de cuidado del agua en AquaQuest.', 0),
(2, 'Brote',                'Alcanzaste tus primeros 100 XP con acciones reales.',   100),
(3, 'Guardián de quebrada', 'Proteges activamente tu entorno cercano (250 XP).',     250),
(4, 'Guardián de río',      'Referente de acción por el agua (500 XP).',             500),
(5, 'Guardián de cuenca',   'Compromiso sobresaliente por las cuencas (900 XP).',    900),
(6, 'Guardián del agua',    'Máximo nivel de reputación comunitaria (1500 XP).',     1500);

INSERT IGNORE INTO ZONAS_HIDROGRAFICAS (id_zona, codigo_szh, zona, subzona) VALUES
(1, '1102', 'Atrato - Darién', 'Alto Atrato'),
(2, '2102', 'Alto Magdalena',  'Río Timaná y otros Directos al Magdalena'),
(3, '2120', 'Alto Magdalena',  'Río Bogotá'),
(4, '2616', 'Cauca',           'Río Tapias y otros Directos al Cauca');

INSERT IGNORE INTO PUNTOS_MONITOREO (id_punto, codigo, nombre, corriente, latitud, longitud, elevacion, id_zona, departamento, municipio) VALUES
(1, '11027030', 'RCA_ATRATO_CHO_EL CARMEN_SIETE EL',         'ATRATO',    5.8620,   -76.152056, 2300, 1, 'CHOCO',        'EL CARMEN'),
(2, '21027010', 'RCA_MAGDALENA_HUI_ALTAMIRA_PERICONGO',      'MAGDALENA', 2.053167, -75.851889, 839,  2, 'HUILA',        'ALTAMIRA'),
(3, '21207960', 'RCA_BOGOTA_CUN_TOCAIMA_PTE.PORTILLO',       'BOGOTÁ',    4.454861, -74.608528, 361,  3, 'CUNDINAMARCA', 'TOCAIMA'),
(4, '26167070', 'RCA_CAUCA_CAL_NEIRA_IRRA',                  'CAUCA',     5.268306, -75.664194, 766,  4, 'CALDAS',       'NEIRA');

INSERT IGNORE INTO USUARIOS (id_usuario, nombre, correo, contrasena_hash, rol, xp_total) VALUES
(1, 'Camila Ríos', 'camila@aquaquest.co', 'a1b2c3d4e5f60123456789abcdef0123:9a0596fb64fb587fa0404523b8f64be36d6a985dc42ff70fa19f89c566d66642', 'consultor', 120),
(2, 'Admin IDEAM', 'admin@aquaquest.co',  'f6e5d4c3b2a10123456789abcdef9876:173e69ba7bd672625971f42c445d4454213cc1f1545735c14f3d6731f3b4d0da', 'admin',     500);


