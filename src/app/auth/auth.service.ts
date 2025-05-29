import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
    readonly supabase: SupabaseClient = createClient(
        environment.supabaseUrl,
        environment.supabaseKey
    );
    async updateUserMetadata(fullName: string) {
        const { error } = await this.supabase.auth.updateUser({
            data: { full_name: fullName },
        });
        if (error) throw error;
    }

    async updatePassword(newPassword: string) {
        const { error } = await this.supabase.auth.updateUser({
            password: newPassword,
        });
        if (error) throw error;
    }
}