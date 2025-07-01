import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-telegram-modal',
  templateUrl: './telegram-modal.component.html',
})
export class TelegramModalComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { url: string }) {}
}
