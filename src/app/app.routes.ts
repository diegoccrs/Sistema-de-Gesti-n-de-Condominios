// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { authGuard } from './auth/guards/auth.guard'; // <<-- ¡Importa tu guard!

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },

  // --- Ruta para el Dashboard (carga perezosa de un Standalone Component con Guard) ---
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard] // <<-- ¡Aplica el guard aquí!
  },
  // --- Fin de la ruta del Dashboard ---

  { path: '**', redirectTo: '' }
];