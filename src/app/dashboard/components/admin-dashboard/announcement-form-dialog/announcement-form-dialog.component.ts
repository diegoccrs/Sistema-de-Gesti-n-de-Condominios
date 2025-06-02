// src/app/dashboard/components/admin-dashboard/announcement-form-dialog/announcement-form-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // Usar ReactiveFormsModule
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker'; // Reintroducir Datepicker
import { MatNativeDateModule } from '@angular/material/core'; // Para MatDatepicker
import { MatSelectModule } from '@angular/material/select'; // Para el select de prioridad
import { MatCheckboxModule } from '@angular/material/checkbox'; // Para el checkbox de publicado
import { MatProgressBar } from '@angular/material/progress-bar';

import { Announcement } from '../../../../core/domain/models/announcement.model'; // Importar el modelo Announcement

@Component({
    selector: 'app-announcement-form-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule, // Cambiado de FormsModule a ReactiveFormsModule
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatDatepickerModule, // Añadir Datepicker
        MatNativeDateModule, // Añadir NativeDateModule
        MatSelectModule, // Añadir MatSelectModule
        MatCheckboxModule, // Añadir MatCheckboxModule
        MatProgressBar // Añadir MatProgressBar para el loading
    ],
    templateUrl: './announcement-form-dialog.component.html',
    styleUrls: ['./announcement-form-dialog.component.css']
})
export class AnnouncementFormDialogComponent implements OnInit {
    announcementForm: FormGroup; // Usamos FormGroup para Reactive Forms
    isEditMode: boolean; // Para saber si estamos editando o creando
    isLoading: boolean = false; // El loading lo manejará el componente padre (AdminDashboard)
    errorMessage: string | null = null; // El error lo manejará el componente padre

    constructor(
        public dialogRef: MatDialogRef<AnnouncementFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { announcement?: Announcement }, // Recibe un anuncio opcional
        private fb: FormBuilder // Inyectar FormBuilder
    ) {
        // Inicializar el formulario con FormBuilder
        this.announcementForm = this.fb.group({
            title: ['', Validators.required],
            content: [''],
            expiration_date: [null], // Se inicializa como null
            is_published: [true], // Por defecto publicado
            priority: [2, [Validators.required, Validators.min(1), Validators.max(3)]] // Por defecto prioridad 2
        });

        // Determinar si es modo edición
        this.isEditMode = !!data.announcement;
        if (this.isEditMode && data.announcement) {
            // Si es modo edición, precargar los datos del anuncio
            this.announcementForm.patchValue({
                title: data.announcement.title,
                content: data.announcement.content,
                // Convertir la fecha ISO string a objeto Date para el datepicker
                expiration_date: data.announcement.expiration_date ? new Date(data.announcement.expiration_date) : null,
                is_published: data.announcement.is_published,
                priority: data.announcement.priority
            });
        }
    }

    ngOnInit(): void {
        // No necesitamos lógica compleja aquí, el formulario ya está inicializado.
    }

    // Este método será llamado al enviar el formulario
    onSubmit(): void {
        if (this.announcementForm.valid) {
            const formValue = this.announcementForm.value;

            // Convertir la fecha de Date a ISO string antes de devolverla
            const expirationDateISO = formValue.expiration_date ?
                formValue.expiration_date.toISOString() :
                null;

            // Crear el objeto Announcement con los datos del formulario
            const announcementData: Partial<Announcement> = {
                title: formValue.title,
                content: formValue.content,
                expiration_date: expirationDateISO,
                is_published: formValue.is_published,
                priority: formValue.priority
            };

            // Si estamos en modo edición, añade el ID original
            if (this.isEditMode && this.data.announcement) {
                (announcementData as Announcement).id = this.data.announcement.id;
                // No enviamos author_id, created_at, updated_at desde aquí, Supabase y el Dashboard lo manejan.
            }

            this.dialogRef.close(announcementData); // Devuelve los datos al componente padre
        } else {
            this.announcementForm.markAllAsTouched(); // Marcar todos los campos como tocados para mostrar errores
            this.errorMessage = 'Por favor, completa todos los campos obligatorios y corrige los errores.';
        }
    }

    onNoClick(): void {
        this.dialogRef.close(); // Cierra el diálogo sin devolver datos
    }
}