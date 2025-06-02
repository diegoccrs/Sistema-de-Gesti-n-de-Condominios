import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormsModule, NgForm } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-anuncio',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './anuncio.component.html',
  styleUrls: ['./anuncio.component.css']
})
export class AnuncioComponent implements OnInit {
  anuncio = {
    title: '',
    content: '',
    expiration_date: ''
  };

  /** Archivo seleccionado para adjuntar */
  selectedFile: File | null = null;

  private supabase: SupabaseClient;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<AnuncioComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  ngOnInit(): void { }

  /** Maneja la selección de archivo */
  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.selectedFile = target.files[0];
    }
  }

  async publicarAnuncio(formulario: NgForm) {
    this.isLoading = true;
    this.errorMessage = null;

    // Validación de campos obligatorios
    if (formulario.invalid) {
      this.errorMessage = 'Por favor, completa todos los campos obligatorios.';
      this.isLoading = false;
      return;
    }

    // Validar formato de fecha DD/MM/AAAA
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    if (!this.anuncio.expiration_date || !dateRegex.test(this.anuncio.expiration_date)) {
      this.errorMessage = 'Formato de fecha inválido. Usa DD/MM/AAAA.';
      this.isLoading = false;
      return;
    }

    const [day, month, year] = this.anuncio.expiration_date.split('/').map(Number);
    const parsedDate = new Date(year, month - 1, day);
    if (
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() !== month - 1 ||
      parsedDate.getDate() !== day ||
      isNaN(parsedDate.getTime())
    ) {
      this.errorMessage = 'Fecha de expiración inválida. Revisa día, mes y año.';
      this.isLoading = false;
      return;
    }

    const isoExpirationDate = parsedDate.toISOString();

    // Obtener usuario autenticado
    const { data: userData, error: userError } = await this.supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId || userError) {
      this.errorMessage = '⚠️ No se pudo obtener el ID del usuario. Inicia sesión nuevamente.';
      this.isLoading = false;
      return;
    }

    // 1️⃣ Subir archivo al bucket, si existe
    let attachmentUrl: string | null = null;
    if (this.selectedFile) {
      const sanitizedName = this.selectedFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const filePath = `${userId}/${Date.now()}_${sanitizedName}`;
      const { error: uploadError } = await this.supabase.storage
        .from('anuncios-adjuntos')
        .upload(filePath, this.selectedFile, { upsert: false });

      if (uploadError) {
        this.errorMessage = 'Error al subir el archivo adjunto: ' + uploadError.message;
        this.isLoading = false;
        return;
      }

      const { data: publicData } = this.supabase.storage
        .from('anuncios-adjuntos')
        .getPublicUrl(filePath);
      attachmentUrl = publicData.publicUrl;
    }

    // 2️⃣ Insertar anuncio en la base de datos
    try {
      const { error } = await this.supabase.from('announcements').insert([
        {
          title: this.anuncio.title,
          content: this.anuncio.content,
          expiration_date: isoExpirationDate,
          is_published: true,
          priority: 1,
          author_id: userId,
          attachment_url: attachmentUrl // 🔗 puede ser null si no hay archivo
        }
      ]);

      if (error) {
        this.errorMessage = 'Error al publicar el anuncio: ' + error.message;
      } else {
        this.dialogRef.close({ success: true, message: '✅ Anuncio publicado correctamente.' });
      }
    } catch (dbError) {
      console.error('Error inesperado:', dbError);
      this.errorMessage = 'Ocurrió un error inesperado al publicar el anuncio.';
    } finally {
      this.isLoading = false;
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}