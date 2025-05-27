import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

const supabase: SupabaseClient = createClient(
  environment.supabaseUrl,
  environment.supabaseKey
);

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  isLoading = false;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  errorMessage: string | null = null;

  async login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage = 'Complete los campos correctamente';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const { email, password } = this.loginForm.value;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email!,
        password: password!
      });

      if (error) throw error;
      await this.handlePostLogin(data.user?.id);

    } catch (error: any) {
      this.handleLoginError(error);
    } finally {
      this.isLoading = false;
    }
  }

  private async handlePostLogin(userId?: string) {
    try {
      // Obtener rol desde Supabase
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile?.role) {
        // Forzar actualización de la sesión
        await supabase.auth.refreshSession();
        console.log('Rol asignado:', profile.role);
      }

      // Redirección garantizada
      this.router.navigate(['/dashboard'], { replaceUrl: true });

    } catch (error) {
      console.error('Error post-login:', error);
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }

  private handleLoginError(error: any) {
    console.error('Error de login:', error);
    
    if (error.message.includes('Invalid login credentials')) {
      this.errorMessage = 'Credenciales incorrectas';
    } else if (error.message.includes('Email not confirmed')) {
      this.errorMessage = 'Confirma tu correo primero';
    } else {
      this.errorMessage = 'Error inesperado. Intenta nuevamente';
    }
  }
}