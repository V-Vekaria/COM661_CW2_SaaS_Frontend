import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { WebService } from '../../services/web-service';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

const mockSummaryResp = {
  total_users: 10,
  active_users: 7,
  total_logs: 50,
  open_anomalies: 3
};

const mockTierResp = [
  { tier: 'free',       avg_api_calls: 1200 },
  { tier: 'pro',        avg_api_calls: 5000 },
  { tier: 'enterprise', avg_api_calls: 15000 }
];

const mockFlagsResp = {
  flags: [
    { _id: 'f1', severity: 'critical', resolved: false },
    { _id: 'f2', severity: 'high',     resolved: true  },
    { _id: 'f3', severity: 'medium',   resolved: false },
    { _id: 'f4', severity: 'low',      resolved: false },
    { _id: 'f5', severity: 'critical', resolved: true  },
    { _id: 'f6', severity: 'high',     resolved: false }
  ],
  total: 6
};

const mockActivityResp = {
  logs: [
    { _id: 'l1', performance: { response_time_ms: 100 } },
    { _id: 'l2', performance: { response_time_ms: 200 } }
  ],
  total: 42
};

function makeWebMock() {
  return {
    getDashboardSummary:  vi.fn().mockReturnValue(of(mockSummaryResp)),
    getAvgApiCallsByTier: vi.fn().mockReturnValue(of(mockTierResp)),
    getAnomalyFlags:      vi.fn().mockReturnValue(of(mockFlagsResp)),
    getActivityLogs:      vi.fn().mockReturnValue(of(mockActivityResp)),
    resolveAnomaly:       vi.fn().mockReturnValue(of({}))
  };
}

async function setup(webOverrides?: Partial<ReturnType<typeof makeWebMock>>) {
  const mockWeb = { ...makeWebMock(), ...webOverrides };
  await TestBed.configureTestingModule({
    imports: [Dashboard],
    providers: [
      { provide: WebService, useValue: mockWeb },
      provideRouter([])
    ],
    schemas: [NO_ERRORS_SCHEMA]
  }).compileComponents();
  const fixture = TestBed.createComponent(Dashboard);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, compiled: fixture.nativeElement as HTMLElement, mockWeb };
}

describe('Dashboard Component', () => {

  // ── Data loading ─────────────────────────────────────────────────────────────
  describe('Data loading', () => {
    it('calls getDashboardSummary on init', async () => {
      const { mockWeb } = await setup();
      expect(mockWeb.getDashboardSummary).toHaveBeenCalled();
    });

    it('calls getAvgApiCallsByTier on init for tier chart', async () => {
      const { mockWeb } = await setup();
      expect(mockWeb.getAvgApiCallsByTier).toHaveBeenCalled();
    });

    it('calls getAnomalyFlags on init', async () => {
      const { mockWeb } = await setup();
      expect(mockWeb.getAnomalyFlags).toHaveBeenCalledWith(1, 100);
    });

    it('calls getActivityLogs on init', async () => {
      const { mockWeb } = await setup();
      expect(mockWeb.getActivityLogs).toHaveBeenCalledWith(1, 50);
    });
  });

  // ── Stat card computation ────────────────────────────────────────────────────
  describe('Stat card computation', () => {
    it('sets totalUsers from dashboard summary total_users', async () => {
      const { fixture } = await setup();
      expect(fixture.componentInstance.totalUsers).toBe(10);
    });

    it('sets activeAnomalies from dashboard summary open_anomalies', async () => {
      const { fixture } = await setup();
      expect(fixture.componentInstance.activeAnomalies).toBe(3);
    });

    it('sets totalApiCalls from activity logs total', async () => {
      const { fixture } = await setup();
      expect(fixture.componentInstance.totalApiCalls).toBe(42);
    });

    it('calculates avgResponseTime from log performance', async () => {
      const { fixture } = await setup();
      // (100 + 200) / 2 = 150
      expect(fixture.componentInstance.avgResponseTime).toBe(150);
    });

    it('slices recentAnomalies to at most 5', async () => {
      const { fixture } = await setup();
      expect(fixture.componentInstance.recentAnomalies.length).toBeLessThanOrEqual(5);
    });
  });

  // ── Chart data building ──────────────────────────────────────────────────────
  describe('Chart data building', () => {
    it('tier chart data contains avg_api_calls values from getAvgApiCallsByTier', async () => {
      const { fixture } = await setup();
      const data = fixture.componentInstance.pieChartData.datasets[0].data as number[];
      expect(data).toEqual([1200, 5000, 15000]);
    });

    it('tier chart labels are uppercased tier names', async () => {
      const { fixture } = await setup();
      expect(fixture.componentInstance.pieChartData.labels).toEqual(['FREE', 'PRO', 'ENTERPRISE']);
    });

    it('builds severity chart with correct counts', async () => {
      const { fixture } = await setup();
      const data = fixture.componentInstance.barChartData.datasets[0].data;
      // mockFlagsResp: critical×2, high×2, medium×1, low×1
      expect(data).toEqual([2, 2, 1, 1]);
    });
  });

  // ── Error handling ───────────────────────────────────────────────────────────
  describe('Error handling', () => {
    it('sets errorMessage when getDashboardSummary fails', async () => {
      const { fixture } = await setup({
        getDashboardSummary: vi.fn().mockReturnValue(throwError(() => new Error('network error')))
      });
      expect(fixture.componentInstance.errorMessage).toBe('Failed to load dashboard summary');
    });

    it('sets errorMessage when getAnomalyFlags fails', async () => {
      const { fixture } = await setup({
        getAnomalyFlags: vi.fn().mockReturnValue(throwError(() => new Error('error')))
      });
      expect(fixture.componentInstance.errorMessage).toBe('Failed to load anomalies');
    });

    it('silently ignores getActivityLogs failure (no error message)', async () => {
      const { fixture } = await setup({
        getActivityLogs: vi.fn().mockReturnValue(throwError(() => new Error('error')))
      });
      expect(fixture.componentInstance.errorMessage).toBe('');
    });

    it('silently ignores getAvgApiCallsByTier failure', async () => {
      const { fixture } = await setup({
        getAvgApiCallsByTier: vi.fn().mockReturnValue(throwError(() => new Error('error')))
      });
      expect(fixture.componentInstance.errorMessage).toBe('');
    });
  });

  // ── Both admin and analyst access dashboard ──────────────────────────────────
  describe('Role-agnostic access', () => {
    it('dashboard has no role guard — accessible by both roles', async () => {
      // Dashboard component does not inject AuthService — accessible to any logged-in user
      const { fixture } = await setup();
      expect(fixture.componentInstance).toBeTruthy();
    });
  });
});
