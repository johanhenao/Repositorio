import { addKeyword, createBot, createFlow, createProvider, MemoryDB } from "@bot-whatsapp/bot";
import { BaileysProvider } from '@bot-whatsapp/provider-baileys';
import express from 'express';

const flowBienvenida = addKeyword('Hola').addAnswer('Buenas, bienvenido');

const main = async () => {
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

    // Escuchar en el puerto 3002
    app.listen(3002, () => {
        console.log('Servidor HTTP escuchando en el puerto 3002');
    });

    // Iniciar el bot
    await createBot({
        flow: createFlow([flowBienvenida]),
        database: new MemoryDB(),
        provider
    });
};

main();
