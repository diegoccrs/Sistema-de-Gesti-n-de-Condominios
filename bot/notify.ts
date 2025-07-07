import { Telegraf } from 'telegraf'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const bot = new Telegraf(process.env['BOT_TOKEN']!)
const supabase = createClient(
  process.env['SUPABASE_URL']!,
  process.env['SUPABASE_KEY']!
)

async function revisarYEnviarNotificaciones() {
  const { data: pendientes, error } = await supabase
    .from('pending_notifications')
    .select('*')

  if (error) {
    console.error('Error al consultar notificaciones pendientes:', error)
    return
  }

  for (const noti of pendientes) {
    try {
      await bot.telegram.sendMessage(noti.chat_id, noti.message)
      await supabase.from('pending_notifications').delete().eq('id', noti.id)
      console.log(`✅ Mensaje enviado a ${noti.chat_id}: ${noti.message}`)
    } catch (err) {
      console.error('Error al enviar mensaje por Telegram:', err)
    }
  }
}

// Ejecutar cada 5 segundos
setInterval(revisarYEnviarNotificaciones, 50000)
console.log('📡 Servicio de notificaciones iniciado...')
