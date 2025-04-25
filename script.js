// ==================== CONFIGURACIÓN INICIAL ====================
// Rotating Text Animation
const rotatingTexts = [
    "Siempre Funcionando", 
    "Sin Preocupaciones",
    "100% Garantizado"
];
let currentIndex = 0;

function rotateText() {
    currentIndex = (currentIndex + 1) % rotatingTexts.length;
    document.getElementById('rotating-text').textContent = rotatingTexts[currentIndex];
}
setInterval(rotateText, 3000);

// Firebase Configuration (USAR TUS CREDENCIALES)
const firebaseConfig = {
    apiKey: "AIzaSyAEmSj7LJFSOTHBJbN6rKZ1mxcXf0dfx3M",
    authDomain: "ziirtech.firebaseapp.com",
    projectId: "ziirtech",
    storageBucket: "ziirtech.appspot.com",
    messagingSenderId: "858886696245",
    appId: "1:858886696245:web:166760194a4a880d1bf07c",
    measurementId: "G-3WLB72Q34P"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==================== FUNCIONES DEL MODAL ====================
function openModal(serviceType) {
    const modal = document.getElementById('service-modal');
    const title = document.getElementById('modal-title');
    const description = document.getElementById('modal-description');
    
    switch(serviceType) {
        case 'preventivo':
            title.textContent = 'Mantenimiento Preventivo';
            description.textContent = 'Programa revisiones periódicas para evitar fallos. Incluye limpieza física y diagnóstico completo.';
            break;
        case 'correctivo':
            title.textContent = 'Soporte Correctivo';
            description.textContent = 'Solución de problemas técnicos en hardware o software. Reparación de componentes dañados.';
            break;
        case 'redes':
            title.textContent = 'Configuración de Redes';
            description.textContent = 'Diseño e implementación de redes seguras para hogares o negocios. Optimización de velocidad.';
            break;
    }
    
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('service-modal').style.display = 'none';
}

// ==================== MANEJO DE FORMULARIO ====================
async function saveRequest(serviceType, formData) {
    try {
        // Verificar/crear colección si no existe
        const colRef = db.collection("solicitudes");
        const snapshot = await colRef.limit(1).get();
        
        if (snapshot.empty) {
            await colRef.doc("inicio").set({
                creadoEl: new Date().toISOString(),
                proposito: "Solicitudes de clientes ZiirTech"
            });
        }

        // Guardar la solicitud
        const docRef = await colRef.add({
            servicio: serviceType,
            nombre: formData.nombre,
            email: formData.email,
            telefono: formData.telefono || 'No proporcionado',
            problema: formData.problema,
            fecha: firebase.firestore.FieldValue.serverTimestamp(),
            estado: "nuevo",
            origen: "Página Web"
        });
        
        console.log("✅ Documento guardado con ID:", docRef.id);
        return true;
        
    } catch (error) {
        console.error("❌ Error en Firebase:", error);
        
        // Fallback a WhatsApp
        const whatsappMsg = `*SOLICITUD DE EMERGENCIA*%0A%0A` +
            `*Servicio:* ${serviceType}%0A` +
            `*Nombre:* ${formData.nombre}%0A` +
            `*Teléfono:* ${formData.telefono || 'No proporcionado'}%0A` +
            `*Problema:* ${formData.problema}%0A` +
            `*Error Sistema:* ${error.message.substring(0, 50)}`;
        
        window.open(`https://wa.me/573103510752?text=${whatsappMsg}`, '_blank');
        return false;
    }
}

document.getElementById('service-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    const formData = {
        nombre: e.target[0].value,
        email: e.target[1].value,
        telefono: e.target[2].value,
        problema: e.target[3].value
    };

    const serviceType = document.getElementById('modal-title').textContent;
    
    const success = await saveRequest(serviceType, formData);
    
    if (success) {
        alert("✅ Solicitud enviada correctamente");
        closeModal();
        e.target.reset();
    } else {
        alert("⚠️ El sistema está ocupado. Ya enviamos tus datos por WhatsApp.");
    }
    
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Enviar Solicitud';
});

// ==================== VERIFICADOR DE ESTADO ====================
function checkStatus() {
    const clientId = document.getElementById('client-id').value.trim();
    const statusCard = document.getElementById('equipo-status');
    
    if (!clientId) {
        statusCard.innerHTML = `<p class="warning">⚠️ Por favor ingresa tu ID de cliente</p>`;
        return;
    }

    statusCard.innerHTML = `<p><i class="fas fa-spinner fa-spin"></i> Verificando estado...</p>`;
    
    // Simulación de verificación
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
}

// ==================== CHATBOT ====================
function openChat() {
    document.getElementById('chatbot').style.display = 'flex';
}

function closeChat() {
    document.getElementById('chatbot').style.display = 'none';
}

function sendMessage() {
    const input = document.getElementById('user-input');
    const messages = document.getElementById('chat-messages');
    
    if (input.value.trim() === '') return;
    
    // Mensaje del usuario
    const userMsg = document.createElement('div');
    userMsg.className = 'user-message';
    userMsg.textContent = input.value;
    messages.appendChild(userMsg);
    
    // Respuesta del bot después de 0.8s
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
}

// Enter key para el chatbot
document.getElementById('user-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// ==================== INICIALIZACIÓN ====================
console.log("ZiirTech System initialized");
