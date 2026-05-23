import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnomalyFlags } from './anomaly-flags';
import { WebService } from '../../services/web-service';
import { AuthService } from '../../services/auth';
import { of } from 'rxjs';
import { vi } from 'vitest';

const mockFlagsData = {
  flags: [
    {
      _id: 'f1',
      user_id: 'u1',
      detected_at: '2025-01-01T10:00:00Z',
      category: 'security',
      severity: 'critical',
      anomaly_score: 0.92,
      reason: 'Unusual login pattern from multiple IPs',
      resolved: false,
      resolution_logs: []
    },
    {
      _id: 'f2',
      user_id: 'u2',
      detected_at: '2025-01-02T12:00:00Z',
      category: 'billing',
      severity: 'high',
      anomaly_score: 0.75,
      reason: 'Unexpected spike in API usage',
      resolved: true,
      resolution_logs: [
        {
          _id: 'r1',
          note: 'Investigated - false positive',
          action_taken: 'dismissed',
          resolved_by: 'admin@test.com',
          resolved_at: '2025-01-03T00:00:00Z'
        }
      ]
    }
  ],
  total: 2
};

async function setup(role: string) {
  const mockWeb = {
    getAnomalyFlagsFiltered: vi.fn().mockReturnValue(of(mockFlagsData)),
    resolveAnomaly: vi.fn().mockReturnValue(of({})),
    deleteAnomalyFlag: vi.fn().mockReturnValue(of({})),
    deleteResolutionLog: vi.fn().mockReturnValue(of({}))
  };
  const mockAuth = {
    isAdmin: vi.fn().mockReturnValue(role === 'admin'),
    isAnalyst: vi.fn().mockReturnValue(role === 'analyst')
  };
  await TestBed.configureTestingModule({
    imports: [AnomalyFlags],
    providers: [
      { provide: WebService, useValue: mockWeb },
      { provide: AuthService, useValue: mockAuth }
    ]
  }).compileComponents();
  const fixture = TestBed.createComponent(AnomalyFlags);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, compiled: fixture.nativeElement as HTMLElement, mockWeb };
}

describe('AnomalyFlags Component', () => {

  // ── Both roles ──────────────────────────────────────────────────────────────
  describe('Both roles', () => {
    it('loads flags on init', async () => {
      const { mockWeb } = await setup('admin');
      expect(mockWeb.getAnomalyFlagsFiltered).toHaveBeenCalled();
    });

    it('displays flag rows', async () => {
      const { compiled } = await setup('analyst');
      expect(compiled.textContent).toContain('security');
      expect(compiled.textContent).toContain('billing');
    });

    it('displays severity badges', async () => {
      const { compiled } = await setup('analyst');
      expect(compiled.textContent).toContain('critical');
      expect(compiled.textContent).toContain('high');
    });

    it('displays resolved status', async () => {
      const { compiled } = await setup('analyst');
      expect(compiled.textContent).toContain('Open');
      expect(compiled.textContent).toContain('Resolved');
    });

    it('shows total count badge', async () => {
      const { compiled } = await setup('analyst');
      expect(compiled.textContent).toContain('2');
    });

    it('shows Resolve button for unresolved flag', async () => {
      const { compiled } = await setup('analyst');
      const resolveBtns = compiled.querySelectorAll('button.btn-success');
      expect(resolveBtns.length).toBeGreaterThan(0);
      expect(resolveBtns[0].textContent).toContain('Resolve');
    });

    it('does not show Resolve button for already-resolved flag', async () => {
      const { fixture, compiled } = await setup('analyst');
      const comp = fixture.componentInstance;
      // f2 is resolved — only f1 should have Resolve button
      const resolveBtns = compiled.querySelectorAll('button.btn-success');
      expect(resolveBtns.length).toBe(1);
    });

    it('opens resolve modal when openResolve called', async () => {
      const { fixture } = await setup('analyst');
      const comp = fixture.componentInstance;
      comp.openResolve(mockFlagsData.flags[0]);
      expect(comp.resolvingFlag?._id).toBe('f1');
    });

    it('closes resolve modal when closeResolve called', async () => {
      const { fixture } = await setup('analyst');
      const comp = fixture.componentInstance;
      comp.openResolve(mockFlagsData.flags[0]);
      comp.closeResolve();
      expect(comp.resolvingFlag).toBeNull();
    });

    it('shows error if submitResolve called with empty note', async () => {
      const { fixture } = await setup('analyst');
      const comp = fixture.componentInstance;
      comp.resolvingFlag = mockFlagsData.flags[0];
      comp.resolveNote = '  ';
      comp.submitResolve();
      expect(comp.resolveError).toBe('Note is required');
    });

    it('calls resolveAnomaly with id and note on submitResolve', async () => {
      const { fixture, mockWeb } = await setup('analyst');
      const comp = fixture.componentInstance;
      comp.resolvingFlag = mockFlagsData.flags[0];
      comp.resolveNote = 'Investigated and resolved';
      comp.submitResolve();
      expect(mockWeb.resolveAnomaly).toHaveBeenCalledWith('f1', 'Investigated and resolved');
    });

    it('appends severity filter to URL', async () => {
      const { fixture, mockWeb } = await setup('analyst');
      const comp = fixture.componentInstance;
      comp.filterSeverity = 'critical';
      comp.applyFilters();
      const url: string = mockWeb.getAnomalyFlagsFiltered.mock.calls[1][0];
      expect(url).toContain('severity=critical');
    });

    it('appends category filter to URL', async () => {
      const { fixture, mockWeb } = await setup('analyst');
      const comp = fixture.componentInstance;
      comp.filterCategory = 'security';
      comp.applyFilters();
      const url: string = mockWeb.getAnomalyFlagsFiltered.mock.calls[1][0];
      expect(url).toContain('category=security');
    });

    it('appends resolved filter to URL', async () => {
      const { fixture, mockWeb } = await setup('analyst');
      const comp = fixture.componentInstance;
      comp.filterResolved = 'false';
      comp.applyFilters();
      const url: string = mockWeb.getAnomalyFlagsFiltered.mock.calls[1][0];
      expect(url).toContain('resolved=false');
    });

    it('clears all filters on clearFilters()', async () => {
      const { fixture } = await setup('analyst');
      const comp = fixture.componentInstance;
      comp.filterSeverity = 'critical';
      comp.filterCategory = 'security';
      comp.filterResolved = 'false';
      comp.clearFilters();
      expect(comp.filterSeverity).toBe('');
      expect(comp.filterCategory).toBe('');
      expect(comp.filterResolved).toBe('');
    });

    it('toggles row expansion on toggleExpand', async () => {
      const { fixture } = await setup('analyst');
      const comp = fixture.componentInstance;
      comp.toggleExpand('f1');
      expect(comp.expandedId).toBe('f1');
      comp.toggleExpand('f1');
      expect(comp.expandedId).toBe('');
    });

    it('paginates forward', async () => {
      const { fixture, mockWeb } = await setup('analyst');
      const comp = fixture.componentInstance;
      comp.total = 30;
      comp.page = 1;
      comp.nextPage();
      expect(comp.page).toBe(2);
      expect(mockWeb.getAnomalyFlagsFiltered).toHaveBeenCalledTimes(2);
    });

    it('paginates backward', async () => {
      const { fixture, mockWeb } = await setup('analyst');
      const comp = fixture.componentInstance;
      comp.total = 30;
      comp.page = 2;
      comp.prevPage();
      expect(comp.page).toBe(1);
    });
  });

  // ── Admin role ──────────────────────────────────────────────────────────────
  describe('Admin role', () => {
    it('shows delete (×) button for each flag', async () => {
      const { compiled } = await setup('admin');
      const deleteBtns = compiled.querySelectorAll('button.btn-outline-danger');
      expect(deleteBtns.length).toBe(2);
    });

    it('calls deleteAnomalyFlag with correct id on confirm', async () => {
      const { fixture, mockWeb } = await setup('admin');
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      fixture.componentInstance.deleteFlag('f1');
      expect(mockWeb.deleteAnomalyFlag).toHaveBeenCalledWith('f1');
    });

    it('does not call deleteAnomalyFlag when confirm cancelled', async () => {
      const { fixture, mockWeb } = await setup('admin');
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      fixture.componentInstance.deleteFlag('f1');
      expect(mockWeb.deleteAnomalyFlag).not.toHaveBeenCalled();
    });

    it('reloads flags after successful delete', async () => {
      const { fixture, mockWeb } = await setup('admin');
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      fixture.componentInstance.deleteFlag('f1');
      expect(mockWeb.getAnomalyFlagsFiltered).toHaveBeenCalledTimes(2);
    });

    it('calls deleteResolutionLog with correct ids on confirm', async () => {
      const { fixture, mockWeb } = await setup('admin');
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      fixture.componentInstance.deleteResolution('f2', 'r1');
      expect(mockWeb.deleteResolutionLog).toHaveBeenCalledWith('f2', 'r1');
    });

    it('does not call deleteResolutionLog when confirm cancelled', async () => {
      const { fixture, mockWeb } = await setup('admin');
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      fixture.componentInstance.deleteResolution('f2', 'r1');
      expect(mockWeb.deleteResolutionLog).not.toHaveBeenCalled();
    });
  });

  // ── Analyst role ────────────────────────────────────────────────────────────
  describe('Analyst role', () => {
    it('does not show delete (×) button on any flag', async () => {
      const { compiled } = await setup('analyst');
      const deleteBtns = compiled.querySelectorAll('button.btn-outline-danger');
      expect(deleteBtns.length).toBe(0);
    });

    it('can still resolve anomalies', async () => {
      const { fixture, mockWeb } = await setup('analyst');
      const comp = fixture.componentInstance;
      comp.resolvingFlag = mockFlagsData.flags[0];
      comp.resolveNote = 'Looked into it';
      comp.submitResolve();
      expect(mockWeb.resolveAnomaly).toHaveBeenCalledWith('f1', 'Looked into it');
    });

    it('can still filter by severity', async () => {
      const { fixture, mockWeb } = await setup('analyst');
      const comp = fixture.componentInstance;
      comp.filterSeverity = 'high';
      comp.applyFilters();
      expect(mockWeb.getAnomalyFlagsFiltered).toHaveBeenCalledTimes(2);
    });

    it('can expand rows to see details', async () => {
      const { fixture } = await setup('analyst');
      const comp = fixture.componentInstance;
      comp.toggleExpand('f2');
      expect(comp.expandedId).toBe('f2');
    });
  });

  // ── Utility methods ─────────────────────────────────────────────────────────
  describe('Utility methods', () => {
    it('severityClass maps critical to danger', async () => {
      const { fixture } = await setup('admin');
      expect(fixture.componentInstance.severityClass('critical')).toBe('danger');
    });

    it('severityClass maps high to warning', async () => {
      const { fixture } = await setup('admin');
      expect(fixture.componentInstance.severityClass('high')).toBe('warning');
    });

    it('severityClass maps medium to info', async () => {
      const { fixture } = await setup('admin');
      expect(fixture.componentInstance.severityClass('medium')).toBe('info');
    });

    it('scoreBar converts score to percentage', async () => {
      const { fixture } = await setup('admin');
      expect(fixture.componentInstance.scoreBar(0.75)).toBe(75);
    });

    it('scoreColor returns danger for score >= 0.8', async () => {
      const { fixture } = await setup('admin');
      expect(fixture.componentInstance.scoreColor(0.92)).toBe('danger');
    });

    it('scoreColor returns warning for score >= 0.5', async () => {
      const { fixture } = await setup('admin');
      expect(fixture.componentInstance.scoreColor(0.65)).toBe('warning');
    });

    it('scoreColor returns success for score < 0.5', async () => {
      const { fixture } = await setup('admin');
      expect(fixture.componentInstance.scoreColor(0.3)).toBe('success');
    });
  });
});
