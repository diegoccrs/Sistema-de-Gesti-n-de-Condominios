import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaymentsConfirmationComponent } from './payments-confirmation.component';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

// Define an interface for the chainable object to help with 'this' typing
interface SupabaseChainableMock {
  _promiseData: any;
  _promiseError: any;
  setResponse(this: SupabaseChainableMock, data: any, error: any): SupabaseChainableMock;
  select: jasmine.Spy;
  update: jasmine.Spy;
  insert: jasmine.Spy;
  delete: jasmine.Spy;
  eq: jasmine.Spy;
  gte: jasmine.Spy;
  lte: jasmine.Spy;
  order: jasmine.Spy; // This will be configured to return a Promise
  then(this: SupabaseChainableMock, onFulfilled: (value: { data: any; error: any; }) => any, onRejected?: (reason: any) => any): Promise<any>;
}


// Mock for SupabaseClient
class MockSupabaseClient {
  auth = {
    getUser: jasmine.createSpy('getUser').and.returnValue(
      Promise.resolve({ data: { user: { id: 'admin-test-id' } as User }, error: null })
    )
  };

  from(tableName: string): SupabaseChainableMock {
    // `this` inside methods of chainableInstance will refer to chainableInstance
    const chainableInstance = {
      _promiseData: null,
      _promiseError: null,
      _tableName: tableName, // Keep track of table name for spy configuration

      setResponse: function (this: SupabaseChainableMock, data: any, error: any) {
        this._promiseData = data;
        this._promiseError = error;
        return this;
      },

      select: jasmine.createSpy('select').and.callFake(function (this: SupabaseChainableMock) {
        // Configure this spy in tests to return a Promise if it's terminal
        // For chaining, it returns itself.
        return this;
      }),
      update: jasmine.createSpy('update').and.callFake(function (this: SupabaseChainableMock) {
        return this;
      }),
      insert: jasmine.createSpy('insert').and.callFake(function (this: SupabaseChainableMock) {
        return this;
      }),
      delete: jasmine.createSpy('delete').and.callFake(function (this: SupabaseChainableMock) {
        return this;
      }),
      eq: jasmine.createSpy('eq').and.callFake(function (this: SupabaseChainableMock) {
        // If .eq() is terminal (e.g., after .update()), it should return a Promise.
        // This specific spy will be configured in tests for such cases.
        return this;
      }),
      gte: jasmine.createSpy('gte').and.callFake(function (this: SupabaseChainableMock) {
        return this;
      }),
      lte: jasmine.createSpy('lte').and.callFake(function (this: SupabaseChainableMock) {
        return this;
      }),
      order: jasmine.createSpy('order').and.callFake(function (this: SupabaseChainableMock) {
        // This is often terminal for SELECT queries, so it needs to return a Promise.
        // The actual Promise.resolve value will be set in the test spy configuration.
        // Returning 'this' here makes the default behavior chaining,
        // tests will override with .and.returnValue(Promise.resolve(...))
        return this;
      }),
      // Generic .then to make the chain awaitable.
      // The actual data/error should come from the spy configured for the terminal operation.
      then: function (this: SupabaseChainableMock, onFulfilled: (value: { data: any; error: any; }) => any, onRejected?: (reason: any) => any) {
        // This is a fallback. Ideally, the spy for the *actual* terminal method 
        // (like the 'order' spy or 'eq' spy after an update) is configured to return the promise.
        return Promise.resolve({ data: this._promiseData, error: this._promiseError }).then(onFulfilled, onRejected);
      }
    } as SupabaseChainableMock; // Cast to the interface

    return chainableInstance;
  }
}


describe('PaymentsConfirmationComponent', () => {
  let component: PaymentsConfirmationComponent;
  let fixture: ComponentFixture<PaymentsConfirmationComponent>;
  let supabaseMockInstance: MockSupabaseClient;
  let snackBarMock: jasmine.SpyObj<MatSnackBar>;
  let router: Router;

  const mockRawPaymentsData = [ /* ... your mock data as before ... */
    {
      id: 'payment1',
      profiles: { first_name: 'Juan', last_name: 'Pérez', email: 'juan@example.com' },
      amount: 100,
      currency: 'USD',
      reported_at: '2024-05-01T10:05:00Z',
      proof_url: 'http://example.com/proof1.pdf',
      status: 'pending_confirmation',
    },
    {
      id: 'payment2',
      profiles: { first_name: 'María', last_name: 'Gómez', email: 'maria@example.com' },
      amount: 50,
      currency: 'VES',
      reported_at: '2024-05-02T11:05:00Z',
      proof_url: null,
      status: 'pending_confirmation',
    },
  ];

  beforeEach(async () => {
    supabaseMockInstance = new MockSupabaseClient();
    spyOn(require('@supabase/supabase-js'), 'createClient').and.returnValue(supabaseMockInstance);

    snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [PaymentsConfirmationComponent, RouterTestingModule],
      providers: [
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentsConfirmationComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('cargarPagos', () => {
    it('should load payments successfully and map resident names', async () => {
      // Configure the 'order' spy (as it's terminal for this query chain)
      (supabaseMockInstance.from('payments').order as jasmine.Spy).and.returnValue(
        Promise.resolve({ data: mockRawPaymentsData, error: null })
      );

      await component.ngOnInit();

      const queryChain = supabaseMockInstance.from('payments');
      expect(queryChain.select).toHaveBeenCalledWith(jasmine.stringContaining('*,'));
      expect(queryChain.select).toHaveBeenCalledWith(jasmine.stringContaining('profiles ('));
      expect(queryChain.eq).toHaveBeenCalledWith('status', 'pending_confirmation');
      expect(queryChain.order).toHaveBeenCalledWith('reported_at', { ascending: true });

      expect(component.pagosPendientes.length).toBe(2);
      expect(component.pagosPendientes[0].resident_name).toBe('Juan Pérez');
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBeNull();
    });
    // ... other cargarPagos tests
  });

  describe('aprobarPago', () => {
    beforeEach(async () => {
      (supabaseMockInstance.from('payments').order as jasmine.Spy).and.returnValue(
        Promise.resolve({ data: [...mockRawPaymentsData], error: null }) // Initial load
      );
      await component.ngOnInit();
    });

    it('should approve payment successfully and refresh list', async () => {
      const updateChain = supabaseMockInstance.from('payments');
      // For update().eq(), the .eq() call is terminal and returns the promise
      (updateChain.eq as jasmine.Spy).and.returnValue(Promise.resolve({ error: null }));

      // Mock the refresh call to cargarPagos
      (supabaseMockInstance.from('payments').order as jasmine.Spy).and.callFake(() =>
        Promise.resolve({ data: mockRawPaymentsData.filter(p => p.id !== 'payment1'), error: null })
      );

      await component.aprobarPago('payment1');

      expect(updateChain.update).toHaveBeenCalledWith(jasmine.objectContaining({ status: 'approved' }));
      expect(updateChain.eq).toHaveBeenCalledWith('id', 'payment1');
      expect(component.errorMessage).toBeNull();
      expect(component.pagosPendientes.length).toBe(1);
    });
    // ... other aprobarPago tests
  });

  // ... other describe blocks for rechazarPago, openProof, goBackToAdminDashboard
});