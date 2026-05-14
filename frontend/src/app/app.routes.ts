import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { createTourFlowGuard } from './core/guards/create-tour-flow.guard';
import { pendingChangesGuard } from './core/guards/pending-changes.guard';
import { LoginPage } from './features/auth/pages/login/login-page';
import { SigninPage } from './features/auth/pages/signin/signin-page';
import { DashboardPage } from './features/dashboard/pages/dashboard/dashboard-page';
import { ExportPage } from './features/export/pages/export/export-page';
import { ImportPage } from './features/import/pages/import/import-page';
import { TourLogsPage } from './features/tour-logs/pages/tour-logs/tour-logs-page';
import { CreateLogPage } from './features/tour-logs/pages/create-log/create-log-page';
import { SelectTourLogPage } from './features/tour-logs/pages/select-tour/select-tour-page';
import { LogDetailsPage } from './features/tour-logs/pages/log-details/log-details-page';
import { CreateLogFromLogsPage } from './features/tour-logs/pages/create-log-from-logs/create-log-from-logs-page';
import { EditLogPage } from './features/tour-logs/pages/edit-log/edit-log-page';
import { CreateTourDetailsPage } from './features/tours/pages/create-tour/create-tour-details-page';
import { CreateTourDonePage } from './features/tours/pages/create-tour-done/create-tour-done-page';
import { CreateTourSummaryPage } from './features/tours/pages/create-tour-summary/create-tour-summary-page';
import { EditTourPage } from './features/tours/pages/edit-tour/edit-tour-page';
import { TourDetailsPage } from './features/tours/pages/tour-details/tour-details-page';
import { ToursPage } from './features/tours/pages/tours/tours-page';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },
  {
    path: 'login',
    component: LoginPage
  },
  {
    path: 'signin',
    component: SigninPage
  },
  {
    path: 'dashboard',
    component: DashboardPage,
    canActivate: [authGuard]
  },
  {
    path: 'tours',
    component: ToursPage,
    canActivate: [authGuard]
  },
  {
    path: 'tours/:id',
    component: TourDetailsPage,
    canActivate: [authGuard]
  },
  {
    path: 'tours/:id/edit',
    component: EditTourPage,
    canActivate: [authGuard],
    canDeactivate: [pendingChangesGuard]
  },
  {
    path: 'tours/create/details',
    component: CreateTourDetailsPage,
    canActivate: [authGuard, createTourFlowGuard],
    canDeactivate: [pendingChangesGuard]
  },
  {
    path: 'tours/create/summary',
    component: CreateTourSummaryPage,
    canActivate: [authGuard, createTourFlowGuard],
    canDeactivate: [pendingChangesGuard]
  },
  {
    path: 'tours/create/done',
    component: CreateTourDonePage,
    canActivate: [authGuard, createTourFlowGuard]
  },
  {
    path: 'tour-logs',
    component: TourLogsPage,
    canActivate: [authGuard]
  },
  {
    path: 'tour-logs/select-tour',
    component: SelectTourLogPage,
    canActivate: [authGuard]
  },
  {
    path: 'tour-logs/create/:tourId',
    component: CreateLogFromLogsPage,
    canActivate: [authGuard],
    canDeactivate: [pendingChangesGuard]
  },
  {
    path: 'tour-logs/:id',
    component: LogDetailsPage,
    canActivate: [authGuard]
  },
  {
    path: 'tour-logs/:id/edit',
    component: EditLogPage,
    canActivate: [authGuard],
    canDeactivate: [pendingChangesGuard]
  },
  {
    path: 'tours/:id/logs/create',
    component: CreateLogPage,
    canActivate: [authGuard],
    canDeactivate: [pendingChangesGuard]
  },
  {
    path: 'export',
    component: ExportPage,
    canActivate: [authGuard]
  },
  {
    path: 'import',
    component: ImportPage,
    canActivate: [authGuard]
  }
];
