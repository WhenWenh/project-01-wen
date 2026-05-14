import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css'
})
export class ConfirmDialogComponent {
  @Input() visible = false;
  @Input() title = 'Unsaved changes';
  @Input() message = 'Do you really want to leave this page?';
  @Input() confirmLabel = 'Leave page';
  @Input() cancelLabel = 'Stay';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
