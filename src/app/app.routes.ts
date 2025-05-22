// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component'; // <-- ¡Importar el RegisterComponent!

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent }, // <-- ¡Añadir la ruta de registro!
  // { path: 'auth/forgot-password', component: ForgotPasswordComponent },
  // ... otras rutas
  { path: '**', redirectTo: '' }
];