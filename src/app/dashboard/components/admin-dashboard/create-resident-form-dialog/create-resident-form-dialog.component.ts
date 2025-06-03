// src/app/dashboard/components/create-resident-form-dialog/create-resident-form-dialog.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog'; // No se necesita MAT_DIALOG_DATA si no pasas datos

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
  // successMessage ya no se usa para cerrar el diálogo al éxito
  // Se usa para informar al usuario sobre la confirmación de email
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
      // Para auto-registro, la contraseña es la que el usuario usará
      password: ['', [Validators.required, Validators.minLength(8)]],
      apartment: [''] // Campo opcional
    });
  }

  async onSubmit(): Promise<void> {
    // Si el formulario es inválido, muestra el mensaje de error y marca los campos como tocados
    if (this.createResidentForm.invalid) {
      this.errorMessage = 'Por favor, complete todos los campos requeridos correctamente.';
      this.createResidentForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null; // Reinicia el mensaje de error en cada intento

    // Extrae los valores del formulario
    const { email, password, firstName, lastName, apartment } = this.createResidentForm.value;

    try {
      // Intenta registrar al usuario en Supabase Auth
      const { data, error: authError } = await this.supabase.auth.signUp({
        email: email!,
        password: password!,
        options: {
          // Pasa metadatos del usuario. Supabase los guardará en `raw_user_meta_data`.
          // El trigger los leerá para crear el perfil en 'profiles'.
          data: {
            first_name: firstName,
            last_name: lastName,
            apartment: apartment // Pasa el apartment también en los metadatos
          }
        }
      });

      if (authError) {
        throw authError; // Lanza el error si la autenticación falla
      }

      // Si el registro es exitoso pero el usuario necesita confirmar el email
      if (data.user === null && data.session === null) {
        this.successMessage = '✅ Registro exitoso. Por favor, revise su correo electrónico para confirmar su cuenta.';
        // No cerramos el diálogo aquí, permitimos que el usuario vea el mensaje.
        // Opcional: Podrías cerrar el diálogo con un mensaje de éxito para el componente padre.
        this.dialogRef.close({ success: true, message: this.successMessage });
      } else {
        // Si no se requiere confirmación de email (Supabase configurado así)
        // o si el usuario ya fue creado y la sesión fue obtenida.
        // En este escenario, el trigger ya debería haber creado el perfil.
        this.dialogRef.close({ success: true, message: '✅ Residente registrado exitosamente.' });
      }

    } catch (error: any) {
      console.error('Error al registrar residente:', error);
      // Manejo de errores específicos de Supabase
      if (error.message.includes('User already registered')) {
        this.errorMessage = 'Este correo electrónico ya está registrado.';
      } else if (error.message.includes('Password should be at least 6 characters')) {
        // Aunque tenemos minLength(8) en el frontend, Supabase puede tener su propio mínimo (por defecto 6)
        this.errorMessage = 'La contraseña debe tener al menos 8 caracteres.';
      } else {
        this.errorMessage = `Error al registrar: ${error.message}`;
      }
    } finally {
      this.isLoading = false; // Desactiva el spinner de carga
    }
  }

  // Cierra el diálogo sin realizar ninguna acción
  onNoClick(): void {
    this.dialogRef.close();
  }
}