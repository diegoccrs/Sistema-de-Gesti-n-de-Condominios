import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // For loading indicator
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment'; 


@Component({
  selector: 'app-admin-create-resident',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule, // Import ReactiveFormsModule
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule, // Import MatFormFieldModule
    MatInputModule,     // Import MatInputModule
    MatIconModule,      // Import MatIconModule
    MatProgressSpinnerModule // Import MatProgressSpinnerModule
  ],
  templateUrl: './admin-create-resident.component.html',
  styleUrls: ['./admin-create-resident.component.css']
})
export class AdminCreateResidentComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private supabase: SupabaseClient;

  createResidentForm!: FormGroup; // Definite assignment assertion
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey); //
  }

  ngOnInit(): void {
    this.createResidentForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]], // Temporary password
      apartamento: [''] // Apartment number/identifier
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
    this.successMessage = null;

    const { email, password, firstName, lastName, apartamento } = this.createResidentForm.value;

    try {
      // Create the user in Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
        email: email!,
        password: password!,
        email_confirm: false, // As per HU-01 task
        user_metadata: {
          first_name: firstName, // Pass as user_metadata for potential trigger
          last_name: lastName,
          // Supabase best practice: Custom claims/roles are usually not in user_metadata directly for auth.
          // The role 'resident' should be set in the 'profiles' table.
          // Apartment info is also custom data, better for 'profiles' table.
        }
      });

      if (authError) {
        throw authError;
      }

      const newUserId = authData.user?.id;
      if (!newUserId) {
        throw new Error('No se pudo obtener el ID del usuario recién creado.');
      }

      // Explicitly insert/update the profile if Supabase trigger doesn't handle everything or needs specific role.
      // The trigger set up for public registration might not assign the 'resident' role by default
      // or might not include 'apartamento'.
      const { error: profileError } = await this.supabase
        .from('profiles')
        .upsert({
          id: newUserId,
          first_name: firstName,
          last_name: lastName,
          email: email, // Usually email is synced by trigger, but good to be explicit if needed
          role: 'resident',
          apartamento: apartamento
        }, { onConflict: 'id' }); // Use upsert to handle if trigger partially creates it

      if (profileError) {
        // If profile creation/update fails, consider if the auth user should be deleted
        // or if admin needs to manually fix. For now, just log error.
        console.error('Error creating/updating profile for new user:', profileError);
        this.errorMessage = `Usuario creado en Auth, pero hubo un error al guardar el perfil: ${profileError.message}. Por favor, revise en Supabase.`;
        // Not throwing here to still give a partial success message if auth user was created.
      }

      this.successMessage = 'Residente creado exitosamente. Pueden iniciar sesión con la contraseña temporal proporcionada.';
      this.createResidentForm.reset();
      // Optionally navigate away after a delay or on button click
      // setTimeout(() => this.router.navigate(['/dashboard']), 3000);

    } catch (error: any) {
      console.error('Error al crear residente:', error);
      if (error.message.includes('User already registered')) {
        this.errorMessage = 'Este correo electrónico ya está registrado.';
      } else if (error.message.includes('Password should be at least 6 characters')) {
        this.errorMessage = 'La contraseña temporal debe tener al menos 6 caracteres (Supabase default). Por favor, ingrese una más larga (recomendado 8+).';
      } else {
        this.errorMessage = `Error al crear residente: ${error.message}`;
      }
    } finally {
      this.isLoading = false;
    }
  }
}