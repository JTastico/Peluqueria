// backend/utils/alcance.js
// Convierte el alcance de locales del usuario (null = todos, o lista de ids) en SQL.

// filtroLocal(null, 't.local_id')      -> { sql: '1=1', params: [] }
// filtroLocal([a, b], 't.local_id')    -> { sql: 't.local_id IN (?)', params: [[a, b]] }
// filtroLocal([], 't.local_id')        -> { sql: '0=1', params: [] }
const filtroLocal = (scope, columna) => {
    if (scope === null || scope === undefined) return { sql: '1=1', params: [] };
    if (scope.length === 0) return { sql: '0=1', params: [] };
    return { sql: `${columna} IN (?)`, params: [scope] };
};

module.exports = { filtroLocal };
