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

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

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
  fb = inject(FormBuilder);
  router = inject(Router);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  errorMessage: string | null = null;

  constructor() {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && event === 'SIGNED_IN') {
        console.log('Usuario autenticado. Redirigiendo al dashboard...');
        await this.handleSuccessfulLogin(session.user?.id);
      }
    });
  }

  async login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage = 'Por favor complete todos los campos correctamente.';
      return;
    }

    this.errorMessage = null;
    const { email, password } = this.loginForm.value;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email!,
        password: password!
      });

      if (error) throw error;
      await this.handleSuccessfulLogin(data.user?.id);

    } catch (error: any) {
      console.error('Error de login:', error);
      this.handleLoginError(error);
    }
  }

  private async handleSuccessfulLogin(userId?: string) {
    try {
      // Obtener rol pero no usarlo para restringir acceso
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (data?.role) {
        localStorage.setItem('user_role', data.role.toLowerCase());
        console.log('Rol detectado:', data.role);
      }
      
      this.router.navigate(['/dashboard']);

    } catch (error) {
      console.warn('Error obteniendo rol:', error);
      this.router.navigate(['/dashboard']); // Redirigir igualmente
    }
  }

  private handleLoginError(error: any) {
    if (error.message.includes('Invalid login credentials')) {
      this.errorMessage = 'Credenciales inválidas. Verifique sus datos.';
    } else if (error.message.includes('Email not confirmed')) {
      this.errorMessage = 'Confirme su correo electrónico primero.';
    } else {
      this.errorMessage = 'Error inesperado. Intente nuevamente.';
    }
  }
}