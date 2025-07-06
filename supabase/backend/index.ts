// Backend Layer - Supabase Infrastructure
// This file exports all backend services, models, and infrastructure

// Infrastructure
export { SupabaseService } from './infrastructure/supabase.service';

// Services
export { PaymentService } from './services/payment.service';
export { DocumentService } from './services/document.service';
export { GoogleCalendarService } from './services/google-calendar.service';
export { LogicaService } from './services/logica.service';
export { ReminderConfigService } from './services/reminder-config.service';

// Models
export type { Announcement } from './models/announcement.model';
export type { Apartment } from './models/apartment.model';
export type { Building } from './models/building.model';
export type { CondoRules } from './models/condo-rules.model';
export type { Payment } from './models/payment.model';
export type { ProfileApartment } from './models/profile-apartment.model';
export type { Profile } from './models/profile.model';
export type { ServiceProvider } from './models/service-provider.model';
export type { Document } from './models/document.model';

// Data
export { CONDO_RULES } from './data/static-condo-rules';

// Types (re-exports for convenience)
export type { ProfileWithApartmentInfo } from './infrastructure/supabase.service';
