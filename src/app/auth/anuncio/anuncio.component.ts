import { Component } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FormsModule } from '@angular/forms'; // 👈 esto es clave

@Component({
  selector: 'app-anuncio',
  standalone: true, // si estás usando Angular standalone
  imports: [FormsModule], // 👈 aquí va FormsModule
  templateUrl: './anuncio.component.html',
  styleUrls: ['./anuncio.component.css']
})
export class AnuncioComponent {
  anuncio = {
    titulo: '',
    descripcion: '',
    fecha: ''
  };

  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      'https://rimuwztixsaxiaznzfdg.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbXV3enRpeHNheGlhem56ZmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NjE5MjgsImV4cCI6MjA2MzMzNzkyOH0.JCFytgjghRds9zzSVYDFIelcZVPFc-elKgx1Ic5V4Rc'
    );
  }

  async publicarAnuncio() {
  const { titulo, descripcion, fecha } = this.anuncio;

  // 🔐 Obtener el ID del usuario autenticado
  const { data: userData, error: userError } = await this.supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId || userError) {
    alert('⚠️ No se pudo obtener el ID del usuario.');
    return;
  }

  // ✅ Insertar el anuncio incluyendo author_id
  const { error } = await this.supabase.from('announcements').insert([
    {
      title: titulo,
      content: descripcion,
      expiration_date: fecha ? new Date(fecha).toISOString() : null,
      is_published: true,
      priority: 1,
      author_id: userId // 👈 esto permite cumplir con la política RLS
    }
  ]);

  if (error) {
    console.error('❌ Error al guardar:', error.message);
    alert('Error al guardar el anuncio: ' + error.message);
  } else {
    alert('✅ Anuncio publicado correctamente.');
    this.anuncio = { titulo: '', descripcion: '', fecha: '' };
  }
}
}