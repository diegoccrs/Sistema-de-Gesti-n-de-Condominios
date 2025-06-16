import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import dayjs from 'dayjs';
import 'dotenv/config';

const supabase = createClient(
    process.env['SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!
);

interface ReminderEmailParams {
    email: string;
    name: string;
    amount: number;
    currency: string;
    daysLate: number;
    concept: string;
}

async function sendReminderEmail({ email, name, amount, currency, daysLate, concept }: ReminderEmailParams) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env['EMAIL_USER'],
            pass: process.env['EMAIL_PASS']
        }
    });

    const html = `
    <h3>Recordatorio de pago pendiente</h3>
    <p>Hola ${name},</p>
    <p>Tienes un pago pendiente por <strong>${amount} ${currency}</strong> (${concept}).</p>
    <p>Este pago tiene un atraso de <strong>${daysLate} días</strong>.</p>
    <p>Métodos de pago disponibles:</p>
    <ul>
      <li>Transferencia bancaria</li>
      <li>Pago móvil</li>
      <li>Pago en efectivo</li>
    </ul>
    <p>Gracias por tu atención.</p>
  `;

    await transporter.sendMail({
        from: '"Condominio" <noreply@condominio.com>',
        to: email,
        subject: 'Recordatorio de pago pendiente',
        html
    });
}

async function main() {
    const now = dayjs();
    const currentTime = now.format('HH:mm');

    const { data: configs } = await supabase
        .from('reminder_config')
        .select('*')
        .eq('active', true);

    for (const config of configs || []) {
        if (currentTime !== config.send_time) continue;

        const cutoffDate = now.subtract(config.days_late, 'day').toISOString();

        const { data: payments } = await supabase
            .from('payments')
            .select('*, profiles(email, first_name, last_name)')
            .eq('status', 'pending')
            .lt('payment_date', cutoffDate);

        for (const payment of payments || []) {
            const daysLate = now.diff(dayjs(payment.payment_date), 'day');
            const resident = payment.profiles;

            if (!resident?.email) continue;

            await sendReminderEmail({
                email: resident.email,
                name: `${resident.first_name} ${resident.last_name}`,
                amount: payment.amount,
                currency: payment.currency,
                daysLate,
                concept: payment.concept
            });
        }
    }
}

main();
