import { Telegraf } from 'telegraf'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const bot = new Telegraf(process.env['BOT_TOKEN']!)

const supabase = createClient(
  process.env['SUPABASE_URL']!,
  process.env['SUPABASE_KEY']!
)

bot.start(async (ctx) => {
  const message = ctx.message?.text
  const token = message?.split(' ')[1]

  if (!token) {
    return ctx.reply('🚫 Este enlace no es válido. Usa el botón "Conectar con Telegram" desde la app.')
  }

  const { data: user, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('login_token', token)
    .single()

  if (!user || error) {
    return ctx.reply('⚠️ No se pudo vincular tu cuenta. Token inválido o expirado.')
  }

  await supabase
    .from('profiles')
    .update({ telegram_chat_id: ctx.chat.id })
    .eq('id', user.id)

  ctx.reply('✅ ¡Listo! Tu cuenta ha sido conectada con Telegram.')
})

bot.launch()
console.log('🤖 Bot en marcha y esperando mensajes...')
