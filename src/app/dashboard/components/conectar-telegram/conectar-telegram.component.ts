import { Component } from '@angular/core'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { CommonModule } from '@angular/common'

const supabase = createClient(
  'https://rimuwztixsaxiaznzfdg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXV3enRpeHNheGlhem56ZmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NjE5MjgsImV4cCI6MjA2MzMzNzkyOH0.JCFytgjghRds9zzSVYDFIelcZVPFc-elKgx1Ic5V4Rc'
)

@Component({
  selector: 'app-conectar-telegram',
  templateUrl: './conectar-telegram.component.html'
})
export class ConectarTelegramComponent {
  telegramUrl: string | null = null

  async conectarConTelegram() {
    const user = await supabase.auth.getUser()
    const userId = user.data.user?.id
    console.log('Usuario recibido:', user);

    if (!userId) {
      console.error('Usuario no autenticado.')
      return
    }

    const token = uuidv4()

    const { error } = await supabase
      .from('profiles')
      .update({ login_token: token })
      .eq('id', userId)

    if (error) {
      console.error('Error guardando el token:', error)
      return
    }

    this.telegramUrl = `https://t.me/notificacionesCDBot?start=${token}`
  }
  
}
