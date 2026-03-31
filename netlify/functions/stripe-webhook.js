// netlify/functions/stripe-webhook.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');

// Configuración de Nodemailer (usa las variables de entorno)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

exports.handler = async (event) => {
    const sig = event.headers['stripe-signature'];
    let webhookEvent;

    try {
        // Verifica la firma del webhook para asegurar que viene de Stripe
        webhookEvent = stripe.webhooks.constructEvent(event.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.log(`Webhook signature verification failed.`, err.message);
        return { statusCode: 400 };
    }

    // Maneja el evento
    if (webhookEvent.type === 'checkout.session.completed') {
        const session = webhookEvent.data.object;

        console.log(`¡Pago exitoso para la sesión ${session.id}!`);
        console.log(`Email del cliente: ${session.customer_details.email}`);

        // === ENVÍO DEL CORREO ELECTRÓNICO ===
        const mailOptions = {
            from: `"Tu Nombre o Empresa" <${process.env.SMTP_USER}>`,
            to: session.customer_details.email,
            subject: '¡Bienvenido! Tu compra ha sido confirmada',
            text: `Hola ${session.customer_details.name || ''},\n\nGracias por tu compra. Ya tienes acceso a nuestro producto.\n\nID de la transacción: ${session.id}\n\n¡Que lo disfrutes!`,
            html: `<p>Hola <strong>${session.customer_details.name || ''}</strong>,</p><p>Gracias por tu compra. Ya tienes acceso a nuestro producto.</p><p>ID de la transacción: <em>${session.id}</em></p><p>¡Que lo disfrutes!</p>`,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log('Correo de confirmación enviado a:', session.customer_details.email);
            return { statusCode: 200 };
        } catch (emailError) {
            console.error('Error al enviar el correo:', emailError);
            return { statusCode: 500, body: 'Failed to send email' };
        }
    }

    // Devuelve una respuesta 200 para otros eventos
    return { statusCode: 200 };
};