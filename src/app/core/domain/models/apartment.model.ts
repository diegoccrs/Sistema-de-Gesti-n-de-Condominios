export interface Apartment {
  id: string;
  building_id: string;
  apartment_number: string;
  floor?: string;
  number_of_bedrooms?: number;
  number_of_bathrooms?: number;
  square_meters?: number;
  is_occupied: boolean;
  
  created_at: string;
  updated_at?: string;
}