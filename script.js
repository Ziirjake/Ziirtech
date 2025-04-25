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

window.checkStatus = function() {
    const clientId = document.getElementById('client-id').value.trim();
    const statusCard = document.getElementById('equipo-status');
    
    if (!clientId) {
        statusCard.innerHTML = '<p class="warning">⚠️ Ingresa tu ID de cliente</p>';
        return;
    }

    statusCard.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Verificando...</p>';
    
    setTimeout(() => {
        const status = Math.random() > 0.3 ? 'healthy' : 
                      Math.random() > 0.5 ? 'warning' : 'critical';
        
        if (status === 'healthy') {
            statusCard.innerHTML = `
                <p class="healthy">✅ Tu equipo está en óptimas condiciones</p>
                <p><small>Última revisión: ${new Date().toLocaleDateString('es-CO')}</small></p>
            `;
        } else if (status === 'warning') {
            statusCard.innerHTML = `
                <p class="warning">⚠️ Se recomienda mantenimiento preventivo</p>
                <button onclick="openModal('preventivo')" class="btn-alert">Agendar Mantenimiento</button>
            `;
        } else {
            statusCard.innerHTML = `
                <p class="critical">❌ Problema crítico detectado</p>
                <a href="https://wa.me/573103510752" class="btn-alert">Soporte Urgente</a>
            `;
        }
    }, 1500);
};

// ============= [MANEJO DE FORMULARIO] =============
async function saveRequest(serviceType, formData) {
    try {
        const requestData = {
            servicio: serviceType,
            nombre: formData.nombre,
            email: formData.email,
            telefono: formData.telefono || 'No proporcionado',
            problema: formData.problema,
            fecha: firebase.firestore.FieldValue.serverTimestamp(),
            estado: "nuevo"
        };

        console.log("📤 Enviando datos a Firestore:", requestData);

        const docRef = await db.collection("solicitudes").add(requestData);
        console.log("✅ Solicitud guardada con ID:", docRef.id);
        return true;

    } catch (error) {
        console.error("❌ Error al guardar en Firestore:", error);
        alert("Hubo un error al enviar el formulario. Se redirigirá a WhatsApp.");
        
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

// ============= [INICIALIZACIÓN] =============
console.log("ZiirTech System v3.2 - Fully Operational");
