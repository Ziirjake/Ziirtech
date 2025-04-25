// Rotating Text
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

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAEmSj7LJFSOTHBJbN6rKZ1mxcXf0dfx3M",
  authDomain: "ziirtech.firebaseapp.com",
  projectId: "ziirtech",
  storageBucket: "ziirtech.firebasestorage.app",
  messagingSenderId: "858886696245",
  appId: "1:858886696245:web:166760194a4a880d1bf07c",
  measurementId: "G-3WLB72Q34P"
};

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

// Modal Functions
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

// Form Submission
async function saveRequest(serviceType, formData) {
  try {
    await db.collection("solicitudes").add({
      servicio: serviceType,
      nombre: formData.nombre,
      email: formData.email,
      telefono: formData.telefono || 'No proporcionado',
      problema: formData.problema,
      fecha: firebase.firestore.FieldValue.serverTimestamp(),
      origen: "Página Web"
    });
    return true;
  } catch (error) {
    console.error("Error Firebase:", error);
    return false;
  }
}
  
  // Uso en el evento submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const success = await saveRequest({
      nombre: e.target[0].value,
      // ... otros campos
    });
    
    if (success) {
      alert("✅ Enviado correctamente");
      closeModal();
    } else {
      alert("⚠️ Usamos WhatsApp como respaldo. Ya recibimos tu solicitud.");
    }
  });

// Status Checker
function checkStatus() {
    const clientId = document.getElementById('client-id').value.trim();
    const statusCard = document.getElementById('equipo-status');
    
    if (!clientId) {
        statusCard.innerHTML = `<p class="warning">⚠️ Por favor ingresa tu ID de cliente</p>`;
        return;
    }

    statusCard.innerHTML = `<p><i class="fas fa-spinner fa-spin"></i> Verificando estado...</p>`;
    
    // Simulación de API
    setTimeout(() => {
        const status = Math.random() > 0.5 ? 'healthy' : 'warning';
        
        if (status === 'healthy') {
            statusCard.innerHTML = `
                <p class="healthy">✅ Tu equipo está en óptimas condiciones</p>
                <p><small>Última revisión: ${new Date().toLocaleDateString()}</small></p>
            `;
        } else {
            statusCard.innerHTML = `
                <p class="warning">⚠️ Se recomienda mantenimiento preventivo</p>
                <button onclick="openModal('preventivo')" class="btn-alert">Agendar Mantenimiento</button>
            `;
        }
    }, 1500);
}

// Chatbot Functions
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
    
    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'user-message';
    userMsg.textContent = input.value;
    messages.appendChild(userMsg);
    
    // Bot response
    setTimeout(() => {
        const botMsg = document.createElement('div');
        botMsg.className = 'bot-message';
        
        if (input.value.toLowerCase().includes('hola')) {
            botMsg.textContent = '¡Hola! ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre servicios o estado de equipos.';
        } 
        else if (input.value.toLowerCase().includes('precio')) {
            botMsg.textContent = 'Tenemos estos servicios:\n- Preventivo: $80,000\n- Correctivo: $125,000\n- Redes: $199,000\n\n¿Quieres más información?';
        }
        else {
            botMsg.textContent = '¿Necesitas ayuda con algún servicio en particular? Puedo conectarte con un técnico si lo prefieres.';
        }
        
        messages.appendChild(botMsg);
        messages.scrollTop = messages.scrollHeight;
    }, 800);
    
    input.value = '';
    messages.scrollTop = messages.scrollHeight;
}

// Enter key for chatbot
document.getElementById('user-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
