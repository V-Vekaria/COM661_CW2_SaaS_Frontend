import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { UsersComponent } from './components/users/users';
import { UserComponent } from './components/user/user';
import { ActivityLogsComponent } from './components/activity-logs/activity-logs';
import { AnomalyFlagsComponent } from './components/anomaly-flags/anomaly-flags';
import { AnalyticsComponent } from './components/analytics/analytics';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'users', component: UsersComponent },
  { path: 'users/:id', component: UserComponent },
  { path: 'activity-logs', component: ActivityLogsComponent },
  { path: 'anomaly-flags', component: AnomalyFlagsComponent },
  { path: 'analytics', component: AnalyticsComponent }
];