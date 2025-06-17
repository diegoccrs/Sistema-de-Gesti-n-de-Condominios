import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagePaymentMethodsComponent } from './manage-payment-methods.component';

describe('ManagePaymentMethodsComponent', () => {
  let component: ManagePaymentMethodsComponent;
  let fixture: ComponentFixture<ManagePaymentMethodsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagePaymentMethodsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagePaymentMethodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
