import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConectarTelegramComponent } from './conectar-telegram.component';

describe('ConectarTelegramComponent', () => {
  let component: ConectarTelegramComponent;
  let fixture: ComponentFixture<ConectarTelegramComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConectarTelegramComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConectarTelegramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
