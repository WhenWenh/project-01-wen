import { Component, Input } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';

@Component({
  selector: 'app-page-breadcrumb',
  standalone: true,
  imports: [BreadcrumbModule],
  templateUrl: './page-breadcrumb.html',
  styleUrl: './page-breadcrumb.css'
})
export class PageBreadcrumbComponent {
  @Input({ required: true }) items: MenuItem[] = [];
}
