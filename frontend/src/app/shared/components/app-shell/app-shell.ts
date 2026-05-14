import { Component, EventEmitter, Input, Output } from '@angular/core';

import { SidebarComponent } from '../sidebar/sidebar';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css'
})
export class AppShellComponent {
  @Input() title = '[Placeholder]';
  @Input() footerLabel = 'Konto';
  @Output() logoutClick = new EventEmitter<void>();
}
