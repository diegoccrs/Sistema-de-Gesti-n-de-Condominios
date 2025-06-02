import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCreateResidentComponent } from './admin-create-resident.component';

describe('AdminCreateResidentComponent', () => {
  let component: AdminCreateResidentComponent;
  let fixture: ComponentFixture<AdminCreateResidentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCreateResidentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCreateResidentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
