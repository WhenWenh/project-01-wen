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
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';
import { AuthApiService } from '../../../auth/services/auth-api.service';
import { TourListItem } from '../../../tours/models/tour.models';
import { TourApiService } from '../../../tours/services/tour-api.service';
import { TourLogResponse } from '../../models/tour-log.models';
import { TourLogApiService } from '../../services/tour-log-api.service';

interface TourLogTourCard extends TourListItem {
  logCount: number | null;
  isLoadingCount: boolean;
  hasCountError: boolean;
  logs: TourLogResponse[];
  isExpanded: boolean;
  isLoadingLogs: boolean;
  logsLoaded: boolean;
  logsLoadError: string;
}

interface SelectedLogForDelete {
  log: TourLogResponse;
  tourId: string;
  tourName: string;
}

@Component({
  selector: 'app-tour-logs-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    AppShellComponent,
    ConfirmDialogComponent,
    PaginationComponent
  ],
  templateUrl: './tour-logs-page.html',
  styleUrl: './tour-logs-page.css'
})
export class TourLogsPage {
  protected readonly rows = 5;
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly searchTerm = signal('');
  protected isLoggingOut = false;
  protected readonly first = signal(0);
  protected readonly isLoadingTours = signal(true);
  protected readonly toursLoadError = signal('');
  protected readonly tourCards = signal<TourLogTourCard[]>([]);
  protected readonly showDeleteDialog = signal(false);
  protected readonly isDeletingLog = signal(false);
  protected readonly selectedLogForDelete = signal<SelectedLogForDelete | null>(null);
  protected readonly hasTours = computed(() => this.tourCards().length > 0);
  protected readonly filteredTourCards = computed(() => {
    const normalizedSearch = this.searchTerm().trim().toLowerCase();

    return this.tourCards().filter((card) => {
      return normalizedSearch === '' || card.name.toLowerCase().includes(normalizedSearch);
    });
  });
  protected readonly visibleTourCards = computed(() => {
    const first = this.first();
    return this.filteredTourCards().slice(first, first + this.rows);
  });

  private readonly authApi = inject(AuthApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly tourApi = inject(TourApiService);
  private readonly tourLogApi = inject(TourLogApiService);

  constructor() {
    this.searchControl.valueChanges.subscribe((value) => {
      this.searchTerm.set(value);
      this.first.set(0);
    });

    this.loadTours();
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

  protected openSelectTour(): void {
    void this.router.navigateByUrl('/tour-logs/select-tour');
  }

  protected onPageChange(event: { first?: number }): void {
    this.first.set(event.first ?? 0);
  }

  protected openLogDetails(logId: string): void {
    void this.router.navigate(['/tour-logs', logId]);
  }

  protected openEditLog(logId: string): void {
    void this.router.navigate(['/tour-logs', logId, 'edit']);
  }

  protected toggleTourLogs(card: TourLogTourCard): void {
    if (card.isExpanded) {
      this.updateTourCard(card.id, { isExpanded: false });
      return;
    }

    this.updateTourCard(card.id, { isExpanded: true });

    if (card.logsLoaded || card.isLoadingLogs) {
      return;
    }

    this.updateTourCard(card.id, {
      isLoadingLogs: true,
      logsLoadError: ''
    });

    this.tourLogApi
      .listByTourId(card.id)
      .pipe(finalize(() => this.updateTourCard(card.id, { isLoadingLogs: false })))
      .subscribe({
        next: (logs) => {
          const sortedLogs = [...logs].sort((left, right) => {
            return new Date(right.dateTime).getTime() - new Date(left.dateTime).getTime();
          });

          this.updateTourCard(card.id, {
            logs: sortedLogs,
            logsLoaded: true,
            logsLoadError: '',
            logCount: sortedLogs.length,
            hasCountError: false
          });
        },
        error: () => {
          this.updateTourCard(card.id, {
            logs: [],
            logsLoaded: false,
            logsLoadError: 'Tour logs for this tour could not be loaded.'
          });
        }
      });
  }

  protected openDeleteDialog(card: TourLogTourCard, log: TourLogResponse): void {
    this.selectedLogForDelete.set({
      log,
      tourId: card.id,
      tourName: card.name
    });
    this.showDeleteDialog.set(true);
  }

  protected closeDeleteDialog(): void {
    this.showDeleteDialog.set(false);
    this.selectedLogForDelete.set(null);
  }

  protected confirmDeleteLog(): void {
    const selected = this.selectedLogForDelete();

    if (!selected || this.isDeletingLog()) {
      return;
    }

    this.isDeletingLog.set(true);

    this.tourLogApi
      .deleteById(selected.log.id)
      .pipe(finalize(() => this.isDeletingLog.set(false)))
      .subscribe({
        next: () => {
          this.tourCards.update((cards) =>
            cards.map((card) => {
              if (card.id !== selected.tourId) {
                return card;
              }

              const updatedLogs = card.logs.filter((log) => log.id !== selected.log.id);
              return {
                ...card,
                logs: updatedLogs,
                logCount: card.logCount === null ? null : Math.max(0, card.logCount - 1)
              };
            })
          );
          this.closeDeleteDialog();
        },
        error: () => {
          this.closeDeleteDialog();
          this.toursLoadError.set('Tour log could not be deleted.');
        }
      });
  }

  protected trackTourCard(_: number, card: TourLogTourCard): string {
    return card.id;
  }

  protected formatLogDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  private loadTours(): void {
    this.isLoadingTours.set(true);
    this.toursLoadError.set('');

    this.tourApi
      .list()
      .pipe(finalize(() => this.isLoadingTours.set(false)))
      .subscribe({
        next: (tours) => {
          const cards = tours.map((tour) => this.createTourCard(this.tourApi.toListItem(tour)));
          this.first.set(0);
          this.tourCards.set(cards);

          for (const card of cards) {
            this.loadLogCount(card.id);
          }
        },
        error: () => {
          this.toursLoadError.set('Tours could not be loaded.');
          this.tourCards.set([]);
        }
      });
  }

  private loadLogCount(tourId: string): void {
    this.tourLogApi.listByTourId(tourId).subscribe({
      next: (logs) => {
        this.updateTourCard(tourId, {
          logCount: logs.length,
          isLoadingCount: false,
          hasCountError: false
        });
      },
      error: () => {
        this.updateTourCard(tourId, {
          logCount: null,
          isLoadingCount: false,
          hasCountError: true
        });
      }
    });
  }

  private createTourCard(tour: TourListItem): TourLogTourCard {
    return {
      ...tour,
      logCount: null,
      isLoadingCount: true,
      hasCountError: false,
      logs: [],
      isExpanded: false,
      isLoadingLogs: false,
      logsLoaded: false,
      logsLoadError: ''
    };
  }

  private updateTourCard(tourId: string, partial: Partial<TourLogTourCard>): void {
    this.tourCards.update((cards) =>
      cards.map((card) => {
        if (card.id !== tourId) {
          return card;
        }

        return {
          ...card,
          ...partial
        };
      })
    );
  }
}
