// Configuración Firebase (usar la misma que en script.js)
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
const auth = firebase.auth();
const db = firebase.firestore();

// Variables globales
let currentEquipmentId = null;
let currentUser = null;

// ============= [FUNCIONES DE AUTENTICACIÓN] =============
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en la página de login o dashboard
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
        
        try {
            // Deshabilitar el botón durante el login
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
            
            // Autenticar con Firebase
            const userCredential = await auth.signInWithEmailAndPassword(
                `${username}@ziirtech.com`, // Asumimos que el username es el email sin dominio
                password
            );
            
            // Redirigir al dashboard
            window.location.href = 'dashboard.html';
            
        } catch (error) {
            console.error("Error de autenticación:", error);
            
            let errorMessage = "Error al iniciar sesión. Intenta nuevamente.";
            if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
                errorMessage = "Usuario o contraseña incorrectos";
            } else if (error.code === "auth/too-many-requests") {
                errorMessage = "Demasiados intentos fallidos. Intenta más tarde.";
            }
            
            errorElement.textContent = errorMessage;
            
            // Rehabilitar el botón
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Ingresar';
        }
    });
}

function initDashboard() {
    // Verificar autenticación
    auth.onAuthStateChanged(user => {
        if (!user) {
            // No autenticado, redirigir a login
            window.location.href = 'login.html';
        } else {
            currentUser = user;
            document.getElementById('employee-name').textContent = user.email.split('@')[0];
            loadEquipmentList();
            setupEventListeners();
        }
    });
    
    // Configurar botón de logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = 'login.html';
        });
    });
}

// ============= [FUNCIONES DEL DASHBOARD] =============
function setupEventListeners() {
    // Formulario para agregar equipo
    // Modificar la función para guardar equipos para incluir referencia a solicitudes
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
    
    try {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        
        // Buscar si existe una solicitud relacionada
        const solicitudQuery = await db.collection("solicitudes")
            .where("idCliente", "==", serviceId)
            .limit(1)
            .get();
        
        let servicioRelacionado = "No especificado";
        if (!solicitudQuery.empty) {
            servicioRelacionado = solicitudQuery.docs[0].data().servicio;
        }
        
        // Guardar en Firestore
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
            technicianNotes: "Equipo recibido para diagnóstico"
        });
        
        // Actualizar la solicitud si existe
        if (!solicitudQuery.empty) {
            await solicitudQuery.docs[0].ref.update({
                estado: "En proceso",
                equipoAsignado: serviceId
            });
        }
        
        e.target.reset();
        loadEquipmentList();
        alert("Equipo registrado exitosamente");
        
    } catch (error) {
        console.error("Error al guardar equipo:", error);
        alert("Error al registrar el equipo: " + error.message);
    } finally {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Registrar Equipo';
    }
});
    
    // Filtros de estado
    document.querySelectorAll('.status-filter').forEach(filter => {
        filter.addEventListener('click', function() {
            document.querySelectorAll('.status-filter').forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            loadEquipmentList(this.dataset.status);
        });
    });
    
    // Modal de estado
    const modal = document.getElementById('status-modal');
    const closeBtn = modal.querySelector('.close-btn');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Opciones de estado
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
    
    // Guardar cambios de estado
    document.getElementById('save-status-btn').addEventListener('click', async () => {
        const selectedStatus = document.querySelector('.status-option[style*="background-color"]')?.dataset.status;
        const technicianNotes = document.getElementById('technician-notes').value;
        
        if (!selectedStatus) {
            alert("Selecciona un estado para actualizar");
            return;
        }
        
        try {
            // Actualizar en Firestore
            await db.collection('equipos').doc(currentEquipmentId).update({
                status: selectedStatus,
                technicianNotes,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Cerrar modal y recargar lista
            modal.style.display = 'none';
            loadEquipmentList();
            
        } catch (error) {
            console.error("Error al actualizar estado:", error);
            alert("Error al actualizar el estado. Intenta nuevamente.");
        }
    });
}

async function loadEquipmentList(filterStatus = 'all') {
    const equipmentList = document.getElementById('equipment-list');
    equipmentList.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Cargando equipos...</p>';
    
    try {
        let query = db.collection('equipos').orderBy('updatedAt', 'desc');
        
        if (filterStatus !== 'all') {
            query = query.where('status', '==', filterStatus);
        }
        
        const snapshot = await query.get();
        
        if (snapshot.empty) {
            equipmentList.innerHTML = '<p>No se encontraron equipos registrados</p>';
            return;
        }
        
        equipmentList.innerHTML = '';
        
        snapshot.forEach(doc => {
            const equipment = doc.data();
            const statusText = getStatusText(equipment.status);
            
            const card = document.createElement('div');
            card.className = 'equipment-card';
            card.innerHTML = `
                <div class="equipment-id">ID: ${equipment.serviceId}</div>
                <div class="equipment-client">Cliente: ${equipment.clientName}</div>
                <div class="equipment-type">${equipment.equipmentType} - ${equipment.equipmentBrand}</div>
                
                <div class="equipment-status">
                    <span class="status-badge ${equipment.status}">${statusText}</span>
                    <span class="status-date">${equipment.updatedAt?.toDate().toLocaleDateString('es-CO') || ''}</span>
                </div>
                
                <p class="problem-description">${equipment.problemDescription}</p>
                
                <button class="update-btn" data-id="${equipment.serviceId}">
                    <i class="fas fa-edit"></i> Actualizar Estado
                </button>
            `;
            
            equipmentList.appendChild(card);
        });
        
        // Configurar botones de actualización
        document.querySelectorAll('.update-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const equipmentId = this.dataset.id;
                openStatusModal(equipmentId);
            });
        });
        
    } catch (error) {
        console.error("Error al cargar equipos:", error);
        equipmentList.innerHTML = '<p class="error">Error al cargar los equipos. Intenta recargar la página.</p>';
    }
}

function getStatusText(status) {
    const statusMap = {
        'diagnostico': 'En Diagnóstico',
        'reparacion': 'En Reparación',
        'pruebas': 'En Pruebas',
        'listo': 'Listo para Entrega'
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
        
        // Llenar información del modal
        document.getElementById('modal-equipment-id').textContent = `Equipo: ${equipment.serviceId}`;
        document.getElementById('modal-client-name').textContent = equipment.clientName;
        document.getElementById('technician-notes').value = equipment.technicianNotes || '';
        
        // Resetear selección de estado
        document.querySelectorAll('.status-option').forEach(opt => {
            opt.style.backgroundColor = '';
            opt.style.color = '';
        });
        
        // Mostrar modal
        modal.style.display = 'flex';
        
    } catch (error) {
        console.error("Error al abrir modal:", error);
        alert("Error al cargar la información del equipo");
    }
}

// Inicializar la aplicación
console.log("ZiirTech Employee System v1.0 - Ready");