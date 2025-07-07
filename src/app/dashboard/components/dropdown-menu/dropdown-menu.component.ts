import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface MenuItem {
  label: string;
  icon?: string;
  action?: string;
  disabled?: boolean;
  divider?: boolean;
}

@Component({
  selector: 'app-dropdown-menu',
  templateUrl: './dropdown-menu.component.html',
  styleUrls: ['./dropdown-menu.component.css'], 
  imports: [CommonModule]   
})
export class DropdownMenuComponent {
  @Input() menuTitle: string = 'Menú';
  @Input() items: MenuItem[] = [];
  @Input() showArrow: boolean = true;
  @Input() buttonClass: string = 'default';
  @Output() itemSelected = new EventEmitter<string>();

  isOpen = false;

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  closeMenu() {
    this.isOpen = false;
  }

  handleClick(action: string | undefined) {
    if (action) {
      this.itemSelected.emit(action);
    }
    this.closeMenu();
  }
}