import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-image-preview-dialog',
  standalone: true,
  templateUrl: './image-preview-dialog.html',
  styleUrl: './image-preview-dialog.css'
})
export class ImagePreviewDialogComponent {
  @Input() visible = false;
  @Input() title = 'Image Preview';
  @Input() imageUrl: string | null = null;
  @Input() imageAlt = 'Preview image';

  @Output() close = new EventEmitter<void>();
}
