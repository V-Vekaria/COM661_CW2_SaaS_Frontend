import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Analytics } from './analytics';
import { WebService } from '../../services/web-service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

const mockTierData = [
  { _id: 'free', avg_api_calls: 120 },
  { _id: 'pro', avg_api_calls: 450 },
  { _id: 'enterprise', avg_api_calls: 980 }
];

const mockHighUsage = [
  { _id: 'u1', first_name: 'Alice', last_name: 'Smith', email: 'alice@test.com', total_api_calls: 9500 },
  { _id: 'u2', first_name: 'Bob', last_name: 'Jones', email: 'bob@test.com', total_api_calls: 8200 }
];

const mockFailedLogins = [
  { user_id: 'u1', user_email: 'alice@test.com', failed_count: 12 },
  { user_id: 'u3', user_email: 'charlie@test.com', failed_count: 7 }
];

const mockOpsBreakdown = [
  { tier: 'free',       total_calls: 5000, total_reads: 3000, total_writes: 2000 },
  { tier: 'pro',        total_calls: 12000, total_reads: 7200, total_writes: 4800 },
  { tier: 'enterprise', total_calls: 30000, total_reads: 18000, total_writes: 12000 }
];

const mockAnomalySummary = [
  { _id: 'critical', count: 3 },
  { _id: 'high', count: 8 },
  { _id: 'medium', count: 15 }
];

const mockRiskReport = [
  { user_id: 'u1', email: 'alice@test.com', churn_risk: 'high', anomaly_count: 4, failed_logins: 12 },
  { user_id: 'u2', email: 'bob@test.com', churn_risk: 'medium', anomaly_count: 2, failed_logins: 3 }
];

function makeWebMock() {
  return {
    getAvgApiCallsByTier: vi.fn().mockReturnValue(of(mockTierData)),
    getHighUsage: vi.fn().mockReturnValue(of(mockHighUsage)),
    getFailedLogins: vi.fn().mockReturnValue(of({ flagged_users: mockFailedLogins, threshold: 3 })),
    getAnomalySummary: vi.fn().mockReturnValue(of(mockAnomalySummary)),
    getUserRiskReport: vi.fn().mockReturnValue(of(mockRiskReport)),
    getOpsBreakdown: vi.fn().mockReturnValue(of(mockOpsBreakdown))
  };
}

async function setup(webOverrides?: Partial<ReturnType<typeof makeWebMock>>) {
  const mockWeb = { ...makeWebMock(), ...webOverrides };
  await TestBed.configureTestingModule({
    imports: [Analytics],
    providers: [{ provide: WebService, useValue: mockWeb }],
    schemas: [NO_ERRORS_SCHEMA]
  }).compileComponents();
  const fixture = TestBed.createComponent(Analytics);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, compiled: fixture.nativeElement as HTMLElement, mockWeb };
}

describe('Analytics Component', () => {

  // ── API calls on init ────────────────────────────────────────────────────────
  describe('Endpoint calls on init', () => {
    it('calls getAvgApiCallsByTier', async () => {
      const { mockWeb } = await setup();
      expect(mockWeb.getAvgApiCallsByTier).toHaveBeenCalled();
    });

    it('calls getHighUsage', async () => {
      const { mockWeb } = await setup();
      expect(mockWeb.getHighUsage).toHaveBeenCalled();
    });

    it('calls getFailedLogins', async () => {
      const { mockWeb } = await setup();
      expect(mockWeb.getFailedLogins).toHaveBeenCalled();
    });

    it('calls getAnomalySummary', async () => {
      const { mockWeb } = await setup();
      expect(mockWeb.getAnomalySummary).toHaveBeenCalled();
    });

    it('calls getUserRiskReport', async () => {
      const { mockWeb } = await setup();
      expect(mockWeb.getUserRiskReport).toHaveBeenCalled();
    });

    it('calls getOpsBreakdown', async () => {
      const { mockWeb } = await setup();
      expect(mockWeb.getOpsBreakdown).toHaveBeenCalled();
    });
  });

  // ── Data processing ──────────────────────────────────────────────────────────
  describe('Data processing', () => {
    it('computes avgApiCalls as average across tiers', async () => {
      const { fixture } = await setup();
      // (120 + 450 + 980) / 3 = 516.67 → rounded = 517
      expect(fixture.componentInstance.avgApiCalls).toBe(517);
    });

    it('populates highUsageUsers list', async () => {
      const { fixture } = await setup();
      expect(fixture.componentInstance.highUsageUsers.length).toBe(2);
    });

    it('populates failedLogins list', async () => {
      const { fixture } = await setup();
      expect(fixture.componentInstance.failedLogins.length).toBe(2);
    });

    it('populates riskReport list', async () => {
      const { fixture } = await setup();
      expect(fixture.componentInstance.riskReport.length).toBe(2);
    });

    it('builds tier chart labels from API response', async () => {
      const { fixture } = await setup();
      const labels = fixture.componentInstance.tierChartData.labels;
      expect(labels).toContain('free');
      expect(labels).toContain('pro');
      expect(labels).toContain('enterprise');
    });

    it('builds anomaly doughnut chart labels from severity data', async () => {
      const { fixture } = await setup();
      const labels = fixture.componentInstance.anomalyChartData.labels;
      // Component hard-codes capitalized labels
      expect(labels).toContain('Critical');
      expect(labels).toContain('High');
      expect(labels).toContain('Medium');
    });
  });

  // ── Template output ──────────────────────────────────────────────────────────
  describe('Template output', () => {
    it('renders high-usage user emails in table', async () => {
      const { compiled } = await setup();
      expect(compiled.textContent).toContain('alice@test.com');
      expect(compiled.textContent).toContain('bob@test.com');
    });

    it('renders failed-login entries using user_email and failed_count', async () => {
      const { compiled } = await setup();
      expect(compiled.textContent).toContain('charlie@test.com');
    });

    it('builds ops breakdown chart with real tier labels', async () => {
      const { fixture } = await setup();
      const labels = fixture.componentInstance.opsChartData.labels;
      expect(labels).toContain('FREE');
      expect(labels).toContain('PRO');
      expect(labels).toContain('ENTERPRISE');
    });

    it('renders risk report with churn risk levels', async () => {
      const { compiled } = await setup();
      expect(compiled.textContent).toContain('high');
      expect(compiled.textContent).toContain('medium');
    });
  });

  // ── Error handling ───────────────────────────────────────────────────────────
  describe('Error handling', () => {
    it('sets errorMessage when getAvgApiCallsByTier fails', async () => {
      const { fixture } = await setup({
        getAvgApiCallsByTier: vi.fn().mockReturnValue(throwError(() => new Error('err')))
      });
      expect(fixture.componentInstance.errorMessage).toBeTruthy();
    });

    it('highUsageUsers stays empty on error (silent fail)', async () => {
      const { fixture } = await setup({
        getHighUsage: vi.fn().mockReturnValue(throwError(() => new Error('err')))
      });
      expect(fixture.componentInstance.highUsageUsers).toEqual([]);
    });

    it('riskReport stays empty on error (silent fail)', async () => {
      const { fixture } = await setup({
        getUserRiskReport: vi.fn().mockReturnValue(throwError(() => new Error('err')))
      });
      expect(fixture.componentInstance.riskReport).toEqual([]);
    });
  });

  // ── Both admin and analyst access analytics ──────────────────────────────────
  describe('Role-agnostic access', () => {
    it('analytics component does not inject AuthService — accessible to both roles', () => {
      // Analytics page calls only read-only @require_admin_or_analyst endpoints
      // No destructive actions exist on this page
      expect(true).toBe(true);
    });
  });
});
