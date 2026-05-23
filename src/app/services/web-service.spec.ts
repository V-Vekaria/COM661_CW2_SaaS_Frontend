import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { WebService } from './web-service';

const BASE = 'http://127.0.0.1:5001';

describe('WebService', () => {
  let service: WebService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.setItem('token', 'test-token');
    TestBed.configureTestingModule({
      providers: [WebService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(WebService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // ── Auth ────────────────────────────────────────────────────────────────────
  describe('Auth endpoints', () => {
    it('login: POST /login with email and password', () => {
      service.login('admin@test.com', 'secret').subscribe();
      const req = httpMock.expectOne(BASE + '/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'admin@test.com', password: 'secret' });
      req.flush({ token: 'tok', role: 'admin', email: 'admin@test.com' });
    });

    it('login: does not send auth header (public endpoint)', () => {
      service.login('a@b.com', 'p').subscribe();
      const req = httpMock.expectOne(BASE + '/login');
      expect(req.request.headers.has('x-access-token')).toBe(false);
      req.flush({});
    });

    it('logout: POST /logout with auth header', () => {
      service.logout().subscribe();
      const req = httpMock.expectOne(BASE + '/logout');
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('x-access-token')).toBe('test-token');
      req.flush({ message: 'Logged out successfully' });
    });
  });

  // ── Users ───────────────────────────────────────────────────────────────────
  describe('User endpoints', () => {
    it('getUsers: GET /users with pagination params', () => {
      service.getUsers(2, 10).subscribe();
      const req = httpMock.expectOne(BASE + '/users?pn=2&ps=10');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('x-access-token')).toBe('test-token');
      req.flush({ users: [], total: 0 });
    });

    it('getUserById: GET /users/:id', () => {
      service.getUserById('abc123').subscribe();
      const req = httpMock.expectOne(BASE + '/users/abc123');
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('addUser: POST /users with user data', () => {
      const data = { first_name: 'John', email: 'j@j.com', role: 'analyst' };
      service.addUser(data).subscribe();
      const req = httpMock.expectOne(BASE + '/users');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(data);
      req.flush({ _id: 'new1' });
    });

    it('updateUser: PUT /users/:id with payload', () => {
      const data = { subscription_tier: 'pro', status: 'active', churn_risk: 'low' };
      service.updateUser('u1', data).subscribe();
      const req = httpMock.expectOne(BASE + '/users/u1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(data);
      req.flush({});
    });

    it('deleteUser: DELETE /users/:id', () => {
      service.deleteUser('u1').subscribe();
      const req = httpMock.expectOne(BASE + '/users/u1');
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  // ── User Sub-resources ──────────────────────────────────────────────────────
  describe('User sub-resource endpoints', () => {
    it('getUserUsageLogs: GET /users/:id/usage with pagination', () => {
      service.getUserUsageLogs('u1', 1, 5).subscribe();
      const req = httpMock.expectOne(BASE + '/users/u1/usage?pn=1&ps=5');
      expect(req.request.method).toBe('GET');
      req.flush({ logs: [], total: 0 });
    });

    it('addUsageLog: POST /users/:id/usage', () => {
      const data = { api_calls: 100, storage_mb: 50, region: 'eu-west' };
      service.addUsageLog('u1', data).subscribe();
      const req = httpMock.expectOne(BASE + '/users/u1/usage');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(data);
      req.flush({ log_id: 'l1' });
    });

    it('deleteUsageLog: DELETE /users/:id/usage/:logId', () => {
      service.deleteUsageLog('u1', 'l1').subscribe();
      const req = httpMock.expectOne(BASE + '/users/u1/usage/l1');
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('getUserApiKeys: GET /users/:id/api-keys', () => {
      service.getUserApiKeys('u1').subscribe();
      const req = httpMock.expectOne(BASE + '/users/u1/api-keys');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('addApiKey: POST /users/:id/api-keys', () => {
      service.addApiKey('u1', { permissions: ['read', 'write'] }).subscribe();
      const req = httpMock.expectOne(BASE + '/users/u1/api-keys');
      expect(req.request.method).toBe('POST');
      req.flush({ key_id: 'k1', key_prefix: 'sk_live_abc' });
    });

    it('revokeApiKey: PUT /users/:id/api-keys/:keyId/revoke', () => {
      service.revokeApiKey('u1', 'k1').subscribe();
      const req = httpMock.expectOne(BASE + '/users/u1/api-keys/k1/revoke');
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });

    it('deleteApiKey: DELETE /users/:id/api-keys/:keyId', () => {
      service.deleteApiKey('u1', 'k1').subscribe();
      const req = httpMock.expectOne(BASE + '/users/u1/api-keys/k1');
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('addAlert: POST /users/:id/alerts', () => {
      const data = { message: 'Test alert', severity: 'high', alert_type: 'security_event' };
      service.addAlert('u1', data).subscribe();
      const req = httpMock.expectOne(BASE + '/users/u1/alerts');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(data);
      req.flush({ alert_id: 'a1' });
    });

    it('getUserAlerts: GET /users/:id/alerts', () => {
      service.getUserAlerts('u1').subscribe();
      const req = httpMock.expectOne(BASE + '/users/u1/alerts');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('acknowledgeAlert: PUT /users/:id/alerts/:alertId/acknowledge', () => {
      service.acknowledgeAlert('u1', 'a1').subscribe();
      const req = httpMock.expectOne(BASE + '/users/u1/alerts/a1/acknowledge');
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });

    it('deleteAlert: DELETE /users/:id/alerts/:alertId', () => {
      service.deleteAlert('u1', 'a1').subscribe();
      const req = httpMock.expectOne(BASE + '/users/u1/alerts/a1');
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  // ── Activity Logs ───────────────────────────────────────────────────────────
  describe('Activity log endpoints', () => {
    it('getActivityLogsFiltered: GET with full relative URL', () => {
      service.getActivityLogsFiltered('/activity-logs?pn=1&ps=15&action_type=login').subscribe();
      const req = httpMock.expectOne(BASE + '/activity-logs?pn=1&ps=15&action_type=login');
      expect(req.request.method).toBe('GET');
      req.flush({ logs: [], total: 0 });
    });

    it('addActivityLog: POST /activity-logs', () => {
      const data = { action_type: 'login', user_id: 'u1' };
      service.addActivityLog(data).subscribe();
      const req = httpMock.expectOne(BASE + '/activity-logs');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(data);
      req.flush({ _id: 'log1' });
    });

    it('deleteActivityLog: DELETE /activity-logs/:id', () => {
      service.deleteActivityLog('log1').subscribe();
      const req = httpMock.expectOne(BASE + '/activity-logs/log1');
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  // ── Anomaly Flags ───────────────────────────────────────────────────────────
  describe('Anomaly flag endpoints', () => {
    it('getAnomalyFlagsFiltered: GET with relative URL', () => {
      service.getAnomalyFlagsFiltered('/anomaly-flags?pn=1&ps=10&severity=critical').subscribe();
      const req = httpMock.expectOne(BASE + '/anomaly-flags?pn=1&ps=10&severity=critical');
      expect(req.request.method).toBe('GET');
      req.flush({ flags: [], total: 0 });
    });

    it('updateAnomalyFlag: PUT /anomaly-flags/:id', () => {
      service.updateAnomalyFlag('f1', { severity: 'high' }).subscribe();
      const req = httpMock.expectOne(BASE + '/anomaly-flags/f1');
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });

    it('deleteAnomalyFlag: DELETE /anomaly-flags/:id', () => {
      service.deleteAnomalyFlag('f1').subscribe();
      const req = httpMock.expectOne(BASE + '/anomaly-flags/f1');
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('resolveAnomaly: POST /anomaly-flags/:id/resolve with note', () => {
      service.resolveAnomaly('f1', 'investigated and closed').subscribe();
      const req = httpMock.expectOne(BASE + '/anomaly-flags/f1/resolve');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ note: 'investigated and closed' });
      req.flush({});
    });

    it('deleteResolutionLog: DELETE /anomaly-flags/:flagId/resolve/:resId', () => {
      service.deleteResolutionLog('f1', 'r1').subscribe();
      const req = httpMock.expectOne(BASE + '/anomaly-flags/f1/resolve/r1');
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  // ── Analytics ───────────────────────────────────────────────────────────────
  describe('Analytics endpoints', () => {
    it('getAvgApiCallsByTier: GET /analytics/avg-api-calls-by-tier', () => {
      service.getAvgApiCallsByTier().subscribe();
      const req = httpMock.expectOne(BASE + '/analytics/avg-api-calls-by-tier');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('getOpsBreakdown: GET /analytics/ops-breakdown', () => {
      service.getOpsBreakdown().subscribe();
      const req = httpMock.expectOne(BASE + '/analytics/ops-breakdown');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('getHighUsage: GET /analytics/high-usage', () => {
      service.getHighUsage().subscribe();
      const req = httpMock.expectOne(BASE + '/analytics/high-usage');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('getFailedLogins: GET /analytics/failed-logins', () => {
      service.getFailedLogins().subscribe();
      const req = httpMock.expectOne(BASE + '/analytics/failed-logins');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('getAnomalySummary: GET /analytics/anomaly-summary', () => {
      service.getAnomalySummary().subscribe();
      const req = httpMock.expectOne(BASE + '/analytics/anomaly-summary');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('getUserRiskReport: GET /analytics/user-risk-report', () => {
      service.getUserRiskReport().subscribe();
      const req = httpMock.expectOne(BASE + '/analytics/user-risk-report');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  // ── Token header on all protected calls ─────────────────────────────────────
  describe('Auth header on protected endpoints', () => {
    it('sends x-access-token header on every protected call', () => {
      const calls: Array<() => void> = [
        () => service.getUsers(1, 10).subscribe(),
        () => service.getActivityLogsFiltered('/activity-logs?pn=1&ps=10').subscribe(),
        () => service.getAnomalyFlagsFiltered('/anomaly-flags?pn=1&ps=10').subscribe(),
        () => service.getAvgApiCallsByTier().subscribe()
      ];
      const urls = [
        BASE + '/users?pn=1&ps=10',
        BASE + '/activity-logs?pn=1&ps=10',
        BASE + '/anomaly-flags?pn=1&ps=10',
        BASE + '/analytics/avg-api-calls-by-tier'
      ];

      calls.forEach(call => call());
      urls.forEach(url => {
        const req = httpMock.expectOne(url);
        expect(req.request.headers.get('x-access-token')).toBe('test-token');
        req.flush({});
      });
    });
  });
});
