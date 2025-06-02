import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormsModule, NgForm } from '@angular/forms'; // Asegúrate de importar NgForm para el tipo
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
// REMOVIDOS: MatDatepickerModule, MatNativeDateModule
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment'; // ✅ REVISA ESTA RUTA si la tienes en otro nivel

@Component({
  selector: 'app-anuncio',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    // REMOVIDOS DE IMPORTS: MatDatepickerModule, MatNativeDateModule
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './anuncio.component.html',
  styleUrls: ['./anuncio.component.css']
})
export class AnuncioComponent implements OnInit { // ✅ Implementa OnInit
  anuncio = {
    title: '',
    content: '',
    expiration_date: '' // ✅ CAMBIADO A STRING para entrada manual (Ej: "DD/MM/AAAA")
  };

  private supabase: SupabaseClient;
  isLoading: boolean = false;
  errorMessage: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<AnuncioComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  ngOnInit(): void {
    // Si necesitas inicializar algo al abrir el diálogo, va aquí
  }

  async publicarAnuncio(formulario: NgForm) { // Recibe el formulario como NgForm para validar
    this.isLoading = true;
    this.errorMessage = null;

    // Validación del formulario de Angular (para campos 'required')
    if (formulario.invalid) {
      this.errorMessage = 'Por favor, completa todos los campos obligatorios.';
      this.isLoading = false;
      return;
    }

    // Validación adicional de la fecha (formato DD/MM/AAAA)
    let isoExpirationDate: string | null = null;
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(\d{4})$/; // Regex para DD/MM/AAAA

    if (!this.anuncio.expiration_date || !dateRegex.test(this.anuncio.expiration_date)) {
      this.errorMessage = 'Formato de fecha inválido. Por favor, usa DD/MM/AAAA.';
      this.isLoading = false;
      return;
    }

    const [day, month, year] = this.anuncio.expiration_date.split('/').map(Number);
    const parsedDate = new Date(year, month - 1, day); // Meses en JS son 0-indexados

    // Validar si la fecha es realmente válida (ej: 31/02/2024 no sería válido)
    if (parsedDate.getFullYear() !== year ||
        parsedDate.getMonth() !== (month - 1) ||
        parsedDate.getDate() !== day ||
        isNaN(parsedDate.getTime())) {
      this.errorMessage = 'Fecha de expiración inválida. Por favor, revisa el día, mes y año.';
      this.isLoading = false;
      return;
    }

    isoExpirationDate = parsedDate.toISOString(); // Convertir a ISO para Supabase

    // Obtener el ID del usuario autenticado (administrador)
    const { data: userData, error: userError } = await this.supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId || userError) {
      console.error('Error obteniendo ID de usuario:', userError?.message || userError);
      this.errorMessage = '⚠️ No se pudo obtener el ID del usuario. Por favor, asegúrate de estar logueado como administrador.';
      this.isLoading = false;
      return;
    }

    // Insertar el anuncio en Supabase
    try {
      const { error } = await this.supabase.from('announcements').insert([
        {
          title: this.anuncio.title,
          content: this.anuncio.content,
          expiration_date: isoExpirationDate,
          is_published: true, // Asumimos que se publica de inmediato
          priority: 1,      // Puedes ajustar esto o añadir un campo en el formulario
          author_id: userId
        }
      ]);

      if (error) {
        console.error('❌ Error al guardar en Supabase:', error.message);
        this.errorMessage = 'Error al publicar el anuncio: ' + error.message;
      } else {
        this.dialogRef.close({ success: true, message: '✅ Anuncio publicado correctamente.' });
      }
    } catch (dbError) {
      console.error('Error inesperado al interactuar con Supabase:', dbError);
      this.errorMessage = 'Ocurrió un error inesperado al publicar el anuncio.';
    } finally {
      this.isLoading = false;
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}