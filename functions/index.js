// Importar y configurar dotenv en la PRIMERA LÍNEA
require('dotenv').config();

// Importar los módulos necesarios de la nueva manera (v2)
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const logger = require("firebase-functions/logger");

const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

// Inicializar Firebase y SendGrid
admin.initializeApp();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Es una buena práctica definir la región de tus funciones
setGlobalOptions({ region: "us-central1" });

// Esta es la nueva sintaxis para una función que se activa al crear un documento
exports.newServiceRequestNotification = onDocumentCreated("solicitudes/{solicitudId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        logger.log("No hay datos asociados con el evento, saliendo.");
        return;
    }
    const newRequest = snapshot.data();

    const msg = {
        to: "ziirtech.72001233@gmail.com",
        from: {
            name: "ZiirTech Notificaciones",
            email: "ziirtech.72001233@gmail.com",
        },
        subject: `Nueva Solicitud de Servicio: ${newRequest.servicio}`,
        html: `
          <h1>¡Nueva solicitud recibida!</h1>
          <p>Has recibido una nueva solicitud de servicio a través de tu página web.</p>
          <hr>
          <h3>Detalles del Cliente:</h3>
          <ul>
            <li><strong>Nombre:</strong> ${newRequest.nombre}</li>
            <li><strong>Email:</strong> ${newRequest.email}</li>
            <li><strong>Teléfono:</strong> ${newRequest.telefono}</li>
            <li><strong>ID de Cliente:</strong> ${newRequest.idCliente}</li>
          </ul>
          <h3>Detalles del Servicio:</h3>
          <ul>
            <li><strong>Tipo de Equipo:</strong> ${newRequest.tipoEquipo}</li>
            <li><strong>Modelo:</strong> ${newRequest.modeloEquipo}</li>
            <li><strong>Problema descrito:</strong></li>
            <p>${newRequest.problema}</p>
          </ul>
          <hr>
          <p>Puedes ver esta solicitud en tu panel de empleados.</p>
        `,
    };

    try {
        logger.info("Enviando correo de notificación...");
        await sgMail.send(msg);
        logger.info("Correo de notificación enviado exitosamente a:", msg.to);
    } catch (error) {
        logger.error("Error al enviar el correo:", error);
        if (error.response) {
            logger.error(error.response.body);
        }
    }
});