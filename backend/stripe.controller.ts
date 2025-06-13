import express from 'express';
import Stripe from 'stripe';

const router = express.Router();

// 🔐 Reemplaza con tu clave secreta
const stripe = new Stripe('sk_test_51RZaOWQ34Z71lCeZv5NPWAtBJYvjivjYLQlsqLx88SgV8FdOxGSE1Alhu9Hxg6TAvOfWF6lCUXZlREOcL5bEPaAV00DfpmnxRQ', {
    apiVersion: '2025-05-28.basil', // Usa la última estable
});

router.post('/create-checkout-session', async (req, res) => {
    const { concept, amount } = req.body;

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd', // O cambia a 'ves' si está habilitado en tu cuenta
                        product_data: {
                            name: concept,
                        },
                        unit_amount: Math.round(amount * 100), // En centavos
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: 'http://localhost:4200/pago-exitoso',
            cancel_url: 'http://localhost:4200/pago-cancelado',
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creando sesión de pago con Stripe' });
    }
});

export default router;
