const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value) => typeof value === 'string' && UUID_REGEX.test(value);

const ID_FIELDS = ['localId', 'local_id', 'servicioId', 'trabajadorId', 'trabajador_id'];

// Para router.param('id', ...): rechaza ids de ruta que no sean UUID.
const validateUuidParam = (req, res, next, value) => {
    if (!isUuid(value)) {
        return res.status(400).json({ message: 'Identificador inválido.' });
    }
    next();
};

// Valida los campos de id opcionales que lleguen por query o body.
const validateIdFields = (req, res, next) => {
    for (const source of [req.query, req.body]) {
        if (!source || typeof source !== 'object') continue;
        for (const field of ID_FIELDS) {
            const value = source[field];
            if (value === undefined || value === null || value === '') continue;
            if (!isUuid(value)) {
                return res.status(400).json({ message: `Identificador inválido en '${field}'.` });
            }
        }
    }
    next();
};

module.exports = { isUuid, validateUuidParam, validateIdFields };
