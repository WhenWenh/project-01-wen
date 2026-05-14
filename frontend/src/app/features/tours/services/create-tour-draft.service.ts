import { Injectable, signal } from '@angular/core';

import { CreateTourSaveResult, TourType } from '../models/tour.models';

export interface CreateTourDraft {
  name: string;
  tourType: TourType | '';
  from: string;
  to: string;
  description: string;
}

const INITIAL_DRAFT: CreateTourDraft = {
  name: '',
  tourType: '',
  from: '',
  to: '',
  description: ''
};

@Injectable({ providedIn: 'root' })
export class CreateTourDraftService {
  readonly draft = signal<CreateTourDraft>(INITIAL_DRAFT);
  readonly saveResult = signal<CreateTourSaveResult | null>(null);

  update(draft: CreateTourDraft): void {
    this.draft.set(draft);
  }

  reset(): void {
    this.draft.set(INITIAL_DRAFT);
  }

  setSaveResult(result: CreateTourSaveResult | null): void {
    this.saveResult.set(result);
  }
}
