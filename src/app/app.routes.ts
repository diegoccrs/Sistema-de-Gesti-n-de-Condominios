import { Routes } from '@angular/router';
import { PaymentsConfirmationComponent } from './dashboard/components/payments-confirmation/payments-confirmation.component';


import { authGuard } from './auth/guards/auth.guard';
import { isAdminGuard } from './auth/guards/is-admin.guard';
import { ManagePaymentMethodsComponent } from './dashboard/components/manage-payment-methods/manage-payment-methods.component';

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
      // {
      //   path: '', // Ruta por defecto cuando se navega a /dashboard
      //   pathMatch: 'full'
      // },
      {
        path: 'admin-home', // Ruta específica para el panel del administrador
        title: 'Panel Admin',
        loadComponent: () => import('./dashboard/components/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        canActivate: [isAdminGuard] // Solo los administradores pueden acceder a este panel
      },
      {
        path: 'admin/reminders',
        loadComponent: () => import('./dashboard/reminder-config/reminder-config.component').then(m => m.ReminderConfigComponent)
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
      {
        path: 'add-payment-method', // Make sure this route is a child of a protected route
        title: 'Add Payment Method', // Added title for consistency
        loadComponent: () => import('./dashboard/components/add-payment-method/add-payment-method.component').then(m => m.AddPaymentMethodComponent)
        // canActivate is inherited from the parent, so it's also protected by authGuard
      },
      {
        path: 'payment-methods',
        title: 'Payment Methods', // Added title
        loadComponent: () => import('./dashboard/components/manage-payment-methods/manage-payment-methods.component').then(m => m.ManagePaymentMethodsComponent), // Changed to loadComponent
        canActivate: [authGuard] // Added canActivate guard
      },
      {
        path: 'providers', // La URL completa será /dashboard/proveedores
        title: 'Services Providers',
        loadComponent: () => import('./dashboard/components/resident-dashboard/services-provider/service-provider.component').then(m => m.ServiceProvidersComponent),
        canActivate: [authGuard] // Accesible para cualquier usuario autenticado
      },
      {
        path: 'normas', // La URL completa será /dashboard/normas
        title: 'Normas del Condominio',
        loadComponent: () => import('./dashboard/components/condo-rules-page/condo-rules-page.component').then(m => m.CondoRulesPageComponent),
        canActivate: [authGuard] // Accesible para cualquier usuario autenticado
      },
      {
        path: 'documents', // La URL completa será /dashboard/documents
        title: 'Documentos del Condominio',
        loadComponent: () => import('./dashboard/components/documents/documents.component').then(m => m.DocumentsComponent),
        canActivate: [authGuard] // Accesible para cualquier usuario autenticado
      },
      {
        path: 'feedback', // La URL completa será /dashboard/feedback
        title: 'Reportar Problema',
        loadComponent: () => import('./feedback/feedback.component').then(m => m.FeedbackComponent),
        canActivate: [authGuard] // Accesible para cualquier usuario autenticado
      }
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