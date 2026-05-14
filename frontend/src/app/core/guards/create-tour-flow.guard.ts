import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { CreateTourFlowService } from '../../features/tours/services/create-tour-flow.service';

export const createTourFlowGuard: CanActivateFn = () => {
  const flowService = inject(CreateTourFlowService);
  const router = inject(Router);

  if (flowService.canAccessFlow()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
