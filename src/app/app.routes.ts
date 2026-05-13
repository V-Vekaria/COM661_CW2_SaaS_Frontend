import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { Users } from './components/users/users';
import { User } from './components/user/user';
import { ActivityLogs } from './components/activity-logs/activity-logs';
import { AnomalyFlags } from './components/anomaly-flags/anomaly-flags';
import { Analytics } from './components/analytics/analytics';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'users', component: Users, canActivate: [authGuard] },
  { path: 'users/:id', component: User, canActivate: [authGuard] },
  { path: 'activity-logs', component: ActivityLogs, canActivate: [authGuard] },
  { path: 'anomaly-flags', component: AnomalyFlags, canActivate: [authGuard] },
  { path: 'analytics', component: Analytics, canActivate: [authGuard] }
];