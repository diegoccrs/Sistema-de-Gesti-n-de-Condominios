import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  'https://rimuwztixsaxiaznzfdg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXV3enRpeHNheGlhem56ZmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NjE5MjgsImV4cCI6MjA2MzMzNzkyOH0.JCFytgjghRds9zzSVYDFIelcZVPFc-elKgx1Ic5V4Rc'
);

@Component({
  selector: 'app-conectar-telegram',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './conectar-telegram.component.html',
  styleUrls: ['./conectar-telegram.component.css']
})
export class ConectarTelegramComponent {
  telegramUrl: string | null = null;

  async conectarConTelegram() {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user?.id) {
      console.error('Usuario no autenticado.');
      return;
    }

    const token = uuidv4();

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ login_token: token })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error guardando el token:', updateError);
      return;
    }

    this.telegramUrl = `https://t.me/notificacionesCDBot?start=${token}`;
  }
}
