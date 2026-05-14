import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';

import { SIDEBAR_NAV_ITEMS } from '../../../core/config/navigation.config';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [AvatarModule, MenuModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent {
  @Input() title = '[Placeholder]';
  @Input() footerLabel = 'Konto';
  @Output() logoutClick = new EventEmitter<void>();
  protected readonly items: MenuItem[] = SIDEBAR_NAV_ITEMS;

  protected readonly logoutItem: MenuItem = {
    label: 'Logout',
    icon: 'pi pi-sign-out',
    command: () => this.logoutClick.emit()
  };
}
