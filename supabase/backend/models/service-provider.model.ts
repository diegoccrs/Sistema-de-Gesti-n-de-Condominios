// src/app/domain/models/service-provider.model.ts

export interface ServiceProvider {
  id: string;
  name: string;
  service_type: string;
  contact_info: string;
  description: string | null;
  created_at: string;
}