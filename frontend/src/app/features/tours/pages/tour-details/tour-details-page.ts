import { Component, ElementRef, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';
import type * as Leaflet from 'leaflet';

import { AuthSessionService } from '../../../../core/services/auth-session.service';
import { AppShellComponent } from '../../../../shared/components/app-shell/app-shell';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { FavoriteToggleComponent } from '../../../../shared/components/favorite-toggle/favorite-toggle';
import { ImagePreviewDialogComponent } from '../../../../shared/components/image-preview-dialog/image-preview-dialog';
import { PageBreadcrumbComponent } from '../../../../shared/components/page-breadcrumb/page-breadcrumb';
import { AuthApiService } from '../../../auth/services/auth-api.service';
import { TourLogResponse } from '../../../tour-logs/models/tour-log.models';
import { TourLogApiService } from '../../../tour-logs/services/tour-log-api.service';
import {
  TourResponse,
  TourRouteResponse,
  TourType,
  TourWithFavoriteResponse
} from '../../models/tour.models';
import { TourApiService } from '../../services/tour-api.service';

@Component({
  selector: 'app-tour-details-page',
  standalone: true,
  imports: [
    ButtonModule,
    AppShellComponent,
    ConfirmDialogComponent,
    FavoriteToggleComponent,
    ImagePreviewDialogComponent,
    PageBreadcrumbComponent
  ],
  templateUrl: './tour-details-page.html',
  styleUrl: './tour-details-page.css'
})
export class TourDetailsPage implements OnDestroy {
  @ViewChild('mapContainer')
  private set mapContainer(element: ElementRef<HTMLDivElement> | undefined) {
    this.mapContainerRef = element;

    if (element) {
      void this.ensureMapIsReady();
    }
  }

  private leaflet?: typeof Leaflet;
  private mapContainerRef?: ElementRef<HTMLDivElement>;
  private map?: Leaflet.Map;
  private routeLayer?: Leaflet.Polyline;
  private startMarker?: Leaflet.CircleMarker;
  private endMarker?: Leaflet.CircleMarker;
  private previewImageObjectUrl: string | null = null;

  protected readonly isLoadingTour = signal(true);
  protected readonly isLoadingRoute = signal(true);
  protected readonly isLoadingLogs = signal(true);
  protected readonly tourLoadError = signal('');
  protected readonly routeLoadError = signal('');
  protected readonly logLoadError = signal('');
  protected readonly tour = signal<TourResponse | null>(null);
  protected readonly routeDetails = signal<TourRouteResponse | null>(null);
  protected readonly tourLogs = signal<TourLogResponse[]>([]);
  protected readonly showDeleteDialog = signal(false);
  protected readonly showDeleteLogDialog = signal(false);
  protected readonly isDeletingTour = signal(false);
  protected readonly isDeletingLog = signal(false);
  protected readonly selectedLogForDelete = signal<TourLogResponse | null>(null);
  protected readonly isTogglingFavorite = signal(false);
  protected readonly isDownloadingImage = signal(false);
  protected readonly isLoadingImagePreview = signal(false);
  protected readonly showImagePreviewDialog = signal(false);
  protected readonly previewImageUrl = signal<string | null>(null);
  protected readonly isFavorite = signal(false);
  protected readonly canShowTourActions = computed(() => {
    return !this.isLoadingTour() && !this.tourLoadError() && this.tour() !== null;
  });
  protected readonly breadcrumbItems = signal<MenuItem[]>([
    { label: 'Tours', routerLink: '/tours' }
  ]);
  protected isLoggingOut = false;

  private readonly authApi = inject(AuthApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tourApi = inject(TourApiService);
  private readonly tourLogApi = inject(TourLogApiService);

  constructor() {
    const tourId = this.route.snapshot.paramMap.get('id');

    if (!tourId) {
      this.tourLoadError.set('Tour ID is missing.');
      this.isLoadingTour.set(false);
      return;
    }

    this.tourApi
      .getByIdWithFavorite(tourId)
      .pipe(finalize(() => this.isLoadingTour.set(false)))
      .subscribe({
        next: (tour) => {
          this.tour.set(tour);
          this.isFavorite.set(tour.favorite);
          this.breadcrumbItems.set([
            { label: 'Tours', routerLink: '/tours' },
            { label: tour.name || tour.id }
          ]);
        },
        error: () => {
          this.tourLoadError.set('Tour details could not be loaded.');
          this.tour.set(null);
        }
      });

    this.tourApi
      .getRouteByTourId(tourId)
      .pipe(finalize(() => this.isLoadingRoute.set(false)))
      .subscribe({
        next: (route) => {
          this.routeDetails.set(route);
          void this.ensureMapIsReady();
        },
        error: () => {
          this.routeLoadError.set('Route details could not be loaded.');
          this.routeDetails.set(null);
        }
      });

    this.tourLogApi
      .listByTourId(tourId)
      .pipe(finalize(() => this.isLoadingLogs.set(false)))
      .subscribe({
        next: (logs) => {
          this.tourLogs.set(
            [...logs].sort((left, right) => {
              return new Date(right.dateTime).getTime() - new Date(left.dateTime).getTime();
            })
          );
          this.logLoadError.set('');
        },
        error: () => {
          this.logLoadError.set('Tour logs could not be loaded for this tour.');
          this.tourLogs.set([]);
        }
      });
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.clearPreviewImage();
  }

  private async ensureMapIsReady(): Promise<void> {
    await this.loadLeaflet();
    this.initializeMap();
    this.renderRouteOnMap();
  }

  private async loadLeaflet(): Promise<void> {
    if (this.leaflet) {
      return;
    }

    const leafletModule = await import('leaflet');
    this.leaflet = leafletModule;
  }

  private initializeMap(): void {
    const container = this.mapContainerRef?.nativeElement;
    const leaflet = this.leaflet;

    if (!container || this.map || !leaflet) {
      return;
    }

    this.map = leaflet.map(container, {
      zoomControl: true
    });

    leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.setView([48.2082, 16.3738], 13);
  }

  private renderRouteOnMap(): void {
    const route = this.routeDetails();
    const leaflet = this.leaflet;

    if (!this.map || !leaflet || !route?.coordinates?.length) {
      return;
    }

    const latLngs = route.coordinates.map(([lat, lng]) => leaflet.latLng(lat, lng));

    if (this.routeLayer) {
      this.map.removeLayer(this.routeLayer);
    }

    if (this.startMarker) {
      this.map.removeLayer(this.startMarker);
    }

    if (this.endMarker) {
      this.map.removeLayer(this.endMarker);
    }

    this.routeLayer = leaflet.polyline(latLngs, {
      color: '#2f7d6b',
      weight: 6,
      smoothFactor: 1.5,
    lineCap: 'round',
    lineJoin: 'round'
    }).addTo(this.map);

    this.startMarker = leaflet.circleMarker(latLngs[0], {
      radius: 9,
      color: '#2563eb',
      weight: 3,
      fillColor: '#60a5fa',
      fillOpacity: 1
    })
      .addTo(this.map)
      .bindPopup(`From: ${this.tour()?.startName ?? 'Start'}`);
    this.endMarker = leaflet.circleMarker(latLngs[latLngs.length - 1], {
      radius: 9,
      color: '#ea580c',
      weight: 3,
      fillColor: '#fb923c',
      fillOpacity: 1
    })
      .addTo(this.map)
      .bindPopup(`To: ${this.tour()?.endName ?? 'End'}`);

    this.map.fitBounds(this.routeLayer.getBounds(), {
      padding: [24, 24]
    });

    this.map.invalidateSize();
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

  protected goBack(): void {
    void this.router.navigateByUrl('/tours');
  }

  protected openCreateLog(): void {
    const selectedTour = this.tour();

    if (!selectedTour) {
      return;
    }

    void this.router.navigate(['/tours', selectedTour.id, 'logs', 'create']);
  }

  protected openEditTour(): void {
    const selectedTour = this.tour();

    if (!selectedTour) {
      return;
    }

    void this.router.navigate(['/tours', selectedTour.id, 'edit']);
  }

  protected openEditLog(logId: string): void {
    void this.router.navigate(['/tour-logs', logId, 'edit']);
  }

  protected openLogDetails(logId: string): void {
    void this.router.navigate(['/tour-logs', logId]);
  }

  protected openDeleteLogDialog(log: TourLogResponse): void {
    this.selectedLogForDelete.set(log);
    this.showDeleteLogDialog.set(true);
  }

  protected toggleFavorite(): void {
    const selectedTour = this.tour();

    if (!selectedTour || this.isTogglingFavorite()) {
      return;
    }

    this.isTogglingFavorite.set(true);

    const favoriteRequest = this.isFavorite()
      ? this.tourApi.removeFavorite(selectedTour.id)
      : this.tourApi.addFavorite(selectedTour.id);

    favoriteRequest
      .pipe(finalize(() => this.isTogglingFavorite.set(false)))
      .subscribe({
        next: () => {
          this.isFavorite.update((value) => !value);
        },
        error: () => {}
      });
  }

  protected uploadedImageName(path: string): string {
    const segments = path.split(/[/\\]/);
    return segments[segments.length - 1] ?? path;
  }

  protected openImagePreview(): void {
    const selectedTour = this.tour();

    if (!selectedTour?.imagePath || this.isLoadingImagePreview()) {
      return;
    }

    this.isLoadingImagePreview.set(true);

    this.tourApi
      .downloadImage(selectedTour.id)
      .pipe(finalize(() => this.isLoadingImagePreview.set(false)))
      .subscribe({
        next: (imageBlob) => {
          this.clearPreviewImage();

          const previewUrl = URL.createObjectURL(imageBlob);
          this.previewImageObjectUrl = previewUrl;
          this.previewImageUrl.set(previewUrl);
          this.showImagePreviewDialog.set(true);
        },
        error: () => {}
      });
  }

  protected closeImagePreview(): void {
    this.showImagePreviewDialog.set(false);
    this.clearPreviewImage();
  }

  protected downloadImage(): void {
    const selectedTour = this.tour();

    if (!selectedTour?.imagePath || this.isDownloadingImage()) {
      return;
    }

    this.isDownloadingImage.set(true);

    this.tourApi
      .downloadImage(selectedTour.id)
      .pipe(finalize(() => this.isDownloadingImage.set(false)))
      .subscribe({
        next: (imageBlob) => {
          const downloadUrl = URL.createObjectURL(imageBlob);
          const link = document.createElement('a');

          link.href = downloadUrl;
          link.download = this.uploadedImageName(selectedTour.imagePath);
          link.click();

          URL.revokeObjectURL(downloadUrl);
        },
        error: () => {}
      });
  }

  private clearPreviewImage(): void {
    if (this.previewImageObjectUrl) {
      URL.revokeObjectURL(this.previewImageObjectUrl);
      this.previewImageObjectUrl = null;
    }

    this.previewImageUrl.set(null);
  }

  protected openDeleteDialog(): void {
    this.showDeleteDialog.set(true);
  }

  protected closeDeleteDialog(): void {
    this.showDeleteDialog.set(false);
  }

  protected closeDeleteLogDialog(): void {
    this.showDeleteLogDialog.set(false);
    this.selectedLogForDelete.set(null);
  }

  protected confirmDeleteTour(): void {
    const selectedTour = this.tour();

    if (!selectedTour || this.isDeletingTour()) {
      return;
    }

    this.isDeletingTour.set(true);

    this.tourApi
      .deleteById(selectedTour.id)
      .pipe(finalize(() => this.isDeletingTour.set(false)))
      .subscribe({
        next: () => {
          this.showDeleteDialog.set(false);
          void this.router.navigateByUrl('/tours');
        },
        error: () => {
          this.showDeleteDialog.set(false);
        }
      });
  }

  protected confirmDeleteLog(): void {
    const selectedLog = this.selectedLogForDelete();

    if (!selectedLog || this.isDeletingLog()) {
      return;
    }

    this.isDeletingLog.set(true);

    this.tourLogApi
      .deleteById(selectedLog.id)
      .pipe(finalize(() => this.isDeletingLog.set(false)))
      .subscribe({
        next: () => {
          this.tourLogs.update((logs) => logs.filter((log) => log.id !== selectedLog.id));
          this.closeDeleteLogDialog();
        },
        error: () => {
          this.closeDeleteLogDialog();
        }
      });
  }

  protected tourTypeLabel(value: TourType): string {
    switch (value) {
      case 'BIKE':
        return 'Bike';
      case 'HIKE':
        return 'Hike';
      case 'RUNNING':
        return 'Running';
      case 'VACATION':
        return 'Vacation';
    }
  }
  

  protected formatDistance(distanceInMeters: number): string {
    return `${(distanceInMeters / 1000).toFixed(1)} km`;
  }

  protected formatDuration(durationInSeconds: number): string {
    const totalMinutes = Math.round(durationInSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
      return `${minutes} min`;
    }

    if (minutes === 0) {
      return `${hours} h`;
    }

    return `${hours} h ${minutes} min`;
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

  protected formatLogDistance(distanceInKm: number): string {
    return `${distanceInKm} km`;
  }

  protected formatLogDuration(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
      return `${minutes} min`;
    }

    if (minutes === 0) {
      return `${hours} h`;
    }

    return `${hours} h ${minutes} min`;
  }
}
