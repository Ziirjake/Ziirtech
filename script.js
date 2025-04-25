// ============= [CONFIGURACIÓN INICIAL] =============
// Animación de texto rotativo
const rotatingTexts = ["Siempre Funcionando", "Sin Preocupaciones", "100% Garantizado"];
let currentIndex = 0;
setInterval(() => {
    currentIndex = (currentIndex + 1) % rotatingTexts.length;
    document.getElementById('rotating-text').textContent = rotatingTexts[currentIndex];
}, 3000);

// Configuración Firebase (USAR TUS CREDENCIALES)
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

// ============= [FUNCIONES DEL MODAL] =============
function openModal(serviceType) {
    const services = {
        preventivo: {
            title: "Mantenimiento Preventivo",
            desc: "Programa revisiones periódicas para evitar fallos."
        },
        correctivo: {
            title: "Soporte Correctivo",
            desc: "Solución de problemas técnicos en hardware/software."
        },
        redes: {
            title: "Configuración de Redes",
            desc: "Diseño e implementación de redes seguras."
        }
    };
    
    document.getElementById('modal-title').textContent = services[serviceType].title;
    document.getElementById('modal-description').textContent = services[serviceType].desc;
    document.getElementById('service-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('service-modal').style.display = 'none';
}

// ============= [MANEJO DE FORMULARIO] =============
async function saveRequest(serviceType, formData) {
    try {
        // 1. Intento guardar en Firebase
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
        console.error("❌ Error Firebase:", error);
        
        // 2. Fallback a WhatsApp
        const whatsappMsg = `*SOLICITUD (Error en sistema)*%0A` +
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

// ============= [VERIFICADOR DE ESTADO] =============
function checkStatus() {
    const clientId = document.getElementById('client-id').value.trim();
    const statusCard = document.getElementById('equipo-status');
    
    if (!clientId) {
        statusCard.innerHTML = '<p class="warning">⚠️ Ingresa tu ID de cliente</p>';
        return;
    }

    statusCard.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Verificando...</p>';
    
    setTimeout(() => {
        const statuses = [
            { type: 'healthy', msg: '✅ Equipo en óptimas condiciones' },
            { type: 'warning', msg: '⚠️ Necesita mantenimiento preventivo' },
            { type: 'critical', msg: '❌ Problema crítico detectado' }
        ];
        
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        statusCard.innerHTML = `<p class="${randomStatus.type}">${randomStatus.msg}</p>`;
        
        if (randomStatus.type !== 'healthy') {
            statusCard.innerHTML += `
                <button onclick="${randomStatus.type === 'warning' 
                    ? "openModal('preventivo')" 
                    : "window.open('https://wa.me/573103510752')"}" 
                class="btn-alert">
                    ${randomStatus.type === 'warning' ? 'Agendar Mantenimiento' : 'Soporte Urgente'}
                </button>`;
        }
    }, 1500);
}

// ============= [CHATBOT] =============
const chat = {
    open: () => document.getElementById('chatbot').style.display = 'flex',
    close: () => document.getElementById('chatbot').style.display = 'none',
    send: () => {
        const input = document.getElementById('user-input');
        if (!input.value.trim()) return;
        
        const messages = document.getElementById('chat-messages');
        messages.innerHTML += `<div class="user-message">${input.value}</div>`;
        
        setTimeout(() => {
            const responses = {
                hola: "¡Hola! Soy Zii, ¿en qué puedo ayudarte?",
                precio: "🔹 <b>Preventivo:</b> $80,000<br>🔹 <b>Correctivo:</b> $125,000<br>🔹 <b>Redes:</b> $199,000",
                contacto: "📞 <b>Teléfono:</b> 310 3510752<br>💬 <b>WhatsApp:</b> <a href='https://wa.me/573103510752'>Click aquí</a>",
                default: "¿Necesitas ayuda con algún servicio en particular?"
            };
            
            const userText = input.value.toLowerCase();
            messages.innerHTML += `<div class="bot-message">${
                userText.includes('hola') ? responses.hola :
                userText.includes('precio') ? responses.precio :
                userText.includes('contacto') ? responses.contacto :
                responses.default
            }</div>`;
            
            messages.scrollTop = messages.scrollHeight;
        }, 800);
        
        input.value = '';
        messages.scrollTop = messages.scrollHeight;
    }
};

// Eventos
document.getElementById('user-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') chat.send();
});

// ============= [INICIALIZACIÓN] =============
console.log("ZiirTech System v3.0 - Ready");
