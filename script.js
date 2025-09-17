// =============================
// Variables y Objetos Globales
// =============================
const services = {
    preventivo: {
        title: "Mantenimiento Preventivo",
        desc: "Programa revisiones periódicas para evitar fallos. Incluye limpieza física y diagnóstico completo.",
        icon: "fas fa-shield-alt"
    },
    correctivo: {
        title: "Soporte Correctivo",
        desc: "Solución de problemas técnicos en hardware o software. Reparación de componentes dañados.",
        icon: "fas fa-tools"
    },
    apps: {
        title: "Instalación de Apps",
        desc: "Instalación y configuración de aplicaciones según tus necesidades.",
        icon: "fas fa-download"
    }
};

// =============================
// Navbar responsive
// =============================
document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('navbar').classList.toggle('active');
});

// =============================
// Animar progress bars
// =============================
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.progress-bar').forEach(bar => {
        const value = bar.getAttribute('data-progress');
        const fill = document.createElement('div');
        fill.classList.add('fill');
        bar.appendChild(fill);
        setTimeout(() => {
            fill.style.width = value + '%';
        }, 300);
    });
});

// =============================
// Función para mostrar notificaciones
// =============================
function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        notification.addEventListener('transitionend', () => notification.remove());
    }, 5000);
}

// =============================
// Modal
// =============================
window.openModal = function(serviceType) {
    const modal = document.getElementById('service-modal');
    const modalTitle = document.getElementById('modal-title');
    const service = services[serviceType];

    if (!service) {
        console.error("Tipo de servicio no válido:", serviceType);
        return;
    }

    modalTitle.dataset.serviceType = serviceType;
    modalTitle.innerHTML = `<i class="${service.icon}"></i> ${service.title}`;
    document.getElementById('modal-description').textContent = service.desc;
    
    modal.style.display = 'flex';
};

window.closeModal = function() {
    document.getElementById('service-modal').style.display = 'none';
};

window.addEventListener("click", e => {
    if (e.target === document.getElementById("service-modal")) {
        closeModal();
    }
});

// =============================
// Lógica del Formulario
// =============================
document.getElementById('service-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const serviceType = document.getElementById('modal-title').dataset.serviceType;
    if (!serviceType) {
        showNotification("Error: No se ha seleccionado un servicio.", "error");
        return;
    }
    
    const serviceTitle = services[serviceType].title;
    
    const nombre = this.querySelector('input[type="text"]').value;
    const email = this.querySelector('input[type="email"]').value;
    const telefono = this.querySelector('input[type="tel"]').value;
    const problema = this.querySelector('textarea').value;
    
    const submitBtn = this.querySelector('button[type="submit"]');

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        
        const idCliente = await guardarSolicitud(nombre, email, telefono, problema, serviceTitle);
        
        if (idCliente) {
            showNotification(`¡Solicitud enviada! Tu ID de seguimiento es: ${idCliente}`);
            closeModal();
            this.reset();
        } else {
            throw new Error("No se pudo obtener el ID de cliente");
        }
    } catch (error) {
        console.error("Error al enviar el formulario:", error);
        showNotification("Error al enviar la solicitud. Intenta nuevamente.", "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Enviar Solicitud';
    }
});


async function guardarSolicitud(nombre, email, telefono, problema, servicio) {
    try {
        const tipoEquipo = document.getElementById('equipment-type').value;
        const modeloEquipo = document.getElementById('equipment-model').value;
        const idCliente = 'ZT-' + Date.now().toString().slice(-6);
        
        const keywords = [
            idCliente.toLowerCase(),
            nombre.toLowerCase(),
            email.toLowerCase(),
            tipoEquipo.toLowerCase(),
            modeloEquipo.toLowerCase(),
            ...problema.toLowerCase().split(/\s+/),
            ...servicio.toLowerCase().split(/\s+/)
        ].filter(k => k.length > 2);
        
        const solicitudData = {
            nombre, email, telefono, problema, servicio,
            tipoEquipo, modeloEquipo, idCliente, keywords,
            fecha: firebase.firestore.FieldValue.serverTimestamp(),
            estado: "pendiente"
        };
        
        await db.collection('solicitudes').doc(idCliente).set(solicitudData);
        return idCliente;
    } catch (error) {
        console.error("Error al guardar solicitud:", error);
        return false;
    }
}

// =============================
// Estado del Equipo (FUNCIÓN MEJORADA)
// =============================
window.checkStatus = async function() {
    const id = document.getElementById("client-id").value.trim().toUpperCase();
    const statusResultDiv = document.getElementById("equipo-status-result");
    const checkBtn = document.querySelector('.status-card button');

    statusResultDiv.innerHTML = ''; 

    if (!id) {
        statusResultDiv.innerHTML = `<p class="warning">⚠️ Debes ingresar un ID válido</p>`;
        return;
    }

    checkBtn.disabled = true;
    checkBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';

    try {
        const doc = await db.collection('solicitudes').doc(id).get();
        
        if (!doc.exists) {
            statusResultDiv.innerHTML = `<p class="warning">⚠️ No se encontró una solicitud con el ID ${id}</p>`;
            return;
        }
        
        const solicitud = doc.data();
        const estado = solicitud.estado || 'pendiente';
        const fecha = solicitud.fecha?.toDate().toLocaleDateString('es-CO') || 'fecha no disponible';
        
        let mensaje, clase;
        switch(estado) {
            case 'pendiente':
                mensaje = "🔍 Solicitud recibida - En espera de revisión";
                clase = "warning";
                break;
            case 'En proceso':
                mensaje = `🛠️ Equipo en proceso ${solicitud.equipoAsignado ? '(ID Servicio: ' + solicitud.equipoAsignado + ')' : ''}`;
                clase = "warning";
                break;
            case 'completado':
                mensaje = "✅ Reparación completada - Listo para entrega";
                clase = "healthy";
                break;
            default:
                mensaje = `Estado: ${estado}`;
                clase = "";
        }
        
        statusResultDiv.innerHTML = `
            <h4>Resultado para ${solicitud.idCliente}</h4>
            <p class="status-message ${clase}">${mensaje}</p>
            <p><small>Cliente: ${solicitud.nombre}</small></p>
            <p><small>Fecha de solicitud: ${fecha}</small></p>
            ${solicitud.tecnicoAsignado ? `<p><small>Técnico asignado: ${solicitud.tecnicoAsignado.split('@')[0]}</small></p>` : ''}
        `;
        
    } catch (error) {
        console.error("Error al consultar estado:", error);
        statusResultDiv.innerHTML = `<p class="error">Error al consultar el estado. Intenta nuevamente.</p>`;
    } finally {
        checkBtn.disabled = false;
        checkBtn.innerHTML = 'Verificar';
    }
};

// =============================
// Chatbot
// =============================
window.openChat = function() {
    document.getElementById("chatbot").style.display = "flex";
};

window.closeChat = function() {
    document.getElementById("chatbot").style.display = "none";
};

window.sendMessage = function() {
    const input = document.getElementById("user-input");
    const msg = input.value.trim();
    if (!msg) return;

    const chat = document.getElementById("chat-messages");

    const userMsg = document.createElement("div");
    userMsg.className = "user-message";
    userMsg.textContent = msg;
    chat.appendChild(userMsg);

    const botMsg = document.createElement("div");
    botMsg.className = "bot-message";

    if (msg.toLowerCase().includes("precio")) {
        botMsg.textContent = "💰 Los precios dependen del servicio:\n- Preventivo desde $70.000\n- Correctivo desde $115.000\n- Instalación de apps desde $25.000";
    } else if (msg.toLowerCase().includes("contacto")) {
        botMsg.textContent = "📞 Puedes contactarnos:\n- Teléfono: 310 3510752\n- WhatsApp: https://wa.me/573103510752\n- Email: ziirtech.72001233@gmail.com";
    } else if (msg.toLowerCase().includes("estado") || msg.toLowerCase().includes("solicitud")) {
        botMsg.textContent = "🔍 Para consultar el estado de tu equipo:\n1. Ve a la sección 'Estado de Tu Equipo'\n2. Ingresa tu ID de cliente (ej: ZT-123456)\n3. Haz clic en 'Verificar'";
    } else if (msg.toLowerCase().includes("tiempo") || msg.toLowerCase().includes("demora")) {
        botMsg.textContent = "⏱️ Los tiempos aproximados son:\n- Diagnóstico: 24-48 horas\n- Reparaciones simples: 3-5 días\n- Reparaciones complejas: 1-2 semanas";
    } else {
        botMsg.textContent = "🤖 Soy ZiirBot, puedo ayudarte con:\n- Información de servicios y precios\n- Consultar estado de tu equipo\n- Datos de contacto\n- Tiempos de reparación";
    }

    chat.appendChild(botMsg);
    chat.scrollTop = chat.scrollHeight;

    input.value = "";
};

// ===============================================================
// NUEVO SCRIPT AÑADIDO
// ===============================================================

// Lógica para el texto rotativo
const rotatingTextElement = document.getElementById('rotating-text');
const words = ['Funcionando', 'Protegida', 'Optimizada'];
let currentIndex = 0;

setInterval(() => {
    currentIndex = (currentIndex + 1) % words.length;
    rotatingTextElement.innerHTML = `<span>${words[currentIndex]}</span>`;
}, 4000);