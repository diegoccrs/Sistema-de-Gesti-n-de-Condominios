import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
    readonly supabase: SupabaseClient = createClient(
        environment.supabaseUrl,
        environment.supabaseKey
    );
}