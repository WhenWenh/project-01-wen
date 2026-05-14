import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-favorite-toggle',
  standalone: true,
  templateUrl: './favorite-toggle.html',
  styleUrl: './favorite-toggle.css'
})
export class FavoriteToggleComponent {
  @Input() active = false;
  @Input() loading = false;
  @Input() activeLabel = 'Remove from favorites';
  @Input() inactiveLabel = 'Add to favorites';

  @Output() toggle = new EventEmitter<void>();
}
