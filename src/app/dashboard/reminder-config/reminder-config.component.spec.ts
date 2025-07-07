import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReminderConfigComponent } from './reminder-config.component';

describe('ReminderConfigComponent', () => {
  let component: ReminderConfigComponent;
  let fixture: ComponentFixture<ReminderConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReminderConfigComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReminderConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
