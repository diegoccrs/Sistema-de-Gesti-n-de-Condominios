import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ManagePaymentMethodsComponent } from './components/manage-payment-methods/manage-payment-methods.component';
import { AddPaymentMethodComponent } from './components/add-payment-method/add-payment-method.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    ManagePaymentMethodsComponent,
    AddPaymentMethodComponent
  ],
  exports: []
})
export class DashboardModule { }