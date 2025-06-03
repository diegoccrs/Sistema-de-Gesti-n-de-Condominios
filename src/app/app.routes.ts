import { Routes } from '@angular/router';

import { authGuard } from './auth/guards/auth.guard';
import { isAdminGuard } from './auth/guards/is-admin.guard';

// NOTA: No necesitamos importar AdminDashboardComponent ni ResidentDashboardComponent aquí si usamos lazy loading
// loadComponent para los componentes hijos.

export const routes: Routes = [
  // Página principal
  {
    path: '',
    title: 'Inicio',
    loadComponent: () => import('./dashboard/landing/landing.component').then(m => m.LandingComponent)
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
      },
    ]
  },

  // Dashboard principal y sus rutas hijas
  {
    path: 'dashboard',
    title: 'Panel Principal',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard], // Solo usuarios autenticados pueden acceder al dashboard base
    children: [
      {
        path: '', // Ruta por defecto cuando se navega a /dashboard
        redirectTo: 'admin-home', // Asumimos que el admin es el rol principal para la entrada
        pathMatch: 'full'
      },
      {
        path: 'admin-home', // Ruta específica para el panel del administrador
        title: 'Panel Admin',
        loadComponent: () => import('./dashboard/components/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        canActivate: [isAdminGuard] // Solo los administradores pueden acceder a este panel
      },
      {
        path: 'resident-home', // Ruta específica para el panel del residente
        title: 'Panel Residente',
        loadComponent: () => import('./dashboard/components/resident-dashboard/resident-dashboard.component').then(m => m.ResidentDashboardComponent),
        // Puedes agregar un isResidentGuard si es necesario, o dejar authGuard si es el comportamiento deseado
        canActivate: [authGuard]
      },
      {
        path: 'payments-confirmation', // La URL completa será /dashboard/payments-confirmation
        title: 'Confirmar Pagos',
        loadComponent: () => import('./dashboard/components/payments-confirmation/payments-confirmation.component').then(m => m.PaymentsConfirmationComponent),
        canActivate: [isAdminGuard] // Protegida solo para administradores
      },
      // Otras rutas hijas de gestión, por ejemplo:
      // {
      //   path: 'residents-management',
      //   title: 'Gestión de Residentes',
      //   loadComponent: () => import('./dashboard/components/admin-dashboard/residents-management/residents-management.component').then(m => m.ResidentsManagementComponent),
      //   canActivate: [isAdminGuard]
      // },
      // {
      //   path: 'announcements-management',
      //   title: 'Gestión de Anuncios',
      //   loadComponent: () => import('./dashboard/components/admin-dashboard/announcements-management/announcements-management.component').then(m => m.AnnouncementsManagementComponent),
      //   canActivate: [isAdminGuard]
      // }
    ]
  },

  // Rutas de estado
  {
    path: 'unauthorized',
    title: 'Acceso no autorizado',
    loadComponent: () => import('./auth/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },

  // Redirecciones y comodín (siempre al final)
  { path: '**', redirectTo: '', title: 'Página no encontrada' }
];