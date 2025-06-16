import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon'; // Añadir para íconos
import { MatProgressBarModule } from '@angular/material/progress-bar'; // Añadir barra de progreso

const supabase: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseKey);

@Component({
  selector: 'app-payment-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule, // Añadir
    MatProgressBarModule // Añadir
  ],
  templateUrl: './payment-register.component.html',
  styleUrls: ['./payment-register.component.css']
})
export class PaymentRegisterComponent implements OnInit {
  paymentForm: FormGroup;
  isLoading: boolean = false;
  selectedFile: File | null = null; // Archivo seleccionado para comprobante

  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  constructor(
    public dialogRef: MatDialogRef<PaymentRegisterComponent>,
  ) {
    this.paymentForm = this.fb.group({
      concept: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      currency: ['VES', Validators.required],
      payment_date: [new Date(), Validators.required],
      proof_url: [''],
      notes: ['']
    });
  }

  ngOnInit(): void { }

  /** Maneja la selección de archivo para el comprobante */
  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.selectedFile = target.files[0];
    } else {
      this.selectedFile = null;
    }
  }

  /** Elimina el archivo seleccionado */
  removeFile(): void {
    this.selectedFile = null;
  }

  async onSubmit() {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      this.snackBar.open('Por favor, complete todos los campos requeridos.', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        this.isLoading = false;
        this.snackBar.open('Usuario no autenticado. Por favor, inicie sesión de nuevo.', 'Cerrar', { duration: 5000, panelClass: ['snackbar-error'] });
        this.dialogRef.close({ error: 'User not authenticated' });
        return;
      }

      let proofUrl: string | null = null;

      // 1. Subir archivo si existe
      if (this.selectedFile) {
        // Verificar tamaño del archivo (5MB máximo)
        if (this.selectedFile.size > 5 * 1024 * 1024) {
          this.snackBar.open('El archivo es demasiado grande (máx. 5MB)', 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-error']
          });
          this.isLoading = false;
          return;
        }

        // Sanitizar nombre de archivo
        const sanitizedName = this.selectedFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const filePath = `${user.id}/comprobantes/${Date.now()}_${sanitizedName}`;

        // Subir a Supabase Storage con manejo detallado de errores
        const uploadResult = await supabase.storage
          .from('comprobantes-pago')
          .upload(filePath, this.selectedFile);

        if (uploadResult.error) {
          console.error('Error al subir comprobante:', uploadResult.error);

          // Mensajes de error más específicos
          let errorMessage = 'Error al subir comprobante';
          if (uploadResult.error.message.includes('not found')) {
            errorMessage += ': El bucket de almacenamiento no existe';
          } else if (uploadResult.error.message.includes('size')) {
            errorMessage += ': El archivo es demasiado grande';
          } else {
            errorMessage += `: ${uploadResult.error.message}`;
          }

          this.snackBar.open(errorMessage, 'Cerrar', {
            duration: 5000,
            panelClass: ['snackbar-error']
          });
          this.isLoading = false;
          return;
        }

        // Obtener URL pública
        const publicUrlResult = supabase.storage
          .from('comprobantes-pago')
          .getPublicUrl(filePath);

        proofUrl = publicUrlResult.data.publicUrl;
      }

      // 2. Preparar datos del pago
      const formValue = this.paymentForm.value;
      const paymentData = {
        resident_id: user.id,
        concept: formValue.concept,
        amount: formValue.amount,
        currency: formValue.currency,
        payment_date: new Date(formValue.payment_date).toISOString(),
        status: 'pending',
        reported_at: new Date().toISOString(),
        proof_url: proofUrl, // Usar la URL obtenida
        notes: formValue.notes || null,
      };

      // 3. Insertar en la base de datos
      const { error } = await supabase.from('payments').insert([paymentData]);

      this.isLoading = false;
      if (error) {
        console.error('Error al registrar el pago:', error);
        this.snackBar.open(`Error al registrar el pago: ${error.message}`, 'Cerrar', { duration: 5000, panelClass: ['snackbar-error'] });
        this.dialogRef.close({ error: error.message });
      } else {
        this.snackBar.open('Pago registrado exitosamente', 'Cerrar', { duration: 3000 });
        this.dialogRef.close({ success: true });
      }
    } catch (e) {
      this.isLoading = false;
      console.error('Error inesperado en onSubmit:', e);
      this.snackBar.open('Ocurrió un error inesperado.', 'Cerrar', { duration: 5000, panelClass: ['snackbar-error'] });
      this.dialogRef.close({ error: 'Unexpected error' });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}