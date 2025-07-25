const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

let connection;

async function connectDB() {
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Conectado a la base de datos MySQL.');

        // Crear tablas si no existen
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'cliente',
                local_id INT,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Modificar la tabla 'locales' para añadir el campo tipo_local, imagen y estado
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS locales (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                tipo_local VARCHAR(50) NOT NULL,
                direccion VARCHAR(255),
                telefono VARCHAR(20),
                horario VARCHAR(100),
                numero_peluqueros INT DEFAULT 0,
                ingreso_mensual DECIMAL(10, 2) DEFAULT 0.00,
                clientes_activos INT DEFAULT 0,
                imagen VARCHAR(255),               -- NUEVO CAMPO
                estado VARCHAR(50) DEFAULT 'Activo' -- NUEVO CAMPO
            );
        `);

        // --- CORRECCIÓN CRÍTICA: Actualización completa de la tabla 'trabajadores' ---
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS trabajadores (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                apellido VARCHAR(255),
                edad INT,                           -- AÑADIDO
                dni VARCHAR(20) UNIQUE,             -- AÑADIDO
                telefono VARCHAR(20),
                email VARCHAR(255),
                nacionalidad VARCHAR(100),          -- AÑADIDO
                estado_civil VARCHAR(50),           -- AÑADIDO
                fecha_ingreso DATE,
                nivel_estudios VARCHAR(100),        -- AÑADIDO
                experiencia INT DEFAULT 0,          -- AÑADIDO
                cantidad_hijos INT DEFAULT 0,       -- AÑADIDO
                especialidad VARCHAR(255),
                valoracion DECIMAL(2, 1) DEFAULT 0.0, -- Nombre en DB: valoracion
                clientes_atendidos INT DEFAULT 0,     -- Nombre en DB: clientes_atendidos
                ingreso_mensual DECIMAL(10, 2) DEFAULT 0.00, -- Nombre en DB: ingreso_mensual
                foto VARCHAR(255),                  -- AÑADIDO
                servicios TEXT,                     -- AÑADIDO (para JSON.stringify)
                local_id INT NOT NULL,
                salario DECIMAL(10, 2) DEFAULT 0.00, -- Asegurar que tiene valor por defecto
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (local_id) REFERENCES locales(id)
            );
        `);
        // --- FIN DE CORRECCIÓN CRÍTICA: tabla 'trabajadores' ---

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS servicios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                categoria VARCHAR(255),
                precio DECIMAL(10, 2) NOT NULL,
                duracion VARCHAR(50),
                descripcion TEXT,
                local_id INT NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (local_id) REFERENCES locales(id)
            );
        `);

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS trabajador_servicio (
                trabajador_id INT NOT NULL,
                servicio_id INT NOT NULL,
                PRIMARY KEY (trabajador_id, servicio_id),
                FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id) ON DELETE CASCADE,
                FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE
            );
        `);

        // --- INICIO DE CAMBIOS PARA TABLAS DE CLIENTES SEPARADAS ---

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS cliente_spa (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                apellido VARCHAR(255),
                telefono VARCHAR(20),
                email VARCHAR(255),
                fecha_cita DATE NOT NULL,
                hora_cita TIME NOT NULL,
                servicio_id INT,
                trabajador_id INT,
                local_id INT NOT NULL,
                notas TEXT,
                estado VARCHAR(50) DEFAULT 'pendiente',
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (servicio_id) REFERENCES servicios(id),
                FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id),
                FOREIGN KEY (local_id) REFERENCES locales(id)
            );
        `);

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS cliente_barberia (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                apellido VARCHAR(255),
                telefono VARCHAR(20),
                email VARCHAR(255),
                fecha_cita DATE NOT NULL,
                hora_cita TIME NOT NULL,
                servicio_id INT,
                trabajador_id INT,
                local_id INT NOT NULL,
                notas TEXT,
                estado VARCHAR(50) DEFAULT 'pendiente',
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (servicio_id) REFERENCES servicios(id),
                FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id),
                FOREIGN KEY (local_id) REFERENCES locales(id)
            );
        `);

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS cliente_peluqueria (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                apellido VARCHAR(255),
                telefono VARCHAR(20),
                email VARCHAR(255),
                fecha_cita DATE NOT NULL,
                hora_cita TIME NOT NULL,
                servicio_id INT,
                trabajador_id INT,
                local_id INT NOT NULL,
                notas TEXT,
                estado VARCHAR(50) DEFAULT 'pendiente',
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (servicio_id) REFERENCES servicios(id),
                FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id),
                FOREIGN KEY (local_id) REFERENCES locales(id)
            );
        `);

        // --- FIN DE CAMBIOS PARA TABLAS DE CLIENTES SEPARADAS ---


        // Insertar datos iniciales si no existen
        const [users] = await connection.execute('SELECT COUNT(*) AS count FROM users');
        if (users[0].count === 0) {
            await connection.execute(
                `INSERT INTO users (username, password, role) VALUES (?, ?, ?);`,
                ['admin', 'admin', 'admin'] // Contraseña "admin" en texto plano
            ); 
            console.log('Usuario admin inicial creado.');
        }
        
        const [locales_count] = await connection.execute('SELECT COUNT(*) AS count FROM locales');
        if (locales_count[0].count === 0) {
            await connection.execute(`
                INSERT INTO locales (nombre, tipo_local, direccion, telefono, horario, imagen, estado) VALUES
                ('Barbería StylePro Centro', 'barberia', 'Calle Principal 123', '987654321', 'Lun-Sab 9-20', 'https://images.unsplash.com/photo-1560066989-183497d389a9?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=300&h=200&fit=crop', 'Activo'),
                ('Peluquería Glamour Express', 'peluqueria', 'Avenida Central 456', '912345678', 'Mar-Dom 10-21', 'https://images.unsplash.com/photo-1533042456616-d446927d56e7?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=300&h=200&fit=crop', 'Activo'),
                ('Spa Relax & Renew', 'spa', 'Plaza del Sol 789', '955123456', 'Lun-Vie 8-19', 'https://images.unsplash.com/photo-1544161514-7227918a0a1a?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=300&h=200&fit=crop', 'Activo');
            `);
            console.log('Locales iniciales creados.');
        }

        const [trabajadores_count] = await connection.execute('SELECT COUNT(*) AS count FROM trabajadores');
        if (trabajadores_count[0].count === 0) {
            // CORRECCIÓN: Insertar datos de trabajadores con todas las nuevas columnas
            await connection.execute(`
                INSERT INTO trabajadores (nombre, apellido, edad, dni, telefono, email, nacionalidad, estado_civil, fecha_ingreso, nivel_estudios, experiencia, cantidad_hijos, especialidad, valoracion, clientes_atendidos, ingreso_mensual, foto, servicios, local_id, salario) VALUES
                ('Juan', 'Pérez', 30, '12345678A', '900111222', 'juan.perez@example.com', 'Peruano', 'Soltero', '2020-01-15', 'Técnico', 5, 0, 'Corte de Cabello', 4.8, 150, 1500.00, 'https://images.unsplash.com/photo-1564860086-5389d3d3a43b?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=300&h=200&fit=crop', '["Corte Caballero", "Afeitado Clásico"]', 1, 1200.00),
                ('María', 'Gómez', 25, '87654321B', '900333444', 'maria.gomez@example.com', 'Mexicana', 'Casada', '2021-03-01', 'Universitario', 3, 1, 'Peinados', 4.9, 120, 1800.00, 'https://images.unsplash.com/photo-1581456187760-4c40b8a1c9a6?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=300&h=200&fit=crop', '["Peinado Noche", "Corte Dama"]', 2, 1500.00),
                ('Laura', 'Martínez', 35, '11223344C', '900555666', 'laura.martinez@example.com', 'Española', 'Soltera', '2019-07-20', 'Maestría', 8, 2, 'Masajes', 5.0, 180, 2500.00, 'https://images.unsplash.com/photo-1550920042-4b8c9b32e2c8?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=300&h=200&fit=crop', '["Masaje Relajante", "Tratamiento Facial"]', 3, 2000.00);
            `);
            console.log('Trabajadores iniciales creados.');
        }

        const [servicios_count] = await connection.execute('SELECT COUNT(*) AS count FROM servicios');
        if (servicios_count[0].count === 0) {
            await connection.execute(`
                INSERT INTO servicios (nombre, categoria, precio, duracion, local_id) VALUES
                ('Corte Caballero', 'Corte', 25.00, '30 min', 1),
                ('Afeitado Clásico', 'Barbería', 20.00, '20 min', 1),
                ('Corte Dama', 'Corte', 35.00, '45 min', 2),
                ('Peinado Noche', 'Peinado', 50.00, '60 min', 2),
                ('Masaje Relajante', 'Masajes', 80.00, '60 min', 3),
                ('Tratamiento Facial', 'Cuidado Facial', 60.00, '45 min', 3);
            `);
            console.log('Servicios iniciales creados.');
        }

        // Asignar servicios a trabajadores (ejemplo)
        const [trabajadorServicioCount] = await connection.execute('SELECT COUNT(*) AS count FROM trabajador_servicio');
        if (trabajadorServicioCount[0].count === 0) {
            await connection.execute(`
                INSERT INTO trabajador_servicio (trabajador_id, servicio_id) VALUES
                (1, 1), (1, 2), (2, 3), (2, 4), (3, 5), (3, 6);
            `);
            console.log('Asignación inicial de trabajadores a servicios completada.');
        }

    } catch (err) {
        console.error('Error al conectar o inicializar la base de datos:', err);
        process.exit(1);
    }
}

function getDB() {
    return connection;
}

module.exports = { connectDB, getDB };