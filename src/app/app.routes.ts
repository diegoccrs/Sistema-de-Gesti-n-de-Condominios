// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component'; // Añadir
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component'; // Añadir
import { authGuard } from './auth/guards/auth.guard';
import { UnauthorizedComponent } from './auth/unauthorized/unauthorized.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },
  { path: 'auth/forgot-password', component: ForgotPasswordComponent }, // Nueva ruta
  { path: 'auth/reset-password', component: ResetPasswordComponent }, // Nueva ruta
  { path: 'unauthorized', component: UnauthorizedComponent },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '' }
];