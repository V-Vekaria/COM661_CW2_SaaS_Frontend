import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { Users } from './components/users/users';
import { User } from './components/user/user';
import { ActivityLogs } from './components/activity-logs/activity-logs';
import { AnomalyFlags } from './components/anomaly-flags/anomaly-flags';
import { Analytics } from './components/analytics/analytics';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'users', component: Users },
  { path: 'users/:id', component: User },
  { path: 'activity-logs', component: ActivityLogs },
  { path: 'anomaly-flags', component: AnomalyFlags },
  { path: 'analytics', component: Analytics }
];