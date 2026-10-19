// backend/controllers/reportesController.js
// Todo se calcula sobre ventas activas (no anuladas), por la fecha y hora en que se registraron.
const { getDB } = require('../db');
const { filtroLocal } = require('../utils/alcance');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const pad = (n) => String(n).padStart(2, '0');
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const aDate = (str) => { const [y, m, d] = str.split('-').map(Number); return new Date(y, m - 1, d); };
const num = (v) => parseFloat(v) || 0;
// Día siguiente (YYYY-MM-DD): permite filtrar por rango sin envolver fecha_hora en DATE() y así usar el índice
const diaSiguiente = (str) => { const d = aDate(str); d.setDate(d.getDate() + 1); return toDateStr(d); };

// Devuelve { error } o { desde, hasta, horaDesde, horaHasta, scope }
// `scope` = locales permitidos (null = todos), ya acotado por el middleware según el usuario.
const parseFiltros = (query, scope) => {
    const hoy = new Date();
    const hace30 = new Date();
    hace30.setDate(hoy.getDate() - 29);
    const desde = query.desde || toDateStr(hace30);
    const hasta = query.hasta || toDateStr(hoy);
    if (!DATE_REGEX.test(desde) || !DATE_REGEX.test(hasta)) return { error: 'Fechas inválidas (use YYYY-MM-DD).' };
    if (desde > hasta) return { error: 'La fecha inicial no puede ser mayor a la final.' };

    const horaDesde = query.hora_desde || null;
    const horaHasta = query.hora_hasta || null;
    for (const h of [horaDesde, horaHasta]) {
        if (h && !TIME_REGEX.test(h)) return { error: 'Horas inválidas (use HH:MM).' };
    }
    if (horaDesde && horaHasta && horaDesde > horaHasta) return { error: 'La hora inicial no puede ser mayor a la final.' };
    return { desde, hasta, horaDesde, horaHasta, scope };
};

// Condiciones comunes sobre ventas (alias v)
const buildWhere = (f, { conLocal = true } = {}) => {
    const where = ["v.estado = 'activa'", 'v.fecha_hora >= ? AND v.fecha_hora < ?'];
    const params = [`${f.desde} 00:00:00`, `${diaSiguiente(f.hasta)} 00:00:00`];
    if (f.horaDesde) { where.push('TIME(v.fecha_hora) >= ?'); params.push(`${f.horaDesde}:00`); }
    if (f.horaHasta) { where.push('TIME(v.fecha_hora) <= ?'); params.push(`${f.horaHasta}:59`); }
    if (conLocal) { const fl = filtroLocal(f.scope, 'v.local_id'); where.push(fl.sql); params.push(...fl.params); }
    return { clause: where.join(' AND '), params };
};

const NOMBRE_TRABAJADOR = "COALESCE(NULLIF(TRIM(CONCAT(w.nombre, ' ', w.apellido)), ''), i.trabajador_nombre)";

// ---------------------------------------------------------------------------------------------
// Liquidación: lo vendido por cada trabajador y lo que le toca a él y al local.
// Un trabajador que estuvo en varios locales aparece una vez por local (historiales independientes).
exports.getLiquidacion = async (req, res, next) => {
    try {
        const f = parseFiltros(req.query, req.localScope);
        if (f.error) return res.status(400).json({ message: f.error });
        const sinLocal = buildWhere(f, { conLocal: false });
        const fl = filtroLocal(f.scope, 'tl.local_id');

        const [rows] = await getDB().query(`
            SELECT w.id AS trabajador_id, TRIM(CONCAT(w.nombre, ' ', w.apellido)) AS trabajador,
                   tl.local_id, l.nombre AS local_nombre, tl.estado AS asignacion,
                   COALESCE(SUM(i.precio), 0) AS total, COALESCE(SUM(i.monto_trabajador), 0) AS comision,
                   COALESCE(SUM(i.monto_local), 0) AS parte_local, COUNT(i.id) AS servicios
            FROM trabajador_locales tl
            JOIN trabajadores w ON w.id = tl.trabajador_id
            JOIN locales l ON l.id = tl.local_id
            LEFT JOIN ventas v ON v.local_id = tl.local_id AND ${sinLocal.clause}
            LEFT JOIN venta_items i ON i.venta_id = v.id AND i.trabajador_id = w.id
            WHERE ${fl.sql}
            GROUP BY w.id, w.nombre, w.apellido, tl.local_id, l.nombre, tl.estado
            ORDER BY total DESC, w.nombre`,
            [...sinLocal.params, ...fl.params]);

        res.json(rows.map(r => ({
            ...r, total: num(r.total), comision: num(r.comision), parte_local: num(r.parte_local), servicios: Number(r.servicios),
        })));
    } catch (err) {
        console.error('Error en liquidación:', err);
        next(err);
    }
};

// ---------------------------------------------------------------------------------------------
// Datos agregados para el dashboard.
exports.getDashboard = async (req, res, next) => {
    try {
        const f = parseFiltros(req.query, req.localScope);
        if (f.error) return res.status(400).json({ message: f.error });
        const pool = getDB();
        const { clause, params } = buildWhere(f);

        const sinLocal = buildWhere(f, { conLocal: false });
        const fl = filtroLocal(f.scope, 'l.id');
        // Periodo anterior de igual duración (para mostrar la variación en las tarjetas)
        const dias = Math.round((aDate(f.hasta) - aDate(f.desde)) / 86400000) + 1;
        const prevHasta = aDate(f.desde); prevHasta.setDate(prevHasta.getDate() - 1);
        const prevDesde = new Date(prevHasta); prevDesde.setDate(prevHasta.getDate() - (dias - 1));
        const previo = buildWhere({ ...f, desde: toDateStr(prevDesde), hasta: toDateStr(prevHasta) });

        // Consultas independientes en paralelo
        const [
            [[resumen]], [[repartos]], [porLocal], [porFecha], [porHoraRows], [porDiaRows],
            [porTrabajador], [porServicio], [diaTrab], [[anterior]],
        ] = await Promise.all([
            pool.query(`SELECT COALESCE(SUM(v.total), 0) AS ingresos, COUNT(*) AS atenciones FROM ventas v WHERE ${clause}`, params),
            pool.query(
                `SELECT COUNT(i.id) AS servicios, COALESCE(SUM(i.monto_trabajador), 0) AS trabajadores, COALESCE(SUM(i.monto_local), 0) AS local_neto
                 FROM venta_items i JOIN ventas v ON v.id = i.venta_id WHERE ${clause}`, params),
            pool.query(
                `SELECT l.id AS local_id, l.nombre AS local, COALESCE(SUM(v.total), 0) AS total, COUNT(v.id) AS atenciones,
                        COALESCE(SUM(x.mt), 0) AS trabajadores, COALESCE(SUM(x.ml), 0) AS local_neto
                 FROM locales l
                 LEFT JOIN ventas v ON v.local_id = l.id AND ${sinLocal.clause}
                 LEFT JOIN (SELECT venta_id, SUM(monto_trabajador) AS mt, SUM(monto_local) AS ml FROM venta_items GROUP BY venta_id) x ON x.venta_id = v.id
                 WHERE ${fl.sql}
                 GROUP BY l.id, l.nombre ORDER BY total DESC`,
                [...sinLocal.params, ...fl.params]),
            pool.query(
                `SELECT DATE_FORMAT(v.fecha_hora, '%Y-%m-%d') AS fecha, SUM(v.total) AS total, COUNT(*) AS atenciones
                 FROM ventas v WHERE ${clause} GROUP BY fecha ORDER BY fecha`, params),
            pool.query(
                `SELECT HOUR(v.fecha_hora) AS hora, SUM(v.total) AS total, COUNT(*) AS atenciones FROM ventas v WHERE ${clause} GROUP BY hora`, params),
            pool.query(
                `SELECT DAYOFWEEK(v.fecha_hora) AS dia, SUM(v.total) AS total, COUNT(*) AS atenciones FROM ventas v WHERE ${clause} GROUP BY dia`, params),
            pool.query(
                `SELECT i.trabajador_id, ${NOMBRE_TRABAJADOR} AS trabajador, l.nombre AS local,
                        SUM(i.precio) AS total, SUM(i.monto_trabajador) AS comision, COUNT(*) AS servicios
                 FROM venta_items i
                 JOIN ventas v ON v.id = i.venta_id
                 JOIN locales l ON l.id = v.local_id
                 LEFT JOIN trabajadores w ON w.id = i.trabajador_id
                 WHERE ${clause}
                 GROUP BY i.trabajador_id, i.trabajador_nombre, trabajador, v.local_id, l.nombre
                 ORDER BY total DESC LIMIT 50`, params),
            pool.query(
                `SELECT i.servicio_nombre AS servicio, COUNT(*) AS cantidad, SUM(i.precio) AS total
                 FROM venta_items i JOIN ventas v ON v.id = i.venta_id WHERE ${clause}
                 GROUP BY i.servicio_nombre ORDER BY total DESC LIMIT 10`, params),
            // Quién hizo más y quién menos cada día (entre los que trabajaron ese día)
            pool.query(
                `SELECT DATE_FORMAT(v.fecha_hora, '%Y-%m-%d') AS fecha, i.trabajador_id, ${NOMBRE_TRABAJADOR} AS trabajador, SUM(i.precio) AS total
                 FROM venta_items i JOIN ventas v ON v.id = i.venta_id LEFT JOIN trabajadores w ON w.id = i.trabajador_id
                 WHERE ${clause} GROUP BY fecha, i.trabajador_id, i.trabajador_nombre, trabajador ORDER BY fecha DESC, total DESC`, params),
            pool.query(`SELECT COALESCE(SUM(v.total), 0) AS ingresos, COUNT(*) AS atenciones FROM ventas v WHERE ${previo.clause}`, previo.params),
        ]);

        const porDiaTrabajador = [];
        for (const fecha of [...new Set(diaTrab.map(r => r.fecha))].slice(0, 31)) {
            const dia = diaTrab.filter(r => r.fecha === fecha); // ya viene de mayor a menor
            const mas = dia[0];
            const menos = dia.length > 1 ? dia[dia.length - 1] : null;
            porDiaTrabajador.push({
                fecha,
                mas: { trabajador: mas.trabajador, total: num(mas.total) },
                menos: menos ? { trabajador: menos.trabajador, total: num(menos.total) } : null,
            });
        }

        const mapHora = new Map(porHoraRows.map(r => [r.hora, r]));
        const porHora = Array.from({ length: 24 }, (_, h) => ({
            hora: `${pad(h)}:00`, total: num(mapHora.get(h)?.total), atenciones: Number(mapHora.get(h)?.atenciones || 0),
        }));
        const mapDia = new Map(porDiaRows.map(r => [r.dia, r]));
        // DAYOFWEEK: 1=Domingo..7=Sábado; se presenta de Lunes a Domingo
        const porDia = [2, 3, 4, 5, 6, 7, 1].map(d => ({
            dia: DIAS[d - 1], total: num(mapDia.get(d)?.total), atenciones: Number(mapDia.get(d)?.atenciones || 0),
        }));

        const ingresos = num(resumen.ingresos);
        const atenciones = Number(resumen.atenciones);
        res.json({
            filtros: { desde: f.desde, hasta: f.hasta, hora_desde: f.horaDesde, hora_hasta: f.horaHasta, local_id: f.scope && f.scope.length === 1 ? f.scope[0] : null },
            resumen: {
                ingresos, atenciones, servicios: Number(repartos.servicios),
                ganancia_local: num(repartos.local_neto), pago_trabajadores: num(repartos.trabajadores),
                ticket_promedio: atenciones ? ingresos / atenciones : 0,
            },
            anterior: { ingresos: num(anterior.ingresos), atenciones: Number(anterior.atenciones), desde: toDateStr(prevDesde), hasta: toDateStr(prevHasta) },
            por_local: porLocal.map(r => ({ ...r, total: num(r.total), atenciones: Number(r.atenciones), trabajadores: num(r.trabajadores), local_neto: num(r.local_neto) })),
            por_fecha: porFecha.map(r => ({ ...r, total: num(r.total), atenciones: Number(r.atenciones) })),
            por_hora: porHora,
            por_dia: porDia,
            por_trabajador: porTrabajador.map(r => ({ ...r, total: num(r.total), comision: num(r.comision), servicios: Number(r.servicios) })),
            por_servicio: porServicio.map(r => ({ ...r, cantidad: Number(r.cantidad), total: num(r.total) })),
            por_dia_trabajador: porDiaTrabajador,
        });
    } catch (err) {
        console.error('Error en dashboard:', err);
        next(err);
    }
};

// ---------------------------------------------------------------------------------------------
// Detalle de un local para un periodo (day | week | month | year) que termina en `fecha` (por defecto hoy).
exports.getLocalDetalle = async (req, res, next) => {
    try {
        const periodo = req.query.periodo || 'month';
        if (!['day', 'week', 'month', 'year'].includes(periodo)) return res.status(400).json({ message: 'Periodo inválido.' });
        const fecha = req.query.fecha || toDateStr(new Date());
        if (!DATE_REGEX.test(fecha)) return res.status(400).json({ message: 'Fecha inválida (use YYYY-MM-DD).' });

        const fin = aDate(fecha);
        let inicio, keyExpr, buckets;
        if (periodo === 'day') {
            inicio = fin;
            keyExpr = "DATE_FORMAT(v.fecha_hora, '%H')";
            buckets = Array.from({ length: 24 }, (_, h) => ({ key: pad(h), name: `${pad(h)}h` }));
        } else if (periodo === 'week' || periodo === 'month') {
            const dias = periodo === 'week' ? 7 : 30;
            inicio = new Date(fin); inicio.setDate(fin.getDate() - (dias - 1));
            keyExpr = "DATE_FORMAT(v.fecha_hora, '%Y-%m-%d')";
            buckets = Array.from({ length: dias }, (_, i) => {
                const dt = new Date(inicio); dt.setDate(inicio.getDate() + i);
                return { key: toDateStr(dt), name: `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}` };
            });
        } else {
            inicio = new Date(fin.getFullYear(), fin.getMonth() - 11, 1);
            keyExpr = "DATE_FORMAT(v.fecha_hora, '%Y-%m')";
            buckets = Array.from({ length: 12 }, (_, i) => {
                const dt = new Date(inicio.getFullYear(), inicio.getMonth() + i, 1);
                return { key: `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}`, name: `${pad(dt.getMonth() + 1)}/${String(dt.getFullYear()).slice(2)}` };
            });
        }

        const pool = getDB();
        const [locs] = await pool.query('SELECT id FROM locales WHERE id = ?', [req.params.id]);
        if (locs.length === 0) return res.status(404).json({ message: 'Local no encontrado.' });

        const base = "v.local_id = ? AND v.estado = 'activa' AND v.fecha_hora >= ? AND v.fecha_hora < ?";
        const params = [req.params.id, `${toDateStr(inicio)} 00:00:00`, `${diaSiguiente(toDateStr(fin))} 00:00:00`];

        const [serie] = await pool.query(`SELECT ${keyExpr} AS k, SUM(v.total) AS total FROM ventas v WHERE ${base} GROUP BY k`, params);
        const [servicios] = await pool.query(
            `SELECT i.servicio_nombre AS n, COUNT(*) AS v FROM venta_items i JOIN ventas v ON v.id = i.venta_id
             WHERE ${base} GROUP BY i.servicio_nombre ORDER BY v DESC`, params);
        const [trabajadores] = await pool.query(
            `SELECT i.trabajador_nombre AS n, COUNT(*) AS v FROM venta_items i JOIN ventas v ON v.id = i.venta_id
             WHERE ${base} GROUP BY i.trabajador_nombre ORDER BY SUM(i.precio) DESC LIMIT 1`, params);
        const [[tot]] = await pool.query(`SELECT COALESCE(SUM(v.total), 0) AS ingresos, COUNT(*) AS atenciones FROM ventas v WHERE ${base}`, params);
        const [[rep]] = await pool.query(
            `SELECT COUNT(i.id) AS servicios, COALESCE(SUM(i.monto_local), 0) AS local_neto, COALESCE(SUM(i.monto_trabajador), 0) AS trabajadores
             FROM venta_items i JOIN ventas v ON v.id = i.venta_id WHERE ${base}`, params);

        const mapa = new Map(serie.map(r => [r.k, num(r.total)]));
        res.json({
            tendencia: buckets.map(b => ({ name: b.name, Ingresos: mapa.get(b.key) || 0 })),
            distribucion: servicios.map(s => ({ n: s.n, v: Number(s.v) })),
            metrics: {
                income: num(tot.ingresos),
                services: Number(rep.servicios),
                clients: Number(tot.atenciones),          // atenciones (tickets cobrados)
                localShare: num(rep.local_neto),
                workersShare: num(rep.trabajadores),
                topWorkerName: trabajadores[0]?.n || 'Sin datos',
                topWorkerServices: Number(trabajadores[0]?.v || 0),
                topServiceName: servicios[0]?.n || 'Sin datos',
                topServiceCount: Number(servicios[0]?.v || 0),
            },
        });
    } catch (err) {
        console.error('Error en detalle de local:', err);
        next(err);
    }
};
