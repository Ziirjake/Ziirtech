// ============= [CONFIGURACIÓN INICIAL] =============
// Animación de texto rotativo
const rotatingTexts = ["Siempre Funcionando", "Sin Preocupaciones", "100% Garantizado"];
let currentIndex = 0;
setInterval(() => {
    currentIndex = (currentIndex + 1) % rotatingTexts.length;
    document.getElementById('rotating-text').textContent = rotatingTexts[currentIndex];
}, 3000);

// Configuración Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAEmSj7LJFSOTHBJbN6rKZ1mxcXf0dfx3M",
    authDomain: "ziirtech.firebaseapp.com",
    projectId: "ziirtech",
    storageBucket: "ziirtech.appspot.com",
    messagingSenderId: "858886696245",
    appId: "1:858886696245:web:166760194a4a880d1bf07c"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ============= [FUNCIONES GLOBALES] =============
window.openModal = function(serviceType) {
    const services = {
        preventivo: {
            title: "Mantenimiento Preventivo",
            desc: "Programa revisiones periódicas para evitar fallos. Incluye limpieza física y diagnóstico completo."
        },
        correctivo: {
            title: "Soporte Correctivo", 
            desc: "Solución de problemas técnicos en hardware o software. Reparación de componentes dañados."
        },
        redes: {
            title: "Configuración de Redes",
            desc: "Diseño e implementación de redes seguras para hogares o negocios. Optimización de velocidad."
        }
    };
    
    document.getElementById('modal-title').textContent = services[serviceType].title;
    document.getElementById('modal-description').textContent = services[serviceType].desc;
    document.getElementById('service-modal').style.display = 'flex';
};

window.closeModal = function() {
    document.getElementById('service-modal').style.display = 'none';
};

window.checkStatus = async function() {
    const clientId = document.getElementById('client-id').value.trim();
    const statusCard = document.getElementById('equipo-status');
    
    if (!clientId) {
        statusCard.innerHTML = '<p class="warning">⚠️ Ingresa tu ID de cliente</p>';
        return;
    }

    statusCard.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Verificando...</p>';
    
    try {
        // Buscar en ambas colecciones
        const [solicitudDoc, equipoDoc] = await Promise.all([
            db.collection("solicitudes").where("idCliente", "==", clientId).limit(1).get(),
            db.collection("equipos").doc(clientId).get()
        ]);
        
        let statusHTML = '';
        
        // Mostrar información de equipo si existe
        if (equipoDoc.exists) {
            const equipo = equipoDoc.data();
            statusHTML += `
                <h3>Estado del Equipo</h3>
                <p><strong>Cliente:</strong> ${equipo.clientName}</p>
                <p><strong>Equipo:</strong> ${equipo.equipmentType} - ${equipo.equipmentBrand}</p>
                <p class="${equipo.status}">🛠️ Estado: ${getStatusText(equipo.status)}</p>
                ${equipo.technicianNotes ? `<p><strong>Notas:</strong> ${equipo.technicianNotes}</p>` : ''}
            `;
        }
        
        // Mostrar información de solicitud si existe
        if (!solicitudDoc.empty) {
            const solicitud = solicitudDoc.docs[0].data();
            statusHTML += `
                <h3>Solicitud de Servicio</h3>
                <p><strong>Servicio:</strong> ${solicitud.servicio}</p>
                <p><strong>Estado:</strong> ${solicitud.estado}</p>
                <p><strong>Fecha:</strong> ${solicitud.fecha?.toDate().toLocaleDateString('es-CO') || 'No especificada'}</p>
            `;
        }
        
        if (!equipoDoc.exists && solicitudDoc.empty) {
            statusHTML = '<p class="warning">⚠️ No se encontró información para este ID</p>';
        }
        
        statusCard.innerHTML = statusHTML;
        
    } catch (error) {
        console.error("Error al verificar estado:", error);
        statusCard.innerHTML = '<p class="critical">❌ Error al consultar el estado</p>';
    }
};

// Función auxiliar para traducir estados
function getStatusText(status) {
    const statusMap = {
        'diagnostico': 'En Diagnóstico',
        'reparacion': 'En Reparación',
        'pruebas': 'En Pruebas Finales',
        'listo': 'Listo para Recoger'
    };
    return statusMap[status] || status;
}

// ============= [MANEJO DE FORMULARIO] =============
async function saveRequest(serviceType, formData) {
    try {
        const docRef = await db.collection("solicitudes").add({
            servicio: serviceType,
            nombre: formData.nombre,
            email: formData.email,
            telefono: formData.telefono || 'No proporcionado',
            problema: formData.problema,
            fecha: firebase.firestore.FieldValue.serverTimestamp(),
            estado: "nuevo"
        });
        
        console.log("✅ Solicitud guardada ID:", docRef.id);
        return true;
        
    } catch (error) {
        console.error("❌ Error en Firebase:", error);
        
        // Fallback a WhatsApp
        const whatsappMsg = `*SOLICITUD DE EMERGENCIA*%0A` + 
            `Servicio: ${serviceType}%0A` +
            `Nombre: ${formData.nombre}%0A` +
            `Tel: ${formData.telefono || 'No proporcionado'}%0A` +
            `Problema: ${formData.problema}`;
        
        window.open(`https://wa.me/573103510752?text=${whatsappMsg}`, '_blank');
        return false;
    }
}

document.getElementById('service-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    const result = await saveRequest(
        document.getElementById('modal-title').textContent,
        {
            nombre: e.target[0].value,
            email: e.target[1].value,
            telefono: e.target[2].value,
            problema: e.target[3].value
        }
    );

    if (result) {
        alert("✅ Solicitud enviada correctamente");
        closeModal();
        e.target.reset();
    } else {
        alert("⚠️ Se redirigió a WhatsApp por seguridad");
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Enviar Solicitud';
});

// ============= [CHATBOT] =============
window.openChat = function() {
    document.getElementById('chatbot').style.display = 'flex';
};

window.closeChat = function() {
    document.getElementById('chatbot').style.display = 'none';
};

window.sendMessage = function() {
    const input = document.getElementById('user-input');
    const messages = document.getElementById('chat-messages');
    
    if (!input.value.trim()) return;
    
    // Mensaje del usuario
    const userMsg = document.createElement('div');
    userMsg.className = 'user-message';
    userMsg.textContent = input.value;
    messages.appendChild(userMsg);
    
    // Respuesta del bot
    setTimeout(() => {
        const botMsg = document.createElement('div');
        botMsg.className = 'bot-message';
        const userText = input.value.toLowerCase();
        
        if (userText.includes('hola') || userText.includes('buenas')) {
            botMsg.innerHTML = `¡Hola! Soy Zii, el asistente de ZiirTech. ¿En qué puedo ayudarte hoy?<br>
                               Puedes preguntarme sobre:<br>
                               - Servicios<br>
                               - Precios<br>
                               - Estado de tu equipo`;
        } 
        else if (userText.includes('precio') || userText.includes('cuesta')) {
            botMsg.innerHTML = `Nuestros servicios:<br>
                               <b>• Mantenimiento Preventivo:</b> $80,000<br>
                               <b>• Soporte Correctivo:</b> Desde $125,000<br>
                               <b>• Configuración de Redes:</b> Desde $199,000`;
        }
        else if (userText.includes('contacto') || userText.includes('whatsapp')) {
            botMsg.innerHTML = `Puedes contactarnos por:<br>
                               <b>📞 Teléfono:</b> 310 3510752<br>
                               <b>📧 Email:</b> ziirtech.72001233@gmail.com<br>
                               <b>💬 WhatsApp:</b> <a href="https://wa.me/573103510752" target="_blank">Haz clic aquí</a>`;
        }
        else {
            botMsg.textContent = 'No entendí tu pregunta. ¿Puedes ser más específico? O si prefieres, te conecto con un técnico.';
        }
        
        messages.appendChild(botMsg);
        messages.scrollTop = messages.scrollHeight;
    }, 800);
    
    input.value = '';
    messages.scrollTop = messages.scrollHeight;
};

// Enter key para el chatbot
document.getElementById('user-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});


if (window.location.href.includes('admin')) {
    const adminLink = document.createElement('a');
    adminLink.href = 'empleados/login.html';
    adminLink.textContent = 'Panel Empleados';
    adminLink.className = 'btn-employee';
    document.querySelector('nav').appendChild(adminLink);

}

// ============= [INICIALIZACIÓN] =============
console.log("ZiirTech System v3.1 - Fully Operational");
