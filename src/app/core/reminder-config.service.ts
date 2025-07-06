import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ReminderConfigService {
    private supabase = createClient(
        environment.supabaseUrl,
        environment.supabaseKey,
    );

    async addReminderConfig(config: any): Promise<void> {
        const { error } = await this.supabase.from('reminder_config').insert([config]);
        if (error) throw error;
    }

}
