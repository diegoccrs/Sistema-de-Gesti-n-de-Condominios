import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar'; // Importar MatProgressBarModule

import { SupabaseClient, createClient } from '@supabase/supabase-js'; // Añadir Supabase
import { environment } from '../../../../../environments/environment'; // Añadir environment

import { Announcement } from '../../../../core/domain/models/announcement.model'; // Importar el modelo Announcement

@Component({
    selector: 'app-announcement-form-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSelectModule,
        MatCheckboxModule,
        MatProgressBarModule // Añadir MatProgressBarModule aquí
    ],
    templateUrl: './announcement-form-dialog.component.html',
    styleUrls: ['./announcement-form-dialog.component.css']
})
export class AnnouncementFormDialogComponent implements OnInit {
    announcementForm: FormGroup;
    isEditMode: boolean;
    isLoading: boolean = false;
    errorMessage: string | null = null;
    /** Archivo seleccionado para adjuntar */
    selectedFile: File | null = null;
    /** URL del archivo adjunto existente (en modo edición) */
    existingAttachmentUrl: string | null = null;

    private supabase: SupabaseClient; // Instancia de Supabase

    constructor(
        public dialogRef: MatDialogRef<AnnouncementFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { announcement?: Announcement },
        private fb: FormBuilder
    ) {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey); // Inicializar Supabase

        this.announcementForm = this.fb.group({
            title: ['', Validators.required],
            content: [''],
            expiration_date: [null],
            is_published: [true],
            priority: [2, [Validators.required, Validators.min(1), Validators.max(3)]],
            // No agregamos 'attachment_url' al formulario reactivo directamente,
            // lo manejamos aparte para la carga/previsualización del archivo.
        });

        this.isEditMode = !!data.announcement;
        if (this.isEditMode && data.announcement) {
            this.announcementForm.patchValue({
                title: data.announcement.title,
                content: data.announcement.content,
                expiration_date: data.announcement.expiration_date ? new Date(data.announcement.expiration_date) : null,
                is_published: data.announcement.is_published,
                priority: data.announcement.priority
            });
            this.existingAttachmentUrl = data.announcement.attachment_url || null; // Cargar URL existente
        }
    }

    ngOnInit(): void { }

    /** Maneja la selección de archivo */
    onFileSelected(event: Event): void {
        const target = event.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            this.selectedFile = target.files[0];
            this.existingAttachmentUrl = null; // Si se selecciona un nuevo archivo, se anula la URL existente
        } else {
            this.selectedFile = null;
        }
    }

    /** Elimina el archivo seleccionado o el adjunto existente */
    removeAttachment(): void {
        this.selectedFile = null;
        this.existingAttachmentUrl = null;
        // Aquí podrías añadir lógica para eliminar el archivo del storage si estuvieras en modo edición
        // y el usuario lo eliminara y luego no guardara, pero para el MVP no es crítico.
    }

    async onSubmit(): Promise<void> {
        this.isLoading = true;
        this.errorMessage = null;

        if (this.announcementForm.invalid) {
            this.announcementForm.markAllAsTouched();
            this.errorMessage = 'Por favor, completa todos los campos obligatorios y corrige los errores.';
            this.isLoading = false;
            return;
        }

        const formValue = this.announcementForm.value;

        const expirationDateISO = formValue.expiration_date ?
            formValue.expiration_date.toISOString() :
            null;

        // Obtener usuario autenticado
        const { data: userData, error: userError } = await this.supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId || userError) {
            this.errorMessage = '⚠️ No se pudo obtener el ID del usuario. Inicia sesión nuevamente.';
            this.isLoading = false;
            return;
        }

        let attachmentUrl: string | null = this.existingAttachmentUrl; // Mantener la URL existente por defecto

        // 1️⃣ Subir archivo al bucket si se ha seleccionado uno nuevo
        if (this.selectedFile) {
            const sanitizedName = this.selectedFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const filePath = `${userId}/${Date.now()}_${sanitizedName}`;
            const { error: uploadError } = await this.supabase.storage
                .from('anuncios-adjuntos')
                .upload(filePath, this.selectedFile, { upsert: true }); // Usar upsert: true si se quiere sobrescribir un archivo con el mismo nombre

            if (uploadError) {
                this.errorMessage = 'Error al subir el archivo adjunto: ' + uploadError.message;
                this.isLoading = false;
                return;
            }

            const { data: publicData } = this.supabase.storage
                .from('anuncios-adjuntos')
                .getPublicUrl(filePath);
            attachmentUrl = publicData.publicUrl;
        } else if (this.selectedFile === null && this.existingAttachmentUrl !== null && !this.isEditMode) {
            // Caso para cuando se remueve el archivo en un nuevo anuncio antes de enviarlo
            attachmentUrl = null;
        } else if (this.isEditMode && this.selectedFile === null && this.existingAttachmentUrl === null) {
            // Caso en edición si se elimina el archivo adjunto, se actualiza la URL a null en la DB
            attachmentUrl = null;
        }


        // 2️⃣ Crear el objeto Announcement con los datos del formulario y la URL del adjunto
        const announcementData: Partial<Announcement> = {
            title: formValue.title,
            content: formValue.content,
            expiration_date: expirationDateISO,
            is_published: formValue.is_published,
            priority: formValue.priority,
            attachment_url: attachmentUrl // Añadir la URL del adjunto
        };

        // Si estamos en modo edición, añade el ID original
        if (this.isEditMode && this.data.announcement) {
            (announcementData as Announcement).id = this.data.announcement.id;
            // No enviamos author_id, created_at, updated_at desde aquí, Supabase y el Dashboard lo manejan.
        }

        this.dialogRef.close(announcementData); // Devuelve los datos al componente padre
        this.isLoading = false; // El loading final se gestiona en el componente padre
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    // Método para obtener el nombre del archivo desde la URL

    getFileNameFromUrl(url: string): string {
        if (!url) return '';
        try {
            return url.split('/').pop() || url;
        } catch {
            return url;
        }
    }
}