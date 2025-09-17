// ============= [Variables Globales] =============
let currentEquipmentId = null;
let currentUser = null;
let selectedRequestId = null;

// ============= [Funciones de Autenticación] =============
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('login-form')) {
        initLoginPage();
    } else if (document.getElementById('logout-btn')) {
        initDashboard();
    }
});

function initLoginPage() {
    const loginForm = document.getElementById('login-form');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorElement = document.getElementById('login-error');
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
            
            const userCredential = await auth.signInWithEmailAndPassword(
                username.includes('@') ? username : `${username}@ziirtech.com`,
                password
            );
            
            window.location.href = 'dashboard.html';
            
        } catch (error) {
            console.error("Error de autenticación:", error);
            let errorMessage = "Error al iniciar sesión. Intenta nuevamente.";
            if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
                errorMessage = "Usuario o contraseña incorrectos";
            } else if (error.code === "auth/invalid-email") {
                errorMessage = "Formato de email inválido";
            } else if (error.code === "auth/too-many-requests") {
                errorMessage = "Demasiados intentos fallidos. Intenta más tarde.";
            }
            errorElement.textContent = errorMessage;
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Ingresar';
        }
    });
}

function initDashboard() {
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            currentUser = user;
            document.getElementById('employee-name').textContent = user.email.split('@')[0];
            loadPendingRequests();
            loadEquipmentList();
            setupEventListeners();
        }
    });
    
    document.getElementById('logout-btn').addEventListener('click', () => {
        auth.signOut().then(() => window.location.href = 'login.html');
    });
}


// ============= [Carga de Solicitudes y Equipos] =============
async function loadPendingRequests() {
    const listContainer = document.getElementById('pending-requests-list');
    listContainer.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Cargando solicitudes pendientes...</p>';

    try {
        const querySnapshot = await db.collection('solicitudes')
            .where('estado', '==', 'pendiente')
            .orderBy('fecha', 'asc')
            .get();

        if (querySnapshot.empty) {
            listContainer.innerHTML = '<p>🎉 ¡Excelente! No hay solicitudes pendientes.</p>';
            return;
        }

        listContainer.innerHTML = '';
        querySnapshot.forEach(doc => {
            const request = doc.data();
            const card = document.createElement('div');
            card.className = 'request-card';
            card.innerHTML = `
                <h4>${request.nombre}</h4>
                <span class="service-tag">${request.servicio}</span>
                <p><strong>Problema:</strong> ${request.problema.substring(0, 100)}${request.problema.length > 100 ? '...' : ''}</p>
                <button class="btn-assign" data-request-id="${doc.id}">
                    <i class="fas fa-arrow-circle-down"></i> Asignar para Registro
                </button>
            `;
            listContainer.appendChild(card);
        });

        document.querySelectorAll('.btn-assign').forEach(button => {
            button.addEventListener('click', async function() {
                const requestId = this.dataset.requestId;
                const requestDoc = await db.collection('solicitudes').doc(requestId).get();
                if (requestDoc.exists) {
                    populateEquipmentForm(requestDoc.data(), requestId);
                }
            });
        });

    } catch (error) {
        console.error("Error al cargar solicitudes pendientes:", error);
        listContainer.innerHTML = '<p class="error">Error al cargar las solicitudes. Intenta recargar la página.</p>';
    }
}

function populateEquipmentForm(solicitud, requestId) {
    selectedRequestId = requestId;
    document.getElementById('service-id').value = solicitud.idCliente;
    document.getElementById('client-name').value = solicitud.nombre;
    document.getElementById('problem-description').value = solicitud.problema;

    if (solicitud.tipoEquipo) {
        document.getElementById('equipment-type').value = solicitud.tipoEquipo;
    }
    if (solicitud.modeloEquipo) {
        document.getElementById('equipment-brand').value = solicitud.modeloEquipo;
    }
    
    const formSection = document.getElementById('equipment-form');
    formSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function loadEquipmentList(filterStatus = 'all') {
    const equipmentList = document.getElementById('equipment-list');
    equipmentList.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Cargando equipos...</p>';
    
    try {
        let query = db.collection('equipos').orderBy('updatedAt', 'desc');
        
        if (filterStatus === 'all') {
            query = query.where('status', 'in', ['diagnostico', 'reparacion', 'pruebas', 'listo']);
        } else {
            query = query.where('status', '==', filterStatus);
        }
        
        const snapshot = await query.get();
        if (snapshot.empty) {
            if (filterStatus === 'all') {
                equipmentList.innerHTML = '<p>No hay equipos activos. Puedes ver los trabajos completados en el filtro "Historial".</p>';
            } else {
                equipmentList.innerHTML = `<p>No se encontraron equipos en la categoría "${getStatusText(filterStatus)}".</p>`;
            }
            return;
        }
        
        equipmentList.innerHTML = '';
        snapshot.forEach(doc => {
            const equipment = doc.data();
            const statusText = getStatusText(equipment.status);
            
            let actionButtons = `
                <button class="update-btn" data-id="${equipment.serviceId}">
                    <i class="fas fa-edit"></i> Actualizar Estado
                </button>
            `;

            if (equipment.status === 'listo') {
                actionButtons += `
                    <button class="btn-archive" data-id="${equipment.serviceId}">
                        <i class="fas fa-archive"></i> Finalizar y Archivar
                    </button>
                `;
            }

            const card = document.createElement('div');
            card.className = `equipment-card ${equipment.status === 'finalizado' ? 'finalizado' : ''}`;
            card.innerHTML = `
                <div class="equipment-id">ID: ${equipment.serviceId}</div>
                <div class="equipment-client">Cliente: ${equipment.clientName}</div>
                <div class="equipment-type">${equipment.equipmentType} - ${equipment.equipmentBrand}</div>
                <div class="equipment-status">
                    <span class="status-badge ${equipment.status}">${statusText}</span>
                    <span class="status-date">${equipment.updatedAt?.toDate().toLocaleDateString('es-CO') || ''}</span>
                </div>
                <p class="problem-description">${equipment.problemDescription}</p>
                <div class="card-actions">
                    ${actionButtons}
                </div>
            `;
            equipmentList.appendChild(card);
        });
        
        document.querySelectorAll('.update-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                openStatusModal(this.dataset.id);
            });
        });

        document.querySelectorAll('.btn-archive').forEach(btn => {
            btn.addEventListener('click', function() {
                const equipmentId = this.dataset.id;
                const clientName = this.closest('.equipment-card').querySelector('.equipment-client').textContent;

                if (confirm(`¿Estás seguro de que quieres finalizar y archivar el equipo de ${clientName}?\n\nEsta acción moverá el registro al historial.`)) {
                    archiveEquipment(equipmentId);
                }
            });
        });
        
    } catch (error) {
        console.error("Error al cargar equipos:", error);
        equipmentList.innerHTML = '<p class="error">Error al cargar los equipos. Intenta recargar la página.</p>';
    }
}

async function archiveEquipment(equipmentId) {
    try {
        await db.collection('equipos').doc(equipmentId).update({
            status: 'finalizado',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        const activeFilter = document.querySelector('.status-filter.active').dataset.status;
        loadEquipmentList(activeFilter); 
    } catch (error) {
        console.error("Error al archivar el equipo:", error);
        alert("Hubo un error al intentar archivar el equipo.");
    }
}


// ============= [Funciones Auxiliares para WhatsApp] =============
function cleanPhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') return null;
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('57')) {
        return cleaned;
    }
    if (cleaned.length === 10) {
        return '57' + cleaned;
    }
    return null;
}

function getStatusUpdateMessage(status, clientName) {
    const name = clientName.split(' ')[0];
    let message = `¡Hola ${name}! 👋 Te informamos sobre tu equipo en ZiirTech.\n\n`;
    switch(status) {
        case 'reparacion':
            message += "Hemos comenzado el proceso de reparación. Te mantendremos al tanto de los avances.";
            break;
        case 'pruebas':
            message += "La reparación ha finalizado y tu equipo ha entrado en fase de pruebas para asegurar su correcto funcionamiento.";
            break;
        case 'listo':
            message += "¡Excelentes noticias! Tu equipo ha superado todas las pruebas y ya está listo para la entrega. ✨";
            break;
        default:
            message = `¡Hola ${name}! El estado de tu equipo ha sido actualizado a: *${getStatusText(status)}*.`;
    }
    return message;
}


// ============= [Funciones del Dashboard] =============
function setupEventListeners() {
    setupRequestSearch();
    
    document.getElementById('equipment-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const serviceId = document.getElementById('service-id').value.trim();
        const clientName = document.getElementById('client-name').value.trim();
        const equipmentType = document.getElementById('equipment-type').value;
        const equipmentBrand = document.getElementById('equipment-brand').value.trim();
        const problemDescription = document.getElementById('problem-description').value.trim();
        
        if (!serviceId || !clientName || !equipmentType || !equipmentBrand || !problemDescription) {
            alert("Por favor completa todos los campos");
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

            let clientPhoneNumber = null;
            let solicitudData = null;
            let servicioRelacionado = "No especificado";

            if (selectedRequestId) {
                const solicitudRef = db.collection("solicitudes").doc(selectedRequestId);
                const solicitudDoc = await solicitudRef.get();
                if (solicitudDoc.exists) {
                    solicitudData = solicitudDoc.data();
                    clientPhoneNumber = cleanPhoneNumber(solicitudData.telefono);
                    servicioRelacionado = solicitudData.servicio;

                    await solicitudRef.update({
                        estado: "En proceso", 
                        equipoAsignado: serviceId,
                        tecnicoAsignado: currentUser.email,
                        fechaAsignacion: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            }
            
            await db.collection('equipos').doc(serviceId).set({
                serviceId,
                clientName,
                equipmentType,
                equipmentBrand,
                problemDescription,
                servicioRelacionado,
                status: 'diagnostico',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                technician: currentUser.email,
                technicianNotes: "Equipo recibido para diagnóstico",
                requestId: selectedRequestId || null
            });
            
            e.target.reset();
            selectedRequestId = null;
            loadPendingRequests();
            loadEquipmentList();
            
            if (clientPhoneNumber && solicitudData) {
                const wantsToNotify = confirm("✅ Equipo registrado exitosamente.\n\n¿Deseas notificar al cliente por WhatsApp y enviarle su ID de seguimiento?");
                if (wantsToNotify) {
                    const message = `¡Hola ${solicitudData.nombre}! 👋 Te saludamos de ZiirTech.\n\nHemos recibido y registrado tu equipo.\n\nTu ID de seguimiento es: *${solicitudData.idCliente}*\n\nPuedes usar este ID para consultar el estado en nuestra página web en cualquier momento. ¡Gracias por confiar en nosotros!`;
                    const whatsappUrl = `https://wa.me/${clientPhoneNumber}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                }
            } else {
                alert("Equipo registrado exitosamente. No se encontró un número de teléfono válido para notificar.");
            }
            
        } catch (error) {
            console.error("Error al guardar equipo:", error);
            alert("Error al registrar el equipo: " + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Registrar Equipo';
        }
    });
    
    document.querySelectorAll('.status-filter').forEach(filter => {
        filter.addEventListener('click', function() {
            document.querySelectorAll('.status-filter').forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            loadEquipmentList(this.dataset.status);
        });
    });
    
    const modal = document.getElementById('status-modal');
    if (modal) {
        const closeBtn = modal.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => modal.style.display = 'none');
        }
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
        
        document.querySelectorAll('.status-option').forEach(option => {
            option.addEventListener('click', function() {
                document.querySelectorAll('.status-option').forEach(opt => {
                    opt.style.backgroundColor = '';
                    opt.style.color = '';
                });
                this.style.backgroundColor = '#f0f0f0';
                this.style.color = 'var(--primary-dark)';
            });
        });
        
        document.getElementById('save-status-btn').addEventListener('click', async () => {
            const selectedStatus = document.querySelector('.status-option[style*="background-color"]')?.dataset.status;
            const technicianNotes = document.getElementById('technician-notes').value;
            
            if (!selectedStatus) {
                alert("Selecciona un estado para actualizar");
                return;
            }
            
            try {
                const equipmentRef = db.collection('equipos').doc(currentEquipmentId);
                await equipmentRef.update({
                    status: selectedStatus,
                    technicianNotes,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                modal.style.display = 'none';
                const activeFilter = document.querySelector('.status-filter.active').dataset.status;
                loadEquipmentList(activeFilter);
                
                const wantsToNotify = confirm("✅ Estado actualizado correctamente.\n\n¿Deseas notificar al cliente por WhatsApp sobre este cambio?");
                if (wantsToNotify) {
                    const equipmentDoc = await equipmentRef.get();
                    const equipmentData = equipmentDoc.data();

                    if (equipmentData.requestId) {
                        const solicitudDoc = await db.collection('solicitudes').doc(equipmentData.requestId).get();
                        if (solicitudDoc.exists) {
                            const clientPhoneNumber = cleanPhoneNumber(solicitudDoc.data().telefono);
                            if (clientPhoneNumber) {
                                const message = getStatusUpdateMessage(selectedStatus, equipmentData.clientName);
                                const whatsappUrl = `https://wa.me/${clientPhoneNumber}?text=${encodeURIComponent(message)}`;
                                window.open(whatsappUrl, '_blank');
                            } else {
                                alert("No se pudo notificar: no se encontró un número de teléfono válido en la solicitud original.");
                            }
                        }
                    } else {
                         alert("No se pudo notificar: este equipo no está vinculado a una solicitud original.");
                    }
                }
                
            } catch (error) {
                console.error("Error al actualizar estado:", error);
                alert("Error al actualizar el estado. Intenta nuevamente.");
            }
        });
    }
}

function setupRequestSearch() {
    const searchInput = document.getElementById('search-request');
    const requestResults = document.getElementById('request-results');
    
    searchInput.addEventListener('input', async (e) => {
        const searchTerm = e.target.value.trim();
        if (searchTerm.length < 2) {
            requestResults.style.display = 'none';
            return;
        }
        try {
            const querySnapshot = await db.collection('solicitudes')
                .where('keywords', 'array-contains', searchTerm.toLowerCase())
                .limit(5)
                .get();
            requestResults.innerHTML = '';
            if (querySnapshot.empty) {
                requestResults.innerHTML = '<div class="request-item">No se encontraron solicitudes</div>';
            } else {
                querySnapshot.forEach(doc => {
                    const solicitud = doc.data();
                    const item = document.createElement('div');
                    item.className = 'request-item';
                    item.innerHTML = `<h4>${solicitud.nombre}</h4><p>ID: ${solicitud.idCliente}</p><p>Servicio: ${solicitud.servicio}</p>`;
                    item.addEventListener('click', () => {
                        populateEquipmentForm(solicitud, doc.id);
                        requestResults.style.display = 'none';
                        searchInput.value = '';
                    });
                    requestResults.appendChild(item);
                });
            }
            requestResults.style.display = 'block';
        } catch (error) {
            console.error("Error al buscar solicitudes:", error);
            requestResults.innerHTML = '<div class="request-item error">Error al buscar</div>';
            requestResults.style.display = 'block';
        }
    });
    document.addEventListener('click', (e) => {
        if (e.target !== searchInput) {
            requestResults.style.display = 'none';
        }
    });
}

function getStatusText(status) {
    const statusMap = {
        'diagnostico': 'En Diagnóstico',
        'reparacion': 'En Reparación',
        'pruebas': 'En Pruebas',
        'listo': 'Listo para Entrega',
        'finalizado': 'Finalizado (Historial)'
    };
    return statusMap[status] || status;
}

async function openStatusModal(equipmentId) {
    currentEquipmentId = equipmentId;
    const modal = document.getElementById('status-modal');
    try {
        const doc = await db.collection('equipos').doc(equipmentId).get();
        if (!doc.exists) {
            alert("Equipo no encontrado");
            return;
        }
        const equipment = doc.data();
        document.getElementById('modal-equipment-id').textContent = `Equipo: ${equipment.serviceId}`;
        document.getElementById('modal-client-name').textContent = equipment.clientName;
        document.getElementById('technician-notes').value = equipment.technicianNotes || '';
        document.querySelectorAll('.status-option').forEach(opt => {
            opt.style.backgroundColor = '';
            opt.style.color = '';
        });
        modal.style.display = 'flex';
    } catch (error) {
        console.error("Error al abrir modal:", error);
        alert("Error al cargar la información del equipo");
    }
}

// Inicializar la aplicación
console.log("ZiirTech Employee System v1.0 - Ready");