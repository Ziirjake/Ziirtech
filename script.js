// Rotating Text
 // ==================== CONFIGURACIÓN INICIAL ====================
 // Rotating Text Animation
 const rotatingTexts = [
     "Siempre Funcionando", 
     "Sin Preocupaciones",
 @@ -12,7 +13,7 @@ function rotateText() {
 }
 setInterval(rotateText, 3000);
 
 // Firebase Configuration
 // Firebase Configuration (USAR TUS CREDENCIALES)
 const firebaseConfig = {
     apiKey: "AIzaSyAEmSj7LJFSOTHBJbN6rKZ1mxcXf0dfx3M",
     authDomain: "ziirtech.firebaseapp.com",
 @@ -27,7 +28,7 @@ const firebaseConfig = {
 firebase.initializeApp(firebaseConfig);
 const db = firebase.firestore();
 
 // Modal Functions
 // ==================== FUNCIONES DEL MODAL ====================
 function openModal(serviceType) {
     const modal = document.getElementById('service-modal');
     const title = document.getElementById('modal-title');
 @@ -55,7 +56,51 @@ function closeModal() {
     document.getElementById('service-modal').style.display = 'none';
 }
 
 // Form Submission
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
 
 @@ -66,44 +111,27 @@ document.getElementById('service-form').addEventListener('submit', async (e) =>
     const formData = {
         nombre: e.target[0].value,
         email: e.target[1].value,
         telefono: e.target[2].value || 'No proporcionado',
         problema: e.target[3].value,
         servicio: document.getElementById('modal-title').textContent,
         fecha: firebase.firestore.FieldValue.serverTimestamp(),
         origen: "Página Web"
         telefono: e.target[2].value,
         problema: e.target[3].value
     };
 
     try {
         // Intento principal con Firebase
         const docRef = await db.collection("solicitudes").add(formData);
         console.log("Documento ID:", docRef.id);
         
         // Feedback al usuario
         alert("✅ Solicitud registrada correctamente");
     const serviceType = document.getElementById('modal-title').textContent;
     
     const success = await saveRequest(serviceType, formData);
     
     if (success) {
         alert("✅ Solicitud enviada correctamente");
         closeModal();
         e.target.reset();
 
     } catch (error) {
         console.error("Error completo:", error);
         
         // Fallback a WhatsApp
         const whatsappMsg = `*SOLICITUD DE EMERGENCIA*%0A` + 
             `(Error en sistema)%0A%0A` +
             `*Servicio:* ${formData.servicio}%0A` +
             `*Nombre:* ${formData.nombre}%0A` +
             `*Teléfono:* ${formData.telefono}%0A` +
             `*Problema:* ${formData.problema}`;
         
         window.open(`https://wa.me/573103510752?text=${whatsappMsg}`, '_blank');
         alert("⚠️ Usamos WhatsApp como respaldo. Ya recibimos tu solicitud.");
         
     } finally {
         submitBtn.disabled = false;
         submitBtn.innerHTML = 'Enviar Solicitud';
     } else {
         alert("⚠️ El sistema está ocupado. Ya enviamos tus datos por WhatsApp.");
     }
     
     submitBtn.disabled = false;
     submitBtn.innerHTML = 'Enviar Solicitud';
 });
 
 // Status Checker
 // ==================== VERIFICADOR DE ESTADO ====================
 function checkStatus() {
     const clientId = document.getElementById('client-id').value.trim();
     const statusCard = document.getElementById('equipo-status');
 @@ -115,25 +143,31 @@ function checkStatus() {
 
     statusCard.innerHTML = `<p><i class="fas fa-spinner fa-spin"></i> Verificando estado...</p>`;
 
     // Simulación de API
     // Simulación de verificación
     setTimeout(() => {
         const status = Math.random() > 0.5 ? 'healthy' : 'warning';
         const status = Math.random() > 0.3 ? 'healthy' : 
                       Math.random() > 0.5 ? 'warning' : 'critical';
 
         if (status === 'healthy') {
             statusCard.innerHTML = `
                 <p class="healthy">✅ Tu equipo está en óptimas condiciones</p>
                 <p><small>Última revisión: ${new Date().toLocaleDateString()}</small></p>
                 <p><small>Última revisión: ${new Date().toLocaleDateString('es-CO')}</small></p>
             `;
         } else {
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
 
 // Chatbot Functions
 // ==================== CHATBOT ====================
 function openChat() {
     document.getElementById('chatbot').style.display = 'flex';
 }
 @@ -148,25 +182,39 @@ function sendMessage() {
 
     if (input.value.trim() === '') return;
 
     // Add user message
     // Mensaje del usuario
     const userMsg = document.createElement('div');
     userMsg.className = 'user-message';
     userMsg.textContent = input.value;
     messages.appendChild(userMsg);
 
     // Bot response
     // Respuesta del bot después de 0.8s
     setTimeout(() => {
         const botMsg = document.createElement('div');
         botMsg.className = 'bot-message';
         const userText = input.value.toLowerCase();
 
         if (input.value.toLowerCase().includes('hola')) {
             botMsg.textContent = '¡Hola! ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre servicios o estado de equipos.';
         if (userText.includes('hola') || userText.includes('buenas')) {
             botMsg.innerHTML = `¡Hola! Soy Zii, el asistente de ZiirTech. ¿En qué puedo ayudarte hoy?<br>
                                Puedes preguntarme sobre:<br>
                                - Servicios<br>
                                - Precios<br>
                                - Estado de tu equipo`;
         } 
         else if (input.value.toLowerCase().includes('precio')) {
             botMsg.textContent = 'Tenemos estos servicios:\n- Preventivo: $80,000\n- Correctivo: $125,000\n- Redes: $199,000\n\n¿Quieres más información?';
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
             botMsg.textContent = '¿Necesitas ayuda con algún servicio en particular? Puedo conectarte con un técnico si lo prefieres.';
             botMsg.textContent = 'No entendí tu pregunta. ¿Puedes ser más específico? O si prefieres, te conecto con un técnico.';
         }
 
         messages.appendChild(botMsg);
 @@ -177,12 +225,10 @@ function sendMessage() {
     messages.scrollTop = messages.scrollHeight;
 }
 
 // Enter key for chatbot
 // Enter key para el chatbot
 document.getElementById('user-input').addEventListener('keypress', (e) => {
     if (e.key === 'Enter') sendMessage();
 });
 
 // Enter key for chatbot
 document.getElementById('user-input').addEventListener('keypress', (e) => {
     if (e.key === 'Enter') sendMessage();
 });
 // ==================== INICIALIZACIÓN ====================
 console.log("ZiirTech System initialized");
