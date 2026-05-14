import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [PaginatorModule],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css'
})
export class PaginationComponent {
  @Input() first = 0;
  @Input() rows = 5;
  @Input() totalRecords = 0;
  @Input() currentPageReportTemplate = '{first} - {last} of {totalRecords}';
  @Output() pageChange = new EventEmitter<PaginatorState>();
}
