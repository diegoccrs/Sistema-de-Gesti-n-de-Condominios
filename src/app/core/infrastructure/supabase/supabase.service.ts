// src/app/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject } from 'rxjs';
import { Payment } from '../../domain/models/payment.model';
import { Profile } from '../../domain/models/profile.model';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
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
    
    // Si el error es PGRST116, significa que no se encontraron filas (0 rows).
    // En este caso, no es un error real, sino una ausencia de datos, por lo que devolvemos null.
    // Si es cualquier otro tipo de error, lo relanzamos.
    if (error && error.code !== 'PGRST116') {
      console.error('Error al obtener el perfil (no PGRST116):', error);
      throw error;
    }
    return data; // Si no hay datos, data será null
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

  // ==================== PAYMENT METHODS ====================
  async getPaymentsByResident(residentId: string): Promise<Payment[]> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('resident_id', residentId)
      .order('due_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getAllPayments(): Promise<Payment[]> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });
    
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
    const today = new Date().toISOString().split('T')[0];
    
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
    return this.getPublicUrl('comprobantes', filePath);
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
      .channel('payments')
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

  // ==================== UTILITY METHODS ====================
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  }

  isPaymentOverdue(dueDate: string): boolean {
    const today = new Date();
    const due = new Date(dueDate);
    return due < today;
  }

  getDaysPastDue(dueDate: string): number {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}