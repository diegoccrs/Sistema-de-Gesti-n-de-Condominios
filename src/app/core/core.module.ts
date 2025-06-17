import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from './infrastructure/supabase/supabase.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [
    SupabaseService
  ]
})
export class CoreModule { } 