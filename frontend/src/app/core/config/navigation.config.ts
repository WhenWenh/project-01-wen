import { MenuItem } from 'primeng/api';

export const SIDEBAR_NAV_ITEMS: MenuItem[] = [
  {
    label: 'Dashboard',
    icon: 'pi pi-home',
    routerLink: '/dashboard'
  },
  {
    label: 'Tours',
    icon: 'pi pi-map',
    routerLink: '/tours'
  },
  {
    label: 'Tour Logs',
    icon: 'pi pi-list-check',
    routerLink: '/tour-logs'
  },
  {
    label: 'Export',
    icon: 'pi pi-file-export',
    routerLink: '/export'
  },
  {
    label: 'Import',
    icon: 'pi pi-file-import',
    routerLink: '/import'
  }
];
