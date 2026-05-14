import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { finalize } from 'rxjs';

import { AuthSessionService } from '../../../../core/services/auth-session.service';
import { AppShellComponent } from '../../../../shared/components/app-shell/app-shell';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';
import { AuthApiService } from '../../../auth/services/auth-api.service';
import { TourListResponse } from '../../../tours/models/tour.models';
import { TourApiService } from '../../../tours/services/tour-api.service';

@Component({
  selector: 'app-select-tour-log-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    AppShellComponent,
    PaginationComponent
  ],
  templateUrl: './select-tour-page.html',
  styleUrl: './select-tour-page.css'
})
export class SelectTourLogPage {
  protected readonly rows = 6;
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly searchTerm = signal('');
  protected readonly first = signal(0);
  protected readonly isLoadingTours = signal(true);
  protected readonly toursLoadError = signal('');
  protected readonly tours = signal<TourListResponse[]>([]);
  protected readonly filteredTours = computed(() => {
    const normalizedSearch = this.searchTerm().trim().toLowerCase();

    return this.tours().filter((tour) => {
      return normalizedSearch === '' || tour.name.toLowerCase().includes(normalizedSearch);
    });
  });
  protected readonly visibleTours = computed(() => {
    const first = this.first();
    return this.filteredTours().slice(first, first + this.rows);
  });
  protected isLoggingOut = false;

  private readonly authApi = inject(AuthApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly tourApi = inject(TourApiService);

  constructor() {
    this.searchControl.valueChanges.subscribe((value) => {
      this.searchTerm.set(value);
      this.first.set(0);
    });

    this.tourApi
      .list()
      .pipe(finalize(() => this.isLoadingTours.set(false)))
      .subscribe({
        next: (tours) => {
          this.tours.set(tours);
        },
        error: () => {
          this.toursLoadError.set('Tours could not be loaded.');
          this.tours.set([]);
        }
      });
  }

  protected logout(): void {
    this.isLoggingOut = true;

    this.authApi
      .logout()
      .pipe(finalize(() => (this.isLoggingOut = false)))
      .subscribe({
        next: () => {
          void this.router.navigateByUrl('/login');
        },
        error: () => {
          this.authSession.clearToken();
          void this.router.navigateByUrl('/login');
        }
      });
  }

  protected onPageChange(event: { first?: number }): void {
    this.first.set(event.first ?? 0);
  }

  protected goBack(): void {
    void this.router.navigateByUrl('/tour-logs');
  }

  protected selectTourForLog(tourId: string): void {
    void this.router.navigate(['/tour-logs/create', tourId]);
  }
}
