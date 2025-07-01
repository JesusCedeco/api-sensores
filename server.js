// Ejecutar: npm run dev

//entrar en mysql: sudo mysql -u admin -p        contraseña: 1234
//para cerrar el puerto 
//sudo lsof -i :5008
//node     12345 jcm   12u  IPv6 0x...  TCP *:5009 (LISTEN)
//kill -9 12345

//activar entorno virtual: source venv/bin/activate
import "dotenv/config"
import express from "express";
import path from "path";
import { Server } from "socket.io";
import { createServer } from "http";
import { MongoClient } from "mongodb";
import { Parser } from "json2csv";
import { fileURLToPath } from "url";
//siempre que creamos un modulo creado por nosotros poner extensión
import { pool } from "./db.js";


//Si lo hacemos nosotros hay que poner la extension (cuando lo importamos)
import indexRouter from "./routes/routes.js";

const PORT = process.env.PORT || 5000;
const mongodb = process.env.mongodb;
const dbName = process.env.dbName;
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

let eventosCollection;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conectar a MongoDB
MongoClient.connect(mongodb, { useUnifiedTopology: true })
  .then((client) => {
    console.log("✅ Conectado a MongoDB");
    const db = client.db(dbName);
    eventosCollection = db.collection("eventos");
  })
  .catch((err) => {
    console.error("❌ Error conectando a MongoDB:", err);
  });



// Middleware para archivos estáticos (CORREGIDO)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use(indexRouter)

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


//Descarga de archivos
app.get('/descargar', async (req, res) => {
  try {
    const eventos = await eventosCollection.find({}).sort({ timestamp: -1 }).toArray();

    const campos = ['timestamp', 'eventos', 'nivel'];
    const parser = new Parser({ fields: campos });
    const csv = parser.parse(eventos);

    res.header('Content-Type', 'text/csv');
    res.attachment('eventos.csv');
    res.send(csv);
  } catch (err) {
    console.error("❌ Error exportando CSV:", err);
    res.status(500).send("Error generando CSV");
  }
});

//Ruta para los datos de la tabla
app.get('/api/eventos', async (req, res) => {
  try {
    const eventos = await eventosCollection.find({})
      .sort({ timestamp: -1 })
      .limit(100) // Puedes quitar el límite si quieres ver todos
      .toArray();
    res.json(eventos);
  } catch (err) {
    console.error("❌ Error obteniendo eventos:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

//Ruta para usuarios (siempre que se utiliza async se utiliza await)
app.get('/api/usuarios', async (req, res) => {
  const [usuarios] = await pool.query("SELECT * FROM usuarios ORDER BY nombre")
  res.json(usuarios)
  console.log(usuarios)
})

//Insertar ususarios que vienen del formulario que esta en el body
app.post('/api/usuarios', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    const [rows] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    
    if (rows.length === 0) {
      await pool.query(
        'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
        [nombre, email, password]
      );
      return res.status(201).send('✅ Usuario creado correctamente'); // ⬅️ `return` aquí
    } else {
      return res.status(409).send('⚠️ Ya existe un usuario con ese email'); // ⬅️ `return` aquí también
    }

  } catch (error) {
    console.error("Error al insertar usuario:", error);
    return res.status(500).json({ error: "❌ Error al insertar usuario" });
  }
});


// Borrar usuario por ID
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM usuarios WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json({ message: "Usuario borrado correctamente" });
  } catch (error) {
    console.error("Error al borrar usuario:", error);
    res.status(500).json({ error: "Error al borrar usuario" });
  }
});




app.post('/login', async (req, res) => {
  const { nombre, password } = req.body;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM sparkdb.usuarios WHERE nombre = ? AND password = ?',
      [nombre, password]
    );

    if (rows.length > 0) {
      // Login correcto, redirigimos al dashboard
      console.log("✅ Login correcto:", rows[0].nombre);
      res.redirect('/dashboard');
    } else {
      // Login incorrecto, redirigimos a /login con mensaje de error
      console.warn("❌ Login fallido");
      res.redirect('/login?error=1');
    }
  } catch (err) {
    console.error('❌ Error al consultar la base de datos:', err);
    res.status(500).send('Error del servidor');
  }
});



io.on("connection", (socket) => {
  const clientIpAddress = socket.request.connection.remoteAddress;
  console.log(`🔌 Cliente ${clientIpAddress} conectado a ws`);

  // ✅ Aquí está bien definido el 'socket'
  socket.on('evento', (data) => {
    console.log('📦 Evento recibido desde Python:', data);

    // Reenviar al dashboard
    io.emit('evento', data);

    // Guardar en MongoDB
    if (eventosCollection) {
      eventosCollection.insertOne(data)
        .then(() => {
          console.log("🗃️ Evento guardado en MongoDB");
        })
        .catch((err) => {
          console.error("❌ Error al guardar en MongoDB:", err);
        });
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ Cliente ${clientIpAddress} desconectado`);
  });
});






/*app.listen(PORT , ()=>{
    console.log("Servidor eschuchando en el puerto: ", PORT)
});*/

httpServer.listen(PORT, () => {
  console.log("Servidor eschuchando en el puerto: ", PORT)
}); 
