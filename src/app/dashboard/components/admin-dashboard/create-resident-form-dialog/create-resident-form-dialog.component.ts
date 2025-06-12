import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog'; 

import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-create-resident-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './create-resident-form-dialog.component.html',
  styleUrls: ['./create-resident-form-dialog.component.css']
})
export class CreateResidentFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private supabase: SupabaseClient;

  createResidentForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<CreateResidentFormDialogComponent>,
  ) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  ngOnInit(): void {
    this.createResidentForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      apartment: ['', Validators.required] 
    });
  }

  async onSubmit(): Promise<void> {
    if (this.createResidentForm.invalid) {
      this.errorMessage = 'Por favor, complete todos los campos requeridos correctamente.';
      this.createResidentForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null; 

    const { email, password, firstName, lastName, apartment } = this.createResidentForm.value;

    try {
      const { data, error: authError } = await this.supabase.auth.signUp({ // Método de registro
        email: email!,
        password: password!,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            apartment: apartment 
          }
        }
      });

      if (authError) {
        throw authError; 
      }

      if (data.user === null && data.session === null) {
        this.successMessage = '✅ Registro exitoso. Por favor, revise su correo electrónico para confirmar su cuenta.';
        this.dialogRef.close({ success: true, message: this.successMessage });
      } else {
        this.dialogRef.close({ success: true, message: '✅ Residente registrado exitosamente.' });
      }

    } catch (error: any) {
      console.error('Error al registrar residente:', error);
      if (error.message.includes('User already registered')) {
        this.errorMessage = 'Este correo electrónico ya está registrado.';
      } else if (error.message.includes('Password should be at least 6 characters')) {
        this.errorMessage = 'La contraseña debe tener al menos 8 caracteres.';
      } else {
        this.errorMessage = `Error al registrar: ${error.message}`;
      }
    } finally {
      this.isLoading = false; 
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}