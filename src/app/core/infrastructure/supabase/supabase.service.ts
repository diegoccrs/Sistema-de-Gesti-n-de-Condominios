// src/app/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment'; // ✅ RUTA ABSOLUTA CRÍTICA para environments
import { BehaviorSubject, Observable } from 'rxjs'; // Añadir Observable para consistencia

// Importaciones de modelos
import { Payment } from '../../domain/models/payment.model';
import { Profile } from '../../domain/models/profile.model';
import { Apartment } from '../../domain/models/apartment.model';
import { Building } from '../../domain/models/building.model';
import { ProfileApartment } from '../../domain/models/profile-apartment.model';
import { Announcement } from '../../domain/models/announcement.model'; // ✅ Importación corregida y consistente con el modelo

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public supabase: SupabaseClient; // ✅ Hacer público para que otros componentes puedan acceder al cliente si es necesario (ej. para realtime)
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.loadUser();
    this.setupAuthListener();
  }

  // ==================== AUTHENTICATION METHODS ====================
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
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
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

  // ==================== PROFILE METHODS ====================
  async getProfile(id: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error al obtener el perfil (no PGRST116):', error);
      throw error;
    }
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

  // ==================== INICIO: MÉTODOS PARA HU-08 (BÚSQUEDA DE VECINOS) ====================
  /**
   * Busca perfiles de usuarios por nombre (nombre o apellido) o número de apartamento.
   * Selecciona solo los campos públicos relevantes para la búsqueda de vecinos.
   * @param searchTerm El término de búsqueda (nombre, apellido o apartamento).
   * @returns Un Promise con la lista de perfiles encontrados o null en caso de error.
   */
  async searchProfiles(searchTerm: string): Promise<Profile[] | null> {
    try {
      // Seleccionamos específicamente las columnas que son necesarias y públicas.
      // Esto es crucial para la seguridad junto con la política RLS.
      const { data, error } = await this.supabase
        .from('profiles')
        .select('id, first_name, last_name, apartment') // ✅ Columnas a seleccionar
        // Usamos 'or' para buscar en cualquiera de las columnas (nombre, apellido, apartamento)
        // 'ilike' permite la búsqueda parcial e insensible a mayúsculas/minúsculas
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,apartment.ilike.%${searchTerm}%`); // ✅ Condición de búsqueda

      if (error) {
        throw error;
      }
      return data as unknown as Profile[];
    } catch (error) {
      console.error('Error al buscar perfiles de vecinos:', error); // Mensaje de error más específico
      return null;
    }
  }
  // ==================== FIN: MÉTODOS PARA HU-08 (BÚSQUEDA DE VECINOS) ====================

  // ==================== BUILDING METHODS (AÑADIDO PARA CREAR RESIDENTES) ====================
  /**
   * Obtiene todos los edificios disponibles.
   * Necesario para que el formulario de creación de residente pueda seleccionar edificios.
   * @returns Un array de objetos Building.
   */
  async getBuildings(): Promise<Building[]> {
    const { data, error } = await this.supabase
      .from('buildings')
      .select('*');

    if (error) {
      console.error('Error fetching buildings:', error);
      throw error;
    }
    return data as Building[];
  }

  // ==================== APARTMENT METHODS (AÑADIDO PARA CREAR RESIDENTES) ====================
  /**
   * Obtiene apartamentos, opcionalmente filtrados por `buildingId`.
   * Por defecto, solo trae apartamentos `is_occupied: false` para asignación de nuevos residentes.
   * @param buildingId Opcional: El ID del edificio para filtrar apartamentos.
   * @returns Un array de objetos Apartment.
   */
  async getApartments(buildingId?: string): Promise<Apartment[]> {
    let query = this.supabase
      .from('apartments')
      .select('*')
      .eq('is_occupied', false); // Solo trae apartamentos NO ocupados por defecto

    if (buildingId) {
      query = query.eq('building_id', buildingId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching apartments:', error);
      throw error;
    }
    return data as Apartment[];
  }

  /**
   * Actualiza el estado `is_occupied` para una lista de apartamentos.
   * Se usa cuando un apartamento es asignado a un residente para marcarlo como ocupado,
   * o para desocuparlo si un residente se va.
   * @param apartmentIds Array de IDs de apartamentos a actualizar.
   * @param isOccupied El nuevo estado de ocupación (true/false).
   */
  async updateApartmentOccupancy(apartmentIds: string[], isOccupied: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('apartments')
      .update({ is_occupied: isOccupied })
      .in('id', apartmentIds); // Permite actualizar múltiples apartamentos

    if (error) {
      console.error('Error updating apartment occupancy:', error);
      throw error;
    }
  }

  // ==================== PROFILE APARTMENT METHODS (AÑADIDO PARA CREAR RESIDENTES) ====================
  /**
   * Crea múltiples registros en la tabla de unión `profile_apartments`.
   * Esta tabla relaciona un perfil con uno o más apartamentos y define el tipo de relación.
   * @param profileApartments Un array de objetos ProfileApartment (sin 'created_at' ya que Supabase lo añade).
   * @returns Un array de los objetos ProfileApartment insertados.
   */
  async createProfileApartments(profileApartments: Omit<ProfileApartment, 'created_at'>[]): Promise<ProfileApartment[]> {
    const { data, error } = await this.supabase
      .from('profile_apartments')
      .insert(profileApartments)
      .select(); // Importante para devolver los datos insertados, incluyendo el 'created_at'

    if (error) {
      console.error('Error creating profile apartments:', error);
      throw error;
    }
    return data as ProfileApartment[];
  }

  // ==================== PAYMENT METHODS ====================
  async getPaymentsByResident(
    residentId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Payment[]> {
    let query = this.supabase
      .from('payments')
      .select('*')
      .eq('resident_id', residentId);

    if (startDate) {
      query = query.gte('payment_date', startDate);
    }
    if (endDate) {

      query = query.lte('payment_date', endDate);
    }

    // Order by payment_date (or another relevant date like created_at/reported_at)
    query = query.order('payment_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error in getPaymentsByResident:', error);
      throw error;
    }
    return data || [];
  }

  async getAllPayments(): Promise<Payment[]> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .order('reported_at', { ascending: false });

    if (error) {

      console.error('Supabase error in getAllPayments:', error);
      throw error;
    }
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

  // ==================== FILE UPLOAD METHODS ====================
  async uploadReceipt(paymentId: string, file: File): Promise<string> {
    const filePath = `receipts/${paymentId}/${Date.now()}_${file.name}`;
    const { data, error } = await this.supabase.storage
      .from('comprobantes')
      .upload(filePath, file);

    if (error) throw error;
    // data.path contiene el path del archivo subido dentro del bucket
    return this.getPublicUrl('comprobantes', data.path);
  }

  getPublicUrl(bucket: string, filePath: string): string {
    const { data: { publicUrl } } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  subscribeToPayments(callback: (payload: any) => void) {
    return this.supabase
      .channel('payments_changes') // Nombre de canal único
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

  // ==================== ANNOUNCEMENT METHODS ====================
  async getAnnouncements(): Promise<Announcement[]> {
    const { data, error } = await this.supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching announcements:', error);
      throw error;
    }
    return data || [];
  }

  async createAnnouncement(announcement: Omit<Announcement, 'id' | 'created_at' | 'updated_at'> & { author_id: string }): Promise<Announcement> {
    const { data, error } = await this.supabase
      .from('announcements')
      .insert(announcement)
      .select()
      .single();

    if (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
    return data;
  }

  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement> {
    const { data, error } = await this.supabase
      .from('announcements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
    return data;
  }

  async deleteAnnouncement(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================
  formatCurrency(amount: number, currency: string = 'VES'): string {
    // Puedes extender esto para manejar USD, EUR, etc.
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  isPaymentOverdue(dueDate: string): boolean {
    const today = new Date();
    const due = new Date(dueDate);
    // Comparar solo las fechas, ignorando la hora
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }

  getDaysPastDue(dueDate: string): number {
    const today = new Date();
    const due = new Date(dueDate);
    // Asegurarse de que las fechas sean solo fechas para el cálculo de días exactos
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - due.getTime();
    if (diffTime <= 0) return 0; // No está vencido o es hoy
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Usar floor para días completos
  }
}