/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `configuracion` (
  `clave` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`clave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `configuracion` WRITE;
/*!40000 ALTER TABLE `configuracion` DISABLE KEYS */;
INSERT IGNORE INTO `configuracion` VALUES ('direccion',''),('email',''),('logo_datos',''),('logo_mime',''),('logo_version','0'),('nombre_negocio','Koko'),('telefono',''),('tema_preset','lavanda'),('tema_primario','#7e47eb'),('tema_secundario','#f59e0b');
/*!40000 ALTER TABLE `configuracion` ENABLE KEYS */;
UNLOCK TABLES;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `locales` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `direccion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `horario` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imagen` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  `username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `locales` WRITE;
/*!40000 ALTER TABLE `locales` DISABLE KEYS */;
/*!40000 ALTER TABLE `locales` ENABLE KEYS */;
UNLOCK TABLES;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT IGNORE INTO `migrations` VALUES (1,'2025_01_01_000001_crear_tablas_base',1),(2,'2025_01_01_000002_crear_tablas_catalogo',1),(3,'2025_01_01_000003_crear_tablas_ventas',1),(4,'2025_01_01_000004_agregar_indices',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `productos` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `local_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `stock_minimo` int NOT NULL DEFAULT '0',
  `precio` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `idx_productos_local` (`local_id`,`nombre`),
  CONSTRAINT `productos_local_id_foreign` FOREIGN KEY (`local_id`) REFERENCES `locales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `rol_permisos` (
  `rol_id` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `permiso` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`rol_id`,`permiso`),
  CONSTRAINT `rol_permisos_rol_id_foreign` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `rol_permisos` WRITE;
/*!40000 ALTER TABLE `rol_permisos` DISABLE KEYS */;
INSERT IGNORE INTO `rol_permisos` VALUES ('admin','configuracion.administrar'),('admin','configuracion.ver'),('admin','inventario.administrar'),('admin','locales.administrar'),('admin','locales.ver'),('admin','reportes.global'),('admin','reportes.local'),('admin','servicios.administrar'),('admin','servicios.ver'),('admin','trabajadores.administrar'),('admin','trabajadores.transferir'),('admin','trabajadores.ver'),('admin','usuarios.administrar'),('admin','ventas.anular'),('admin','ventas.registrar'),('admin','ventas.ver_local'),('encargado','configuracion.ver'),('encargado','inventario.administrar'),('encargado','locales.ver'),('encargado','reportes.local'),('encargado','servicios.ver'),('encargado','trabajadores.ver'),('encargado','ventas.anular'),('encargado','ventas.registrar'),('encargado','ventas.ver_local');
/*!40000 ALTER TABLE `rol_permisos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `roles` (
  `id` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `alcance` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'local',
  `es_sistema` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT IGNORE INTO `roles` VALUES ('admin','Dueño','Acceso total: cobra, define servicios y porcentajes, y ve todos los reportes.','global',1),('encargado','Encargada','Cobra y registra los servicios de su local y ve cómo le va.','local',1);
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `servicios` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `precio` decimal(10,2) NOT NULL DEFAULT '0.00',
  `porcentaje_trabajador` decimal(5,2) NOT NULL DEFAULT '50.00',
  `local_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_servicios_local` (`local_id`,`nombre`),
  CONSTRAINT `servicios_local_id_foreign` FOREIGN KEY (`local_id`) REFERENCES `locales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `servicios` WRITE;
/*!40000 ALTER TABLE `servicios` DISABLE KEYS */;
/*!40000 ALTER TABLE `servicios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `trabajador_locales` (
  `trabajador_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `local_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activo',
  `desde` datetime NOT NULL,
  `actualizado` datetime NOT NULL,
  PRIMARY KEY (`trabajador_id`,`local_id`),
  KEY `idx_tl_local_estado` (`local_id`,`estado`),
  CONSTRAINT `trabajador_locales_local_id_foreign` FOREIGN KEY (`local_id`) REFERENCES `locales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `trabajador_locales_trabajador_id_foreign` FOREIGN KEY (`trabajador_id`) REFERENCES `trabajadores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `trabajador_locales` WRITE;
/*!40000 ALTER TABLE `trabajador_locales` DISABLE KEYS */;
/*!40000 ALTER TABLE `trabajador_locales` ENABLE KEYS */;
UNLOCK TABLES;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `trabajador_movimientos` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trabajador_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `local_origen` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `local_destino` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` datetime NOT NULL,
  `motivo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `usuario` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `idx_mov_trabajador_fecha` (`trabajador_id`,`fecha`),
  CONSTRAINT `trabajador_movimientos_trabajador_id_foreign` FOREIGN KEY (`trabajador_id`) REFERENCES `trabajadores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `trabajador_movimientos` WRITE;
/*!40000 ALTER TABLE `trabajador_movimientos` DISABLE KEYS */;
/*!40000 ALTER TABLE `trabajador_movimientos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `trabajadores` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `telefono` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_ingreso` date DEFAULT NULL,
  `local_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_trabajadores_local` (`local_id`),
  CONSTRAINT `trabajadores_local_id_foreign` FOREIGN KEY (`local_id`) REFERENCES `locales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `trabajadores` WRITE;
/*!40000 ALTER TABLE `trabajadores` DISABLE KEYS */;
/*!40000 ALTER TABLE `trabajadores` ENABLE KEYS */;
UNLOCK TABLES;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `users` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `local_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trabajador_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pref_fuente` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'predeterminada',
  `pref_tamano` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal',
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_unique` (`username`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_local` (`local_id`),
  CONSTRAINT `users_local_id_foreign` FOREIGN KEY (`local_id`) REFERENCES `locales` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `usuario_locales` (
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `local_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`user_id`,`local_id`),
  KEY `usuario_locales_local_id_foreign` (`local_id`),
  CONSTRAINT `usuario_locales_local_id_foreign` FOREIGN KEY (`local_id`) REFERENCES `locales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `usuario_locales_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `usuario_locales` WRITE;
/*!40000 ALTER TABLE `usuario_locales` DISABLE KEYS */;
/*!40000 ALTER TABLE `usuario_locales` ENABLE KEYS */;
UNLOCK TABLES;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `venta_items` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `venta_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `servicio_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `servicio_nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trabajador_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trabajador_nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `porcentaje_trabajador` decimal(5,2) NOT NULL,
  `monto_trabajador` decimal(10,2) NOT NULL,
  `monto_local` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_items_venta` (`venta_id`),
  KEY `idx_items_trabajador` (`trabajador_id`,`venta_id`),
  KEY `idx_items_servicio` (`servicio_id`),
  CONSTRAINT `venta_items_servicio_id_foreign` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `venta_items_trabajador_id_foreign` FOREIGN KEY (`trabajador_id`) REFERENCES `trabajadores` (`id`) ON DELETE SET NULL,
  CONSTRAINT `venta_items_venta_id_foreign` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `venta_items` WRITE;
/*!40000 ALTER TABLE `venta_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `venta_items` ENABLE KEYS */;
UNLOCK TABLES;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `ventas` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `local_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_hora` datetime NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `metodo_pago` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'efectivo',
  `estado` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activa',
  `registrado_por` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `creado` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ventas_local_fecha` (`local_id`,`fecha_hora`),
  KEY `idx_ventas_fecha` (`fecha_hora`),
  KEY `idx_ventas_estado_fecha` (`estado`,`fecha_hora`),
  CONSTRAINT `ventas_local_id_foreign` FOREIGN KEY (`local_id`) REFERENCES `locales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `ventas` WRITE;
/*!40000 ALTER TABLE `ventas` DISABLE KEYS */;
/*!40000 ALTER TABLE `ventas` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

