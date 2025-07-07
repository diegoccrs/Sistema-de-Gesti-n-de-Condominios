import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectResidentDialogComponent } from './select-resident-dialog.component';

describe('SelectResidentDialogComponent', () => {
  let component: SelectResidentDialogComponent;
  let fixture: ComponentFixture<SelectResidentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectResidentDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectResidentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
