import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaymentsConfirmationComponent } from './payments-confirmation.component';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs'; // Para simular observables
import { NO_ERRORS_SCHEMA } from '@angular/core';

// Mock del SupabaseClient para evitar llamadas reales a la base de datos
class MockSupabaseClient {
  from(tableName: string) {
    return {
      select: jasmine.createSpy('select').and.returnValue(of({ data: [], error: null }).toPromise()),
      update: jasmine.createSpy('update').and.returnValue(of({ data: [], error: null }).toPromise()),
      eq: jasmine.createSpy('eq').and.returnValue(this), // Permite encadenar .eq()
    };
  }
  auth = {
    getUser: jasmine.createSpy('getUser').and.returnValue(of({ data: { user: { id: 'admin-test-id' } }, error: null }).toPromise()),
  };
}

// Mock de MatSnackBar
class MockMatSnackBar {
  open = jasmine.createSpy('open');
}

describe('PaymentsConfirmationComponent', () => {
  let component: PaymentsConfirmationComponent;
  let fixture: ComponentFixture<PaymentsConfirmationComponent>;
  let supabaseMock: MockSupabaseClient;
  let snackBarMock: MockMatSnackBar;

  const mockPendingPayments = [
    {
      id: 'payment1',
      resident_id: 'resident1',
      amount: 100,
      currency: 'USD',
      payment_date: '2024-05-01T10:00:00Z',
      proof_url: 'http://example.com/proof1.pdf',
      status: 'pending',
      reported_at: '2024-05-01T10:05:00Z',
      confirmed_by: null,
      confirmation_date: null,
      notes: null,
      profiles: { first_name: 'Juan', last_name: 'Pérez', email: 'juan@example.com' }
    },
    {
      id: 'payment2',
      resident_id: 'resident2',
      amount: 50,
      currency: 'VES',
      payment_date: '2024-05-02T11:00:00Z',
      proof_url: null,
      status: 'pending',
      reported_at: '2024-05-02T11:05:00Z',
      confirmed_by: null,
      confirmation_date: null,
      notes: null,
      profiles: { first_name: 'María', last_name: 'Gómez', email: 'maria@example.com' }
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentsConfirmationComponent], // Importa el componente standalone
      providers: [
        { provide: SupabaseClient, useClass: MockSupabaseClient }, // Provee el mock de Supabase
        { provide: MatSnackBar, useClass: MockMatSnackBar }, // Provee el mock de MatSnackBar
      ],
      schemas: [NO_ERRORS_SCHEMA], // Ignora elementos y atributos de Angular Material en las pruebas de bajo nivel
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentsConfirmationComponent);
    component = fixture.componentInstance;
    supabaseMock = TestBed.inject(SupabaseClient) as unknown as MockSupabaseClient;
    snackBarMock = TestBed.inject(MatSnackBar) as unknown as MockMatSnackBar;

    // Configura el mock para `createClient` que es usado en el constructor del componente
    spyOn(require('@supabase/supabase-js'), 'createClient').and.returnValue(supabaseMock);

    fixture.detectChanges(); // Ejecuta ngOnInit
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loadPendingPayments', () => {
    it('should load pending payments successfully', async () => {
      // Configurar el mock para que devuelva datos
      supabaseMock.from('payments').select.and.returnValue(Promise.resolve({ data: mockPendingPayments, error: null }));

      await component.loadPendingPayments();

      expect(supabaseMock.from('payments').select).toHaveBeenCalledWith(`
          *,
          profiles (
            first_name,
            last_name,
            email
          )
        `);
      expect(supabaseMock.from('payments').select().eq).toHaveBeenCalledWith('status', 'pending');
      expect(component.pendingPayments.length).toBe(2);
      expect(component.pendingPayments[0].resident_first_name).toBe('Juan');
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBeNull();
    });

    it('should handle error when loading payments', async () => {
      const mockError = new Error('Database error');
      supabaseMock.from('payments').select.and.returnValue(Promise.resolve({ data: null, error: mockError }));

      await component.loadPendingPayments();

      expect(component.pendingPayments.length).toBe(0);
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toContain('Database error');
      expect(snackBarMock.open).toHaveBeenCalledWith(jasmine.stringContaining('Database error'), 'Cerrar', jasmine.any(Object));
    });

    it('should show snackbar if no pending payments', async () => {
      supabaseMock.from('payments').select.and.returnValue(Promise.resolve({ data: [], error: null }));

      await component.loadPendingPayments();

      expect(component.pendingPayments.length).toBe(0);
      expect(snackBarMock.open).toHaveBeenCalledWith('No hay pagos pendientes por el momento.', 'Cerrar', jasmine.any(Object));
    });
  });

  describe('confirmPayment', () => {
    beforeEach(() => {
      // Simula que la carga inicial de pagos fue exitosa para que haya un pago para confirmar
      supabaseMock.from('payments').select.and.returnValue(Promise.resolve({ data: mockPendingPayments, error: null }));
      component.loadPendingPayments(); // Llama a esto para poblar pendingPayments
    });

    it('should confirm payment successfully', async () => {
      supabaseMock.from('payments').update.and.returnValue(Promise.resolve({ data: [], error: null }));
      supabaseMock.from('payments').select.and.returnValue(Promise.resolve({ data: [], error: null })); // Simula que ya no hay pendientes después de actualizar

      await component.confirmPayment('payment1');

      expect(supabaseMock.auth.getUser).toHaveBeenCalled();
      expect(supabaseMock.from('payments').update).toHaveBeenCalledWith(jasmine.objectContaining({
        status: 'confirmed',
        confirmed_by: 'admin-test-id',
        confirmation_date: jasmine.any(String), // Esperamos una cadena de fecha ISO
      }));
      expect(supabaseMock.from('payments').update().eq).toHaveBeenCalledWith('id', 'payment1');
      expect(snackBarMock.open).toHaveBeenCalledWith('Pago confirmado exitosamente.', 'Cerrar', jasmine.any(Object));
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBeNull();
      expect(component.pendingPayments.length).toBe(0); // Porque loadPendingPayments se llama de nuevo y devuelve vacío
    });

    it('should handle error when confirming payment', async () => {
      const mockError = new Error('Confirmation failed');
      supabaseMock.auth.getUser.and.returnValue(Promise.resolve({ data: { user: { id: 'admin-test-id' } }, error: null }));
      supabaseMock.from('payments').update.and.returnValue(Promise.resolve({ data: null, error: mockError }));

      await component.confirmPayment('payment1');

      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toContain('Confirmation failed');
      expect(snackBarMock.open).toHaveBeenCalledWith(jasmine.stringContaining('Confirmation failed'), 'Cerrar', jasmine.any(Object));
    });
  });

  describe('rejectPayment', () => {
    beforeEach(() => {
      // Simula que la carga inicial de pagos fue exitosa
      supabaseMock.from('payments').select.and.returnValue(Promise.resolve({ data: mockPendingPayments, error: null }));
      component.loadPendingPayments();
    });

    it('should reject payment successfully', async () => {
      supabaseMock.from('payments').update.and.returnValue(Promise.resolve({ data: [], error: null }));
      supabaseMock.from('payments').select.and.returnValue(Promise.resolve({ data: [], error: null })); // Simula que ya no hay pendientes

      await component.rejectPayment('payment2');

      expect(supabaseMock.auth.getUser).toHaveBeenCalled();
      expect(supabaseMock.from('payments').update).toHaveBeenCalledWith(jasmine.objectContaining({
        status: 'rejected',
        confirmed_by: 'admin-test-id',
        confirmation_date: jasmine.any(String),
      }));
      expect(supabaseMock.from('payments').update().eq).toHaveBeenCalledWith('id', 'payment2');
      expect(snackBarMock.open).toHaveBeenCalledWith('Pago rechazado.', 'Cerrar', jasmine.any(Object));
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBeNull();
      expect(component.pendingPayments.length).toBe(0);
    });
  });

  describe('openProof', () => {
    it('should open URL if proof_url is provided', () => {
      spyOn(window, 'open');
      component.openProof('http://test.com/proof.jpg');
      expect(window.open).toHaveBeenCalledWith('http://test.com/proof.jpg', '_blank');
    });

    it('should show snackbar if proof_url is null', () => {
      component.openProof(null);
      expect(snackBarMock.open).toHaveBeenCalledWith('No se encontró URL para el comprobante.', 'Cerrar', jasmine.any(Object));
    });
  });
});