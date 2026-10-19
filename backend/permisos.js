// backend/permisos.js
// Catálogo de permisos del sistema. Los roles (tabla `roles`) son conjuntos de estos permisos.

const GRUPOS = [
    { id: 'ventas', nombre: 'Cobros y ventas' },
    { id: 'locales', nombre: 'Locales' },
    { id: 'personal', nombre: 'Trabajadores' },
    { id: 'catalogo', nombre: 'Servicios e inventario' },
    { id: 'reportes', nombre: 'Reportes' },
    { id: 'admin', nombre: 'Administración' },
];

const PERMISOS = [
    { id: 'ventas.registrar', grupo: 'ventas', nombre: 'Registrar servicios cobrados', detalle: 'Anota el ticket del cliente: servicios, precio y quién los hizo.' },
    { id: 'ventas.ver_local', grupo: 'ventas', nombre: 'Ver las ventas de sus locales' },
    { id: 'ventas.anular', grupo: 'ventas', nombre: 'Anular ventas registradas' },
    { id: 'locales.ver', grupo: 'locales', nombre: 'Ver locales' },
    { id: 'locales.administrar', grupo: 'locales', nombre: 'Crear y eliminar locales' },
    { id: 'trabajadores.ver', grupo: 'personal', nombre: 'Ver trabajadores' },
    { id: 'trabajadores.administrar', grupo: 'personal', nombre: 'Agregar y eliminar trabajadores' },
    { id: 'trabajadores.transferir', grupo: 'personal', nombre: 'Trasladar trabajadores entre locales' },
    { id: 'servicios.ver', grupo: 'catalogo', nombre: 'Ver servicios y precios' },
    { id: 'servicios.administrar', grupo: 'catalogo', nombre: 'Crear y editar servicios, precios y porcentajes' },
    { id: 'inventario.administrar', grupo: 'catalogo', nombre: 'Gestionar el inventario' },
    { id: 'reportes.local', grupo: 'reportes', nombre: 'Ver el detalle de sus locales' },
    { id: 'reportes.global', grupo: 'reportes', nombre: 'Ver el dashboard y la liquidación de trabajadores' },
    { id: 'configuracion.ver', grupo: 'admin', nombre: 'Ver la configuración del negocio' },
    { id: 'configuracion.administrar', grupo: 'admin', nombre: 'Cambiar tema, logo y datos del negocio' },
    { id: 'usuarios.administrar', grupo: 'admin', nombre: 'Administrar usuarios, roles y permisos' },
];

const IDS = PERMISOS.map(p => p.id);

// Alcance: a qué locales llega el rol
//   global -> todos los locales · local -> solo el suyo · multi -> los que se le asignen
const ALCANCES = ['global', 'local', 'multi'];

// Solo dos usuarios usan el sistema: el dueño (administrador) y la encargada de un local.
const ROLES_BASE = [
    {
        id: 'admin', nombre: 'Dueño', alcance: 'global', es_sistema: 1,
        descripcion: 'Acceso total: cobra, define servicios y porcentajes, y ve todos los reportes.',
        permisos: IDS,
    },
    {
        id: 'encargado', nombre: 'Encargada', alcance: 'local', es_sistema: 1,
        descripcion: 'Cobra y registra los servicios de su local y ve cómo le va.',
        permisos: [
            'ventas.registrar', 'ventas.ver_local', 'ventas.anular', 'locales.ver', 'trabajadores.ver',
            'servicios.ver', 'inventario.administrar', 'reportes.local', 'configuracion.ver',
        ],
    },
];

module.exports = { GRUPOS, PERMISOS, IDS, ALCANCES, ROLES_BASE };
