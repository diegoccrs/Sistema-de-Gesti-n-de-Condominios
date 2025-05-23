// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component'; // <-- ¡Importar el RegisterComponent!
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent }, // <-- ¡Añadir la ruta de registro!
  {
    path: 'auth/forgot-password',
    loadComponent: () =>
      import('./auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'auth/reset-password',
    loadComponent: () =>
      import('./auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  // ... otras rutas
  { path: '**', redirectTo: '' }
];