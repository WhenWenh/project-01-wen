import { afterNextRender, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { catchError, finalize, of, switchMap, throwError } from 'rxjs';

import { PendingChangesAware } from '../../../../core/guards/pending-changes.guard';
import { AuthSessionService } from '../../../../core/services/auth-session.service';
import { AppShellComponent } from '../../../../shared/components/app-shell/app-shell';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { PageBreadcrumbComponent } from '../../../../shared/components/page-breadcrumb/page-breadcrumb';
import { AuthApiService } from '../../../auth/services/auth-api.service';
import { TourResponse, TourType } from '../../models/tour.models';
import { TourApiService } from '../../services/tour-api.service';

@Component({
  selector: 'app-edit-tour-page',
  standalone: true,
  imports: [ReactiveFormsModule, AppShellComponent, ConfirmDialogComponent, PageBreadcrumbComponent],
  templateUrl: './edit-tour-page.html',
  styleUrl: './edit-tour-page.css'
})
export class EditTourPage implements PendingChangesAware {
  @ViewChild('imageInput')
  private imageInputRef?: ElementRef<HTMLInputElement>;

  protected readonly maxDescriptionLength = 500;
  protected readonly editForm;
  protected isLoggingOut = false;
  protected isSaving = false;
  protected showLeaveDialog = false;
  protected readonly isLoadingTour = signal(true);
  protected readonly loadError = signal('');
  protected readonly saveError = signal('');
  protected readonly loadedTour = signal<TourResponse | null>(null);
  protected readonly selectedImageFile = signal<File | null>(null);
  protected readonly breadcrumbItems = signal<MenuItem[]>([
    { label: 'Tours', routerLink: '/tours' },
    { label: 'Tour' },
    { label: 'Edit' }
  ]);

  private readonly formBuilder = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tourApi = inject(TourApiService);
  private pendingLeaveResolver: ((value: boolean) => void) | null = null;
  private allowRouteChange = false;

  constructor() {
    this.editForm = this.formBuilder.nonNullable.group({
      name: ['', [Validators.required]],
      tourType: ['' as TourType | '', [Validators.required]],
      from: ['', [Validators.required]],
      to: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.maxLength(this.maxDescriptionLength)]]
    });

    const tourId = this.route.snapshot.paramMap.get('id');

    if (!tourId) {
      this.loadError.set('Tour ID is missing.');
      this.isLoadingTour.set(false);
      return;
    }

    this.tourApi
      .getById(tourId)
      .pipe(finalize(() => this.isLoadingTour.set(false)))
      .subscribe({
        next: (tour) => {
          this.loadedTour.set(tour);
          this.saveError.set('');
          this.editForm.patchValue({
            name: tour.name,
            tourType: tour.tourType,
            from: tour.startName,
            to: tour.endName,
            description: tour.description
          });
          this.editForm.markAsPristine();
          this.breadcrumbItems.set([
            { label: 'Tours', routerLink: '/tours' },
            { label: tour.name || tour.id, routerLink: ['/tours', tour.id] },
            { label: 'Edit' }
          ]);
        },
        error: () => {
          this.loadError.set('Tour details could not be loaded.');
          this.loadedTour.set(null);
        }
      });

    afterNextRender(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
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

  protected goBack(): void {
    const tourId = this.route.snapshot.paramMap.get('id');

    if (!tourId) {
      void this.router.navigateByUrl('/tours');
      return;
    }

    void this.router.navigate(['/tours', tourId]);
  }

  protected saveTour(): void {
    const selectedTour = this.loadedTour();

    this.editForm.markAllAsTouched();
    this.saveError.set('');

    if (!selectedTour || this.editForm.invalid || this.isSaving) {
      return;
    }

    this.isSaving = true;

    this.tourApi
      .update(selectedTour.id, {
        name: this.editForm.controls.name.value,
        description: this.editForm.controls.description.value,
        imagePath: selectedTour.imagePath ?? '',
        tourType: this.editForm.controls.tourType.value as TourType,
        startName: this.editForm.controls.from.value,
        endName: this.editForm.controls.to.value
      })
      .pipe(
        switchMap((tour) => {
          this.loadedTour.set(tour);

          const selectedImage = this.selectedImageFile();
          if (!selectedImage) {
            return of(tour);
          }

          return this.tourApi.uploadImage(tour.id, selectedImage).pipe(
            catchError(() => {
              this.saveError.set('Tour details were saved, but the image upload failed.');
              return throwError(() => new Error('Image upload failed'));
            })
          );
        }),
        finalize(() => (this.isSaving = false))
      )
      .subscribe({
        next: (tour) => {
          this.loadedTour.set(tour);
          this.selectedImageFile.set(null);
          this.resetImageInput();
          this.editForm.markAsPristine();
          this.allowRouteChange = true;
          void this.router.navigate(['/tours', tour.id]);
        },
        error: () => {
          if (!this.saveError()) {
            this.saveError.set('Tour could not be updated.');
          }
        }
      });
  }

  protected get descriptionLength(): number {
    return this.editForm.controls.description.value.length;
  }

  protected get isDescriptionTooLong(): boolean {
    return this.descriptionLength > this.maxDescriptionLength;
  }

  protected get canShowEditActions(): boolean {
    return !this.isLoadingTour() && !this.loadError();
  }

  protected get selectedImageName(): string {
    return this.selectedImageFile()?.name ?? '';
  }

  protected get currentImageName(): string {
    return this.fileNameFromPath(this.loadedTour()?.imagePath);
  }

  protected get hasPendingImageSelection(): boolean {
    return this.selectedImageFile() !== null;
  }

  protected showRequiredError(
    controlName: 'name' | 'tourType' | 'from' | 'to' | 'description'
  ): boolean {
    const control = this.editForm.controls[controlName];

    return control.touched && control.hasError('required');
  }

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.selectedImageFile.set(file);
    this.editForm.markAsDirty();
  }

  protected clearSelectedImage(input: HTMLInputElement): void {
    if (!this.selectedImageFile()) {
      return;
    }

    this.selectedImageFile.set(null);
    input.value = '';
    this.editForm.markAsDirty();
  }

  private fileNameFromPath(path: string | null | undefined): string {
    if (!path) {
      return '';
    }

    const segments = path.split(/[/\\]/);
    return segments[segments.length - 1] ?? '';
  }

  private resetImageInput(): void {
    if (this.imageInputRef) {
      this.imageInputRef.nativeElement.value = '';
    }
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

  protected confirmLeave(): void {
    this.showLeaveDialog = false;
    this.pendingLeaveResolver?.(true);
    this.pendingLeaveResolver = null;
  }

  protected stayOnPage(): void {
    this.showLeaveDialog = false;
    this.pendingLeaveResolver?.(false);
    this.pendingLeaveResolver = null;
  }

  canDeactivate(): boolean | Promise<boolean> {
    if (this.allowRouteChange) {
      this.allowRouteChange = false;
      return true;
    }

    if (this.editForm.pristine) {
      return true;
    }

    if (this.pendingLeaveResolver) {
      return false;
    }

    this.showLeaveDialog = true;

    return new Promise<boolean>((resolve) => {
      this.pendingLeaveResolver = resolve;
    });
  }
}
