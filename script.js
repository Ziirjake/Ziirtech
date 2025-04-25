// ================ [CONFIGURACIÓN INICIAL] ================
// Animación de texto rotativo
const rotatingTexts = ["Siempre Funcionando", "Sin Preocupaciones", "100% Garantizado"];
let currentIndex = 0;
const rotateText = () => {
    currentIndex = (currentIndex + 1) % rotatingTexts.length;
    document.getElementById('rotating-text').textContent = rotatingTexts[currentIndex];
};
setInterval(rotateText, 3000);

// Configuración Firebase (Actualiza con tus credenciales)
const firebaseConfig = {
    apiKey: "AIzaSyAEmSj7LJFSOTHBJbN6rKZ1mxcXf0dfx3M",
    authDomain: "ziirtech.firebaseapp.com",
    projectId: "ziirtech",
    storageBucket: "ziirtech.appspot.com",
    messagingSenderId: "858886696245",
    appId: "1:858886696245:web:166760194a4a880d1bf07c"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ================ [FUNCIONES PRINCIPALES] ================
// Manejo del Modal
const modalActions = {
    open: (serviceType) => {
        const services = {
            preventivo: {
                title: "Mantenimiento Preventivo",
                desc: "Revisiones periódicas para evitar fallos. Incluye limpieza física y diagnóstico completo."
            },
            correctivo: {
                title: "Soporte Correctivo", 
                desc: "Solución de problemas técnicos en hardware/software. Reparación de componentes."
            },
            redes: {
                title: "Configuración de Redes",
                desc: "Diseño e implementación de redes seguras para hogares/negocios."
            }
        };
        
        document.getElementById('modal-title').textContent = services[serviceType].title;
        document.getElementById('modal-description').textContent = services[serviceType].desc;
        document.getElementById('service-modal').style.display = 'flex';
    },
    close: () => document.getElementById('service-modal').style.display = 'none'
};

// Sistema de Solicitudes
const requestManager = {
    send: async (serviceType, formData) => {
        try {
            const docRef = await db.collection("solicitudes").add({
                servicio: serviceType,
                ...formData,
                fecha: firebase.firestore.FieldValue.serverTimestamp(),
                estado: "nuevo",
                origen: "Página Web"
            });
            console.log("Solicitud registrada ID:", docRef.id);
            return true;
        } catch (error) {
            console.error("Error en Firebase:", error);
            window.open(`https://wa.me/573103510752?text=*SOLICITUD*%0AServicio: ${serviceType}%0ANombre: ${formData.nombre}%0AProblema: ${formData.problema}`, '_blank');
            return false;
        }
    }
};

// ================ [EVENT LISTENERS] ================
// Formulario
document.getElementById('service-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    const success = await requestManager.send(
        document.getElementById('modal-title').textContent,
        {
            nombre: e.target[0].value,
            email: e.target[1].value,
            telefono: e.target[2].value || 'No proporcionado',
            problema: e.target[3].value
        }
    );

    if (success) {
        alert("✅ Solicitud enviada correctamente");
        modalActions.close();
        e.target.reset();
    } else {
        alert("⚠️ Redirigiendo a WhatsApp para atención inmediata");
    }

    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Enviar Solicitud';
});

// Verificador de Estado
document.querySelector('#estado button').addEventListener('click', () => {
    const clientId = document.getElementById('client-id').value.trim();
    const statusCard = document.getElementById('equipo-status');
    
    if (!clientId) {
        statusCard.innerHTML = '<p class="warning">⚠️ Ingresa tu ID de cliente</p>';
        return;
    }

    statusCard.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Verificando...</p>';
    
    setTimeout(() => {
        const status = Math.random() > 0.3 ? 'healthy' : Math.random() > 0.5 ? 'warning' : 'critical';
        statusCard.innerHTML = status === 'healthy' 
            ? '<p class="healthy">✅ Equipo en óptimas condiciones</p>'
            : `<p class="${status}">${status === 'warning' ? '⚠️' : '❌'} ${
                status === 'warning' 
                    ? 'Necesita mantenimiento preventivo' 
                    : 'Problema crítico detectado'
              }</p>
              <button onclick="${status === 'warning' ? "modalActions.open('preventivo')" : 'window.open(\'https://wa.me/573103510752\')'}" 
                      class="btn-alert">
                  ${status === 'warning' ? 'Agendar Mantenimiento' : 'Soporte Urgente'}
              </button>`;
    }, 1500);
});

// Chatbot
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
                hola: "¡Hola! Soy Zii, ¿en qué puedo ayudarte? Pregúntame sobre servicios, precios o estado de equipos.",
                precio: "🔹 <b>Mantenimiento Preventivo:</b> $80,000<br>🔹 <b>Soporte Correctivo:</b> Desde $125,000<br>🔹 <b>Redes:</b> Desde $199,000",
                contacto: "📞 <b>Teléfono:</b> 310 3510752<br>📧 <b>Email:</b> ziirtech.72001233@gmail.com<br>💬 <b>WhatsApp:</b> <a href='https://wa.me/573103510752' target='_blank'>Haz clic aquí</a>",
                default: "¿Necesitas ayuda con algún servicio en particular? Te puedo conectar con un técnico."
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

// Eventos del Chatbot
document.getElementById('user-input').addEventListener('keypress', (e) => e.key === 'Enter' && chat.send());

// ================ [INICIALIZACIÓN] ================
console.log("ZiirTech System v2.0 initialized");
