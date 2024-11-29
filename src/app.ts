import { addKeyword, createBot, createFlow, createProvider, MemoryDB } from "@bot-whatsapp/bot";
import { BaileysProvider } from '@bot-whatsapp/provider-baileys';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from 'axios'; // Para realizar solicitudes HTTP

// Obtener __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// URL del flujo de Power Automate
const POWER_AUTOMATE_URL = 'https://prod-94.westus.logic.azure.com:443/workflows/3e637b9fbbeb41e281ea365d28a5c40c/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=g3tL1sL7ryndNwP915SMRE1vu4yUP9QA-Hbv7wAZui0';

// Flujo de bienvenida
const flowBienvenida = addKeyword('Estatus').addAnswer('Servicio OK');

// Función para enviar POST a Power Automate
const enviarPostPowerAutomate = async (phoneNumber: string): Promise<void> => {
    try {
        const response = await axios.post(POWER_AUTOMATE_URL, phoneNumber, {
            headers: { 'Content-Type': 'text/plain' },
        });
        console.log('POST enviado a Power Automate:', response.data);
    } catch (error) {
        console.error('Error al enviar POST a Power Automate:', error.message);
    }
};

// Flujo para manejar mensajes que contienen "estado"
const flowEstado = addKeyword('estado')
    .addAnswer('Procesando tu solicitud, por favor espera...')
    .addAction(async (ctx) => {
        // Inspeccionar el contexto para obtener el número del remitente
        const phoneNumber = ctx.from; // Ajustar si está en otra propiedad
        if (!phoneNumber) {
            console.error('Número de remitente no encontrado en el contexto:', ctx);
            return;
        }

        console.log('Número detectado:', phoneNumber);

        // Enviar el número al flujo de Power Automate
        await enviarPostPowerAutomate(phoneNumber);
    });

const main = async (): Promise<void> => {
    const provider = createProvider(BaileysProvider);

    // Crear un servidor HTTP con express
    const app = express();
    
    // Middleware para permitir el uso de JSON en las solicitudes POST
    app.use(express.json());

    // Ruta GET para verificar que el servidor está corriendo
    app.get('/', (req, res) => {
        res.send('Bot WhatsApp está corriendo');
    });

    // Ruta POST para recibir solicitudes y enviar mensajes
    app.post('/send-message', async (req, res) => {
        const { message, phoneNumber } = req.body;

        if (!message || !phoneNumber) {
            return res.status(400).send('Faltan parámetros: "message" o "phoneNumber"');
        }

        try {
            // Formatear el número de teléfono para WhatsApp
            const formattedNumber = `${phoneNumber}@s.whatsapp.net`;

            // Enviar el mensaje usando el proveedor de Baileys
            await provider.sendText(formattedNumber, message);
            res.send('Mensaje enviado correctamente');
        } catch (error) {
            console.error('Error al enviar el mensaje:', error);
            res.status(500).send('Error al enviar el mensaje');
        }
    });

    // Ruta para servir el QR en /qr desde la carpeta 'Repositorio'
    app.get('/qr', (req, res) => {
        const qrPath = path.join(__dirname, 'Repositorio', 'bot.qr.png'); // Ruta correcta del archivo
        res.sendFile(qrPath);
    });

    // Escuchar en el puerto 3002
    app.listen(3002, () => {
        console.log('Servidor HTTP escuchando en el puerto 3002');
    });

    // Iniciar el bot
    await createBot({
        flow: createFlow([flowBienvenida, flowEstado]), // Agregar el nuevo flujo
        database: new MemoryDB(),
        provider,
    });
};

main();
