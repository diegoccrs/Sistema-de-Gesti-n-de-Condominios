import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TelegramModalComponent } from './telegram-modal.component';

describe('TelegramModalComponent', () => {
  let component: TelegramModalComponent;
  let fixture: ComponentFixture<TelegramModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TelegramModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TelegramModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
