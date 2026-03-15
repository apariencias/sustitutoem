document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURACIÓN INICIAL ---
    // Asegúrate de usar tu CLAVE PÚBLICA de Stripe aquí
    const stripe = Stripe('pk_live_51T9zUO49pVvXIqag8X5dG5vL7vK0n9wS3fYh1wR1tO6uI0mK9qP7wX5cV3bN2zA1sK8lJ6hG4fD2eB0a8cF6dE4b2a0pk_test_51T9zUO49pVvXIqagpU4sX1qR7wY2kL3oP9mQ1xW5vZ7aB3cD1eF9gH7jK5lI3mO1qS9wY7vU5iK3oP1mQ9xW5vZ7aB3c'); // <-- ¡IMPORTANTE! Reemplaza esto si es necesario

    // --- SELECCIÓN DE ELEMENTOS DEL DOM ---
    const form = document.getElementById('payment-form');
    const submitButton = document.getElementById('submit-button');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const whatsappInput = document.getElementById('whatsapp');

    // --- VERIFICACIÓN DE QUE LOS ELEMENTOS EXISTEN ---
    if (!form || !submitButton || !nameInput || !emailInput || !whatsappInput) {
        console.error("❌ Error: No se encontraron todos los elementos del formulario en el HTML. Revisa los IDs.");
        return; // Detiene la ejecución del script si faltan elementos
    }

    // --- EVENT LISTENER PARA EL ENVÍO DEL FORMULARIO ---
    form.addEventListener('submit', async (event) => {
        // Prevenimos el comportamiento por defecto del formulario (recargar la página)
        event.preventDefault();

        // 1. EXTRAER Y VALIDAR DATOS DEL FORMULARIO
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const whatsapp = whatsappInput.value.trim();

        if (!name || !email || !whatsapp) {
            alert('Por favor, completa todos los campos del formulario.');
            return;
        }

        // 2. MOSTRAR ESTADO DE CARGA AL USUARIO
        submitButton.disabled = true;
        submitButton.textContent = 'Procesando...';

        try {
            // 3. ENVIAR PETICIÓN AL SERVIDOR
            const response = await fetch('https://servidor-pagos.onrender.com/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    whatsapp: whatsapp,
                    priceId: 'price_1TB01m49pVvXIqaguJHNWTsQ' // El ID de tu producto en Stripe
                }),
            });

            // 4. MANEJO DE LA RESPUESTA DEL SERVIDOR
            // Si la respuesta no es exitosa (status 200-299), lanzamos un error
            if (!response.ok) {
                // Intentamos leer el error que envió el servidor
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `Error del servidor: ${response.statusText}`);
            }

            // Si la respuesta es exitosa, procesamos los datos
            const session = await response.json();
            
            // 5. REDIRIGIR A STRIPE CHECKOUT
            const result = await stripe.redirectToCheckout({ sessionId: session.id });

            // Si Stripe mismo da un error (muy raro)
            if (result.error) {
                console.error('❌ ERROR de Stripe:', result.error.message);
                alert('Hubo un error al redirigir a la pasarela de pago. Por favor, inténtalo de nuevo.');
            }

        } catch (error) {
            // 6. MANEJO DE ERRORES (DE RED, DEL SERVIDOR, ETC.)
            console.error('❌ ERROR en el proceso de pago:', error.message);
            
            // Mostramos un mensaje amigable al usuario
            alert(`Ha ocurrido un problema: ${error.message}. Serás redirigido a la página principal.`);

            // Redirigimos a la página de "pago cancelado" o principal
            window.location.href = 'https://entrenadormental.netlify.app/la-calma-de-mama.html?payment=cancelled';

        } finally {
            // 7. RESTABLECER EL BOTÓN (SE EJECUTA SIEMPRE)
            submitButton.disabled = false;
            submitButton.textContent = 'Comprar Ahora';
        }
    });
});