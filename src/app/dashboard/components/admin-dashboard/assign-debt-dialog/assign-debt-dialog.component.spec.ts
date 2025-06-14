import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignDebtDialogComponent } from './assign-debt-dialog.component';

describe('AssignDebtDialogComponent', () => {
  let component: AssignDebtDialogComponent;
  let fixture: ComponentFixture<AssignDebtDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignDebtDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignDebtDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
