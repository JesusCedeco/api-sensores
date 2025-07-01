import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";


const router = Router();

// Estas líneas reemplazan __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});



router.get('/box', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'box.html'));
});

router.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'dashboard.html'));
});

router.get('/registros', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'registros.html'));
});

router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'login.html'));
});

router.get('/usuarios', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'usuarios.html'));
});



//Conexión con kafka No está disponible
router.get('/kafka/start', (req, res) => {
    exec('python3 /home/jcm/Desktop/sparkdb/kafka/iniciar_kafka.py', (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Error al ejecutar Kafka:', stderr);
            return res.status(500).send('Error: ' + stderr);
        }
        res.send(stdout);
    });
});



export default router;