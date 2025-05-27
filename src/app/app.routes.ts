// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
  // Página principal
  {
    path: '',
    title: 'Inicio',
    loadComponent: () => import('./landing/landing.component').then(m => m.LandingComponent)
  },

  // Rutas de autenticación
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        title: 'Iniciar Sesión',
        loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        title: 'Registro',
        loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: 'forgot-password',
        title: 'Recuperar Contraseña',
        loadComponent: () => import('./auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
      },
      {
        path: 'reset-password',
        title: 'Restablecer Contraseña',
        loadComponent: () => import('./auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
      }
    ]
  },

  // Dashboard principal
  {
    path: 'dashboard',
    title: 'Panel Principal',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },

  // Rutas de estado
  {
    path: 'unauthorized',
    title: 'Acceso no autorizado',
    loadComponent: () => import('./auth/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },

  // Redirecciones y comodín
  { path: '', redirectTo: '', pathMatch: 'full' },
  { path: '**', redirectTo: '', title: 'Página no encontrada' }
];