import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../src/environments/environment';
import { Payment } from '../models/payment.model';
import { Profile } from '../models/profile.model';
import { Apartment } from '../models/apartment.model';
import { Building } from '../models/building.model';
import { ProfileApartment } from '../models/profile-apartment.model';
import { Announcement } from '../models/announcement.model';
import { ServiceProvider } from '../models/service-provider.model';


export interface ProfileWithApartmentInfo extends Profile {
  apartment_info?: {
    apartment_number: string;
    floor?: string;
    building_name?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  public supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.loadUser();
    this.setupAuthListener();
  }

  private async loadUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    this.currentUserSubject.next(user);
  }

  private setupAuthListener() {
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.currentUserSubject.next(session?.user ?? null);
    });
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async signUp(email: string, password: string, metadata: any) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  async getSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session;
  }

  async getProfile(id: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async updateProfile(id: string, updates: Partial<Profile>) {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async searchProfiles(searchTerm: string = ''): Promise<ProfileWithApartmentInfo[]> {
    if (searchTerm) {
      const { data, error } = await this.supabase
        .rpc('search_profiles_with_apartment_info', { search_term: searchTerm });

      if (error) throw error;
      return data
        .filter((row: any) => row.role === 'resident')
        .map((row: any) => ({
          id: row.id,
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email,
          role: row.role,
          apartment_info: row.apartment_number ? {
            apartment_number: row.apartment_number,
            floor: row.floor,
            building_name: row.building_name
          } : undefined
        }));
    } else {
      const { data, error } = await this.supabase
        .from('profiles')
        .select(`
          *,
          profile_apartments!left(
            apartment_id,
            apartments!left(
              apartment_number,
              floor,
              building_id,
              buildings!left(name)
            )
          )
        `)
        .eq('role', 'resident')
        .order('first_name', { ascending: true });

      if (error) throw error;
      return data.map(profile => {
        const rawApartmentInfo = profile.profile_apartments?.[0]?.apartments;
        return {
          ...profile,
          apartment_info: rawApartmentInfo ? {
            apartment_number: rawApartmentInfo.apartment_number,
            floor: rawApartmentInfo.floor,
            building_name: rawApartmentInfo.buildings?.name
          } : undefined
        };
      });
    }
  }

  async deleteProfile(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getBuildings(): Promise<Building[] | null> {
    const { data, error } = await this.supabase
      .from('buildings')
      .select('*')
      .order('name', { ascending: true });
    if (error) return null;
    return data;
  }

  async getApartmentsByBuildingId(buildingId: string): Promise<Apartment[] | null> {
    const { data, error } = await this.supabase
      .from('apartments')
      .select('*')
      .eq('building_id', buildingId)
      .order('apartment_number', { ascending: true });
    if (error) return null;
    return data;
  }

  async getProfileApartments(profileId: string): Promise<Apartment[] | null> {
    const { data, error } = await this.supabase
      .from('profile_apartments')
      .select('apartments(*)')
      .eq('profile_id', profileId);

    if (error) return null;
    return data.map((item: any) => item.apartments);
  }

  async updateProfileApartments(
    profileId: string,
    apartmentIds: string[]
  ): Promise<void> {
    // Eliminar relaciones existentes
    await this.supabase
      .from('profile_apartments')
      .delete()
      .eq('profile_id', profileId);

    // Crear nuevas relaciones
    const relations = apartmentIds.map(apartmentId => ({
      profile_id: profileId,
      apartment_id: apartmentId
    }));

    const { error } = await this.supabase
      .from('profile_apartments')
      .insert(relations);

    if (error) throw error;
  }

  async getApartments(buildingId?: string): Promise<Apartment[]> {
    let query = this.supabase
      .from('apartments')
      .select('*')
      .eq('is_occupied', false);

    if (buildingId) query = query.eq('building_id', buildingId);
    const { data, error } = await query;
    if (error) throw error;
    return data as Apartment[];
  }

  async updateApartmentOccupancy(apartmentIds: string[], isOccupied: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('apartments')
      .update({ is_occupied: isOccupied })
      .in('id', apartmentIds);
    if (error) throw error;
  }

  async createProfileApartments(profileApartments: Omit<ProfileApartment, 'created_at'>[]): Promise<ProfileApartment[]> {
    const { data, error } = await this.supabase
      .from('profile_apartments')
      .insert(profileApartments)
      .select();
    if (error) throw error;
    return data as ProfileApartment[];
  }

  async getPaymentsByResident(residentId: string, startDate?: string, endDate?: string): Promise<Payment[]> {
    let query = this.supabase
      .from('payments')
      .select('*')
      .eq('resident_id', residentId)
      .order('payment_date', { ascending: false });

    if (startDate) query = query.gte('payment_date', startDate);
    if (endDate) query = query.lte('payment_date', endDate);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getAllPayments(): Promise<Payment[]> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .order('reported_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getPaymentById(id: string): Promise<Payment | null> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async createPayment(payment: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> {
    const { data, error } = await this.supabase
      .from('payments')
      .insert(payment)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updatePaymentStatus(
    id: string,
    status: Payment['status'],
    paymentDate?: string,
    receiptUrl?: string,
    verifiedBy?: string
  ): Promise<Payment> {
    const updates: any = { status };
    if (paymentDate) updates.payment_date = paymentDate;
    if (receiptUrl) updates.receipt_url = receiptUrl;
    if (verifiedBy) updates.verified_by = verifiedBy;

    const { data, error } = await this.supabase
      .from('payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getPendingPayments(): Promise<Payment[]> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('status', 'pending')
      .order('due_date', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async getOverduePayments(): Promise<Payment[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('status', 'pending')
      .lt('due_date', today)
      .order('due_date', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async uploadReceipt(paymentId: string, file: File): Promise<string> {
    const filePath = `receipts/${paymentId}/${Date.now()}_${file.name}`;
    const { data, error } = await this.supabase.storage
      .from('comprobantes')
      .upload(filePath, file);
    if (error) throw error;
    return this.getPublicUrl('comprobantes', data.path);
  }

  getPublicUrl(bucket: string, filePath: string): string {
    const { data: { publicUrl } } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    return publicUrl;
  }

  subscribeToPayments(callback: (payload: any) => void) {
    return this.supabase
      .channel('payments_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        callback
      )
      .subscribe();
  }

  subscribeToUserPayments(residentId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel(`payments:resident_id=eq.${residentId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `resident_id=eq.${residentId}`
        },
        callback
      )
      .subscribe();
  }

  async getAnnouncements(): Promise<Announcement[]> {
    const { data, error } = await this.supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async createAnnouncement(announcement: Omit<Announcement, 'id' | 'created_at' | 'updated_at'> & { author_id: string }): Promise<Announcement> {
    const { data, error } = await this.supabase
      .from('announcements')
      .insert(announcement)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement> {
    const { data, error } = await this.supabase
      .from('announcements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteAnnouncement(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('announcements')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  formatCurrency(amount: number, currency: string = 'VES'): string {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  isPaymentOverdue(dueDate: string): boolean {
    const today = new Date();
    const due = new Date(dueDate);
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }

  getDaysPastDue(dueDate: string): number {
    const today = new Date();
    const due = new Date(dueDate);
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - due.getTime();
    if (diffTime <= 0) return 0;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  async insertPayment(payment: {
    resident_id: string;
    concept: string;
    amount: number;
    status: string;
    currency: string;
    payment_date: string;
    expiration_date: string | null ; // ← ✅ AGREGA ESTO
    proof_url: string | null;
    reported_at: string | null;
  }): Promise<any> {
    const { data, error } = await this.supabase
      .from('payments')
      .insert([payment]);
    if (error) {
      throw error;
    }
    return data;
  }

  async getAllResidents() {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('role', 'resident');

    if (error) throw error;
    return data;
  }

  /**
   * Obtiene la lista de proveedores de servicios de la base de datos.
   * @returns Una promesa que resuelve con un array de ServiceProvider o null en caso de error.
   */
  async getServiceProviders(): Promise<ServiceProvider[] | null> {
    try {
      const { data, error } = await this.supabase
        .from('service_providers') // Nombre de la tabla que creamos
        .select('*'); // Selecciona todas las columnas

      if (error) {
        console.error('Error fetching service providers:', error.message);
        return null;
      }
      return data as ServiceProvider[];
    } catch (error) {
      console.error('Unexpected error in getServiceProviders:', error);
      return null;
    }
  }
}