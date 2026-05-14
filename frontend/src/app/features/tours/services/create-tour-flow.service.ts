import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CreateTourFlowService {
  readonly canAccessFlow = signal(false);

  startFlow(): void {
    this.canAccessFlow.set(true);
  }

  resetFlow(): void {
    this.canAccessFlow.set(false);
  }
}
