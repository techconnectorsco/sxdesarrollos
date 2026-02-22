# Documentación de Rutas - SITO.cr

## Descripción General del Sitio

**SITO.cr** es una plataforma digital inmobiliaria para Costa Rica que conecta compradores, vendedores e inversionistas con propiedades en el mercado costarricense. El sitio ofrece:

- **Búsqueda de propiedades**: Ventas, alquileres y proyectos inmobiliarios
- **Remates judiciales**: Acceso a información de propiedades en remate
- **Mapas interactivos**: Visualización geográfica de propiedades con Mapbox
- **Publicación de propiedades**: Sistema para que usuarios publiquen sus propiedades
- **Administración**: Panel de administración para gestión de contenido y usuarios
- **Chatbot con IA**: Asistente inteligente (TEO) para ayudar a los usuarios

La plataforma está construida con **SvelteKit**, **TypeScript**, **Supabase** como backend, **Mapbox** para mapas, y **OpenAI** para el sistema de chat con IA.

---

## Rutas Públicas Principales

### `/` - Página de Inicio
**Descripción**: Página principal del sitio que muestra:
- Propiedades destacadas en venta
- Propiedades destacadas en alquiler
- Remates judiciales más recientes
- Publicidad destacada
- Secciones de navegación principal

**Funcionalidad**: Presenta un resumen del contenido principal del sitio para orientar a los visitantes.

---

### `/acerca` - Acerca de Nosotros
**Descripción**: Página informativa sobre SITO.cr que incluye:
- Misión y visión de la empresa
- Valores corporativos (Transparencia, Innovación, Excelencia, Integridad)
- Estadísticas del sitio
- Información sobre socios y partners
- Historia de la empresa

**Funcionalidad**: Proporciona contexto institucional para generar confianza en los usuarios.

---

### `/contacto` - Contacto
**Descripción**: Página de contacto con:
- Formulario de contacto
- Información de contacto (teléfono, email, dirección)
- Métodos de comunicación disponibles
- Horarios de atención

**Funcionalidad**: Permite a los usuarios contactar directamente con SITO.cr.

---

### `/propiedades` - Listado de Propiedades (General)
**Descripción**: Página principal de búsqueda que muestra todas las propiedades (ventas y alquileres combinados):
- Listado paginado de propiedades
- Filtros avanzados (ubicación, precio, tipo, características)
- Búsqueda por texto (título, descripción, dirección)
- Vista de mapa opcional
- Ordenamiento (más recientes, precio, relevancia)

**Funcionalidad**: Permite a los usuarios explorar y filtrar todas las propiedades disponibles en la plataforma.

---

### `/propiedades-venta` - Propiedades en Venta
**Descripción**: Listado específico de propiedades disponibles para compra:
- Solo propiedades con tipo_transaccion = 'venta'
- Filtros especializados para compradores
- Búsqueda por matrícula/finca_id
- Vista de mapa integrada
- Información de precio en USD o CRC

**Funcionalidad**: Enfocado en usuarios que buscan comprar propiedades.

---

### `/propiedades/[id]` - Detalle de Propiedad (General)
**Descripción**: Página de detalle de una propiedad específica:
- Información completa de la propiedad
- Galería de imágenes
- Características detalladas (dormitorios, baños, área, etc.)
- Ubicación en mapa
- Información de contacto del vendedor
- Propiedades relacionadas

**Funcionalidad**: Muestra todos los detalles de una propiedad para que los usuarios tomen decisiones informadas.

---

### `/propiedades-venta/[id]` - Detalle de Propiedad en Venta
**Descripción**: Página de detalle específica para propiedades en venta:
- Información completa de la propiedad
- Precio y condiciones de venta
- Detalles financieros
- Proceso de compra
- Contacto con el vendedor

**Funcionalidad**: Información detallada para potenciales compradores.

---

### `/alquileres` - Propiedades en Alquiler
**Descripción**: Listado de propiedades disponibles para alquiler:
- Solo propiedades con tipo_transaccion = 'alquiler'
- Filtros para inquilinos (precio mensual, ubicación, características)
- Información de disponibilidad
- Vista de mapa
- Precios en USD o CRC

**Funcionalidad**: Enfocado en usuarios que buscan propiedades para alquilar.

---

### `/alquileres/[id]` - Detalle de Propiedad en Alquiler
**Descripción**: Página de detalle específica para propiedades en alquiler:
- Información completa del alquiler
- Precio mensual y condiciones
- Requisitos para alquilar
- Información de disponibilidad
- Contacto con el arrendador

**Funcionalidad**: Información detallada para potenciales inquilinos.

---

### `/remates` - Remates Judiciales
**Descripción**: Listado de propiedades en remate judicial:
- Propiedades disponibles en subastas judiciales
- Información de fechas de subasta (primera, segunda, tercera)
- Precios base de remate
- Información del caso judicial
- Filtros por ubicación, fecha, precio
- Vista de mapa

**Funcionalidad**: Permite a inversionistas y compradores explorar oportunidades en remates judiciales.

---

### `/remates/[id]` - Detalle de Remate Judicial
**Descripción**: Página de detalle de un remate específico:
- Información completa del remate
- Fechas y horarios de subastas
- Precio base y moneda
- Información del caso judicial (número de caso, juzgado, juez)
- Información de partes (demandante, demandado)
- Características de la propiedad
- Procedimientos y requisitos para participar

**Funcionalidad**: Información detallada para quienes están interesados en participar en remates judiciales.

---

### `/map` - Mapa Interactivo (Principal)
**Descripción**: Vista de mapa interactivo avanzado con Mapbox:
- Visualización de propiedades en mapa
- Múltiples tilesets de distritos costarricenses
- Búsqueda por ubicación
- Filtros de propiedades
- Vista de lista complementaria
- Información detallada al hacer clic en propiedades

**Funcionalidad**: Permite exploración visual y geográfica de propiedades en Costa Rica.

---

### `/mapa` - Mapa Alternativo
**Descripción**: Versión alternativa del mapa interactivo.

---

### `/mapo` - Mapa Alternativo 2
**Descripción**: Otra variante del mapa interactivo.

---

### `/parcelas/[id]` - Detalle de Parcela
**Descripción**: Página de detalle específica para parcelas/terrenos:
- Información de la parcela
- Límites y área
- Ubicación geográfica
- Información de zonificación

**Funcionalidad**: Información específica para terrenos y parcelas.

---

### `/proyectos` - Proyectos Inmobiliarios
**Descripción**: Sección de proyectos inmobiliarios (actualmente en desarrollo):
- Listado de proyectos nuevos
- Información de pre-ventas
- Proyectos en construcción

**Estado**: Sección en desarrollo, muestra mensaje informativo.

---

### `/terminos-y-condiciones` - Términos y Condiciones
**Descripción**: Página legal con:
- Términos de uso de la plataforma
- Políticas de privacidad
- Condiciones legales
- Información sobre derechos y responsabilidades

**Funcionalidad**: Información legal requerida para el uso del sitio.

---

## Rutas de Usuario Autenticado

### `/dashboard` - Dashboard de Usuario
**Descripción**: Panel principal del usuario autenticado:
- Resumen de actividad
- Propiedades publicadas
- Mensajes y consultas
- Estadísticas personales
- Accesos rápidos

**Requisitos**: Usuario autenticado

**Funcionalidad**: Centro de control para usuarios registrados.

---

### `/Profile` - Perfil de Usuario
**Descripción**: Página de perfil del usuario:
- Información personal
- Configuración de cuenta
- Propiedades publicadas
- Historial de actividad
- Preferencias

**Requisitos**: Usuario autenticado

**Funcionalidad**: Gestión del perfil de usuario.

---

### `/publicar_propiedad` - Publicar Propiedad
**Descripción**: Formulario paso a paso para publicar una propiedad:
- Paso 1: Información básica (tipo de transacción, tipo de propiedad, precio)
- Paso 2: Ubicación (selección en mapa o manual, finca_id)
- Paso 3: Detalles (dormitorios, baños, área, características)
- Paso 4: Amenidades y multimedia (imágenes, documentos)
- Integración con mapa para selección de ubicación
- Guardado de geometría para propiedades

**Requisitos**: Usuario autenticado

**Funcionalidad**: Permite a usuarios publicar sus propiedades en la plataforma.

---

### `/publicar_propiedad/confirmacion` - Confirmación de Publicación
**Descripción**: Página de confirmación después de publicar una propiedad:
- Mensaje de éxito
- ID de la propiedad publicada
- Opciones para editar o ver la propiedad
- Próximos pasos

**Requisitos**: Usuario autenticado, redirección después de publicar

**Funcionalidad**: Confirma que la propiedad fue publicada exitosamente.

---

## Rutas de Autenticación

### `/auth` - Autenticación Principal
**Descripción**: Página de autenticación que maneja login y registro:
- Modo login: Iniciar sesión
- Modo registro: Crear nueva cuenta
- Autenticación con email/password
- Opción de autenticación con Google
- Redirección automática después de autenticación

**Funcionalidad**: Punto de entrada para usuarios que desean autenticarse.

---

### `/auth/login` - Inicio de Sesión
**Descripción**: Página específica para iniciar sesión.

---

### `/auth/reset` - Recuperar Contraseña
**Descripción**: Formulario para recuperar contraseña:
- Ingreso de email
- Envío de enlace de recuperación
- Instrucciones de recuperación

**Funcionalidad**: Permite a usuarios recuperar acceso a sus cuentas.

---

### `/auth/update-password` - Actualizar Contraseña
**Descripción**: Formulario para actualizar la contraseña después de recibir el enlace de recuperación.

---

### `/auth/verify` - Verificar Email
**Descripción**: Página para verificar el email del usuario después del registro.

---

### `/auth/success` - Éxito de Autenticación
**Descripción**: Página de confirmación después de operaciones de autenticación exitosas.

---

### `/auth/error` - Error de Autenticación
**Descripción**: Página que muestra errores relacionados con la autenticación.

---

### `/auth/preview` - Preview de Páginas de Auth
**Descripción**: Página de desarrollo para previsualizar todas las páginas de autenticación (solo desarrollo).

---

## Rutas de Administración

### `/admin` - Panel de Administración
**Descripción**: Dashboard principal para administradores:
- Estadísticas generales del sitio
- Métricas de anuncios (totales, activos, pendientes, rechazados, destacados)
- Estadísticas de remates
- Estadísticas de usuarios
- Estadísticas de consultas
- Métricas de engagement (vistas, contactos)
- Enlaces rápidos a secciones de administración

**Requisitos**: Usuario con permisos de administrador

**Funcionalidad**: Centro de control administrativo del sitio.

---

### `/admin/propiedades` - Gestión de Propiedades
**Descripción**: Panel para administrar propiedades publicadas:
- Listado de todas las propiedades
- Filtros por estado (activo, pendiente, rechazado, pausado)
- Edición de propiedades
- Aprobación/rechazo de propiedades
- Destacar propiedades
- Preview de propiedades

**Requisitos**: Usuario con permisos de administrador

**Funcionalidad**: Permite a administradores gestionar el contenido de propiedades.

---

### `/admin/propiedades/preview/[id]` - Preview de Propiedad (Admin)
**Descripción**: Vista previa de propiedad para administradores antes de aprobar.

---

### `/admin/remates` - Gestión de Remates
**Descripción**: Panel para administrar remates judiciales:
- Listado de remates
- Procesamiento de remates
- Estadísticas de remates
- Gestión de datos de remates

**Requisitos**: Usuario con permisos de administrador

**Funcionalidad**: Permite a administradores gestionar la información de remates.

---

### `/admin/usuarios` - Gestión de Usuarios
**Descripción**: Panel para administrar usuarios:
- Listado de usuarios registrados
- Información de usuarios
- Gestión de permisos
- Estadísticas de usuarios

**Requisitos**: Usuario con permisos de administrador

**Funcionalidad**: Permite a administradores gestionar cuentas de usuario.

---

### `/admin/consultas` - Consultas y Mensajes
**Descripción**: Panel para gestionar consultas de usuarios:
- Mensajes de contacto
- Consultas sobre propiedades
- Respuestas a consultas
- Estadísticas de consultas

**Requisitos**: Usuario con permisos de administrador

**Funcionalidad**: Permite a administradores responder consultas de usuarios.

---

### `/admin/analitica` - Analytics y Estadísticas
**Descripción**: Panel de análisis y estadísticas avanzadas:
- Métricas detalladas
- Reportes
- Análisis de tráfico
- Estadísticas de uso

**Requisitos**: Usuario con permisos de administrador

**Funcionalidad**: Proporciona análisis detallado del sitio.

---

## Rutas de API

### `/api/chat` - API de Chat con IA
**Descripción**: Endpoint para el sistema de chat con IA (TEO):
- Procesamiento de mensajes
- Generación de respuestas con OpenAI
- Memoria de conversación
- Contexto de página actual

**Funcionalidad**: Backend para el chatbot inteligente del sitio.

---

### `/api/chat/health` - Health Check del Chat
**Descripción**: Verificación de salud del sistema de chat.

---

### `/api/chat/stats` - Estadísticas del Chat
**Descripción**: Estadísticas y métricas del sistema de chat.

---

### `/api/propiedades` - API de Propiedades
**Descripción**: Endpoint para operaciones relacionadas con propiedades.

---

### `/api/remates` - API de Remates
**Descripción**: Endpoint para operaciones relacionadas con remates.

---

### `/api/contacto/vendedor` - API de Contacto con Vendedor
**Descripción**: Endpoint para enviar consultas a vendedores de propiedades.

---

### `/api/geometrias` - API de Geometrías
**Descripción**: Endpoint para obtener información geométrica de propiedades (para mapas).

---

### `/api/admin/*` - APIs de Administración
**Descripción**: Varios endpoints para operaciones administrativas:
- `/api/admin/dashboard-stats` - Estadísticas del dashboard
- `/api/admin/propiedades` - Operaciones de propiedades
- `/api/admin/remates` - Operaciones de remates
- `/api/admin/usuarios` - Operaciones de usuarios
- `/api/admin/consultas` - Operaciones de consultas
- `/api/admin/anuncios` - Gestión de anuncios
- `/api/admin/historial-boletines` - Historial de boletines
- `/api/admin/guardar-remates` - Guardar remates
- `/api/admin/procesar-remates` - Procesar remates
- `/api/admin/remates-stats` - Estadísticas de remates
- `/api/admin/test-regex` - Pruebas de regex

**Requisitos**: Permisos de administrador

---

## Información Adicional para Chatbot

### Características Principales del Sitio

1. **Búsqueda de Propiedades**:
   - Propiedades en venta
   - Propiedades en alquiler
   - Filtros por ubicación (provincia, cantón, distrito)
   - Filtros por precio, características, tipo
   - Búsqueda por matrícula/finca_id
   - Búsqueda por texto libre

2. **Remates Judiciales**:
   - Información de subastas judiciales
   - Fechas de subasta
   - Precios base
   - Información legal

3. **Mapas Interactivos**:
   - Visualización geográfica
   - Múltiples distritos de Costa Rica
   - Integración con Mapbox

4. **Publicación**:
   - Sistema de publicación paso a paso
   - Selección de ubicación en mapa
   - Subida de imágenes
   - Gestión de propiedades publicadas

5. **Chatbot con IA (TEO)**:
   - Asistente inteligente
   - Respuestas contextuales
   - Memoria de conversación
   - Ayuda en navegación

### Ubicaciones Principales

**Provincias de Costa Rica**:
- San José
- Alajuela
- Cartago
- Heredia
- Guanacaste
- Puntarenas
- Limón

**Ciudades/Distritos Principales**:
- Escazú, Santa Ana, Curridabat, Moravia, Tibás
- San Pedro, Rohrmoser, Sabana
- Jacó, Manuel Antonio, Tamarindo
- La Fortuna, Arenal, Monteverde
- Y muchos más distritos costarricenses

### Tipos de Transacción

- **venta**: Propiedades en venta
- **alquiler**: Propiedades en alquiler
- **remate**: Propiedades en remate judicial

### Tipos de Propiedad

- Casa
- Apartamento
- Terreno/Parcela
- Local comercial
- Y otros tipos

### Monedas Soportadas

- USD (Dólares)
- CRC (Colones costarricenses)

---

## Flujos Comunes de Usuario

### Para Compradores:
1. Explorar propiedades en `/propiedades-venta`
2. Filtrar por ubicación, precio, características
3. Ver detalles en `/propiedades-venta/[id]`
4. Contactar vendedor
5. Explorar en mapa en `/map`

### Para Inquilinos:
1. Explorar propiedades en `/alquileres`
2. Filtrar por ubicación, precio mensual
3. Ver detalles en `/alquileres/[id]`
4. Contactar arrendador

### Para Inversionistas en Remates:
1. Explorar remates en `/remates`
2. Filtrar por fecha, ubicación, precio
3. Ver detalles en `/remates/[id]`
4. Obtener información del caso judicial

### Para Vendedores/Arrendadores:
1. Crear cuenta o iniciar sesión en `/auth`
2. Publicar propiedad en `/publicar_propiedad`
3. Gestionar propiedades en `/dashboard` o `/Profile`
4. Responder consultas

### Para Administradores:
1. Acceder a `/admin`
2. Revisar estadísticas
3. Gestionar propiedades en `/admin/propiedades`
4. Gestionar usuarios en `/admin/usuarios`
5. Revisar consultas en `/admin/consultas`

---

## Notas Importantes para el Chatbot

1. **Contexto del Usuario**: El chatbot puede detectar en qué página está el usuario para proporcionar respuestas contextuales.

2. **Búsquedas**: Los usuarios pueden buscar por:
   - Ubicación (provincia, cantón, distrito)
   - Tipo de transacción (venta, alquiler)
   - Precio
   - Características (dormitorios, baños, área)
   - Matrícula/finca_id
   - Texto libre

3. **Autenticación**: Algunas rutas requieren autenticación (publicar, dashboard, perfil, admin).

4. **Geografía**: El sitio está enfocado en Costa Rica, con información de provincias, cantones y distritos costarricenses.

5. **Idiomas**: El sitio soporta español e inglés, siendo el español el idioma principal.

6. **Contacto**: Información de contacto disponible:
   - Teléfono: +506 8697 8542
   - Email: info@sito.cr
   - Website: sito.cr

---

*Última actualización: Diciembre 2025*

