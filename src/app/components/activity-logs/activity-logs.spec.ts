import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityLogs } from './activity-logs';
import { WebService } from '../../services/web-service';
import { AuthService } from '../../services/auth';
import { of } from 'rxjs';
import { vi } from 'vitest';

const mockLogsData = {
  logs: [
    {
      _id: 'l1',
      timestamp: '2025-01-01T10:00:00Z',
      user_email: 'alice@test.com',
      action_type: 'login',
      network: { region: 'eu-west', device_type: 'desktop', ip_address: '1.2.3.4', location: { coordinates: [] } },
      performance: { status_code: 200, response_time_ms: 120, bytes_transferred: 1024 },
      session_id: 'sess1',
      endpoint: '/api/data'
    },
    {
      _id: 'l2',
      timestamp: '2025-01-02T11:00:00Z',
      user_email: 'bob@test.com',
      action_type: 'delete',
      network: { region: 'us-east', device_type: 'mobile', ip_address: '5.6.7.8', location: { coordinates: [] } },
      performance: { status_code: 500, response_time_ms: 300, bytes_transferred: 512 },
      session_id: 'sess2',
      endpoint: '/api/users/1'
    }
  ],
  total: 2
};

async function setup(role: string) {
  const mockWeb = {
    getActivityLogsFiltered: vi.fn().mockReturnValue(of(mockLogsData)),
    deleteActivityLog: vi.fn().mockReturnValue(of({})),
    addActivityLog: vi.fn().mockReturnValue(of({ log_id: 'new_log' }))
  };
  const mockAuth = {
    isAdmin: vi.fn().mockReturnValue(role === 'admin'),
    isAnalyst: vi.fn().mockReturnValue(role === 'analyst')
  };
  await TestBed.configureTestingModule({
    imports: [ActivityLogs],
    providers: [
      { provide: WebService, useValue: mockWeb },
      { provide: AuthService, useValue: mockAuth }
    ]
  }).compileComponents();
  const fixture = TestBed.createComponent(ActivityLogs);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, compiled: fixture.nativeElement as HTMLElement, mockWeb };
}

describe('ActivityLogs Component', () => {

  // ── Both roles ──────────────────────────────────────────────────────────────
  describe('Both roles', () => {
    it('loads logs on init', async () => {
      const { mockWeb } = await setup('admin');
      expect(mockWeb.getActivityLogsFiltered).toHaveBeenCalled();
    });

    it('builds correct URL on init (no filters)', async () => {
      const { mockWeb } = await setup('analyst');
      const url: string = mockWeb.getActivityLogsFiltered.mock.calls[0][0];
      expect(url).toContain('/activity-logs?pn=1&ps=');
    });

    it('displays log rows', async () => {
      const { compiled } = await setup('analyst');
      expect(compiled.textContent).toContain('alice@test.com');
      expect(compiled.textContent).toContain('bob@test.com');
    });

    it('displays action_type badges', async () => {
      const { compiled } = await setup('analyst');
      expect(compiled.textContent).toContain('login');
      expect(compiled.textContent).toContain('delete');
    });

    it('displays region', async () => {
      const { compiled } = await setup('analyst');
      expect(compiled.textContent).toContain('eu-west');
    });

    it('displays status code badges', async () => {
      const { compiled } = await setup('analyst');
      expect(compiled.textContent).toContain('200');
      expect(compiled.textContent).toContain('500');
    });

    it('shows total count badge', async () => {
      const { compiled } = await setup('analyst');
      expect(compiled.textContent).toContain('2');
    });

    it('appends action_type filter to URL', async () => {
      const { fixture, mockWeb } = await setup('analyst');
      const comp = fixture.componentInstance;
      comp.filterAction = 'login';
      comp.applyFilters();
      const url: string = mockWeb.getActivityLogsFiltered.mock.calls[1][0];
      expect(url).toContain('action_type=login');
    });

    it('appends region filter to URL', async () => {
      const { fixture, mockWeb } = await setup('analyst');
      const comp = fixture.componentInstance;
      comp.filterRegion = 'us-east';
      comp.applyFilters();
      const url: string = mockWeb.getActivityLogsFiltered.mock.calls[1][0];
      expect(url).toContain('region=us-east');
    });

    it('appends status_code filter to URL', async () => {
      const { fixture, mockWeb } = await setup('analyst');
      const comp = fixture.componentInstance;
      comp.filterStatus = '200';
      comp.applyFilters();
      const url: string = mockWeb.getActivityLogsFiltered.mock.calls[1][0];
      expect(url).toContain('status_code=200');
    });

    it('resets to page 1 and clears filters on clearFilters()', async () => {
      const { fixture, mockWeb } = await setup('analyst');
      const comp = fixture.componentInstance;
      comp.filterAction = 'login';
      comp.filterRegion = 'eu-west';
      comp.page = 3;
      comp.clearFilters();
      expect(comp.filterAction).toBe('');
      expect(comp.filterRegion).toBe('');
      expect(comp.page).toBe(1);
      expect(mockWeb.getActivityLogsFiltered).toHaveBeenCalledTimes(2);
    });

    it('toggles selectedLog when row clicked (viewLog)', async () => {
      const { fixture } = await setup('analyst');
      const comp = fixture.componentInstance;
      const log = mockLogsData.logs[0];
      comp.viewLog(log);
      expect(comp.selectedLog?._id).toBe('l1');
      // click same log again to deselect
      comp.viewLog(log);
      expect(comp.selectedLog).toBeNull();
    });

    it('paginates forward', async () => {
      const { fixture, mockWeb } = await setup('admin');
      const comp = fixture.componentInstance;
      comp.total = 30;
      comp.page = 1;
      comp.nextPage();
      expect(comp.page).toBe(2);
      expect(mockWeb.getActivityLogsFiltered).toHaveBeenCalledTimes(2);
    });

    it('paginates backward', async () => {
      const { fixture, mockWeb } = await setup('admin');
      const comp = fixture.componentInstance;
      comp.total = 30;
      comp.page = 2;
      comp.prevPage();
      expect(comp.page).toBe(1);
      expect(mockWeb.getActivityLogsFiltered).toHaveBeenCalledTimes(2);
    });
  });

  // ── Add log form (both roles) ────────────────────────────────────────────────
  describe('Add log form', () => {
    it('shows + Log Activity button for both roles', async () => {
      const { compiled } = await setup('analyst');
      expect(compiled.textContent).toContain('+ Log Activity');
    });

    it('toggles add form visibility', async () => {
      const { fixture } = await setup('analyst');
      const comp = fixture.componentInstance;
      expect(comp.showAddForm).toBe(false);
      comp.toggleAddForm();
      expect(comp.showAddForm).toBe(true);
      comp.toggleAddForm();
      expect(comp.showAddForm).toBe(false);
    });

    it('calls addActivityLog with form values', async () => {
      const { fixture, mockWeb } = await setup('analyst');
      const comp = fixture.componentInstance;
      comp.addLogForm.setValue({
        user_id: 'abc123', user_email: 'test@test.com',
        action_type: 'login', region: 'us-east',
        device_type: 'mobile', status_code: 201, response_time_ms: 50
      });
      comp.onAddLog();
      expect(mockWeb.addActivityLog).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'abc123', action_type: 'login', status_code: 201
      }));
    });

    it('does not call addActivityLog when form is invalid', async () => {
      const { fixture, mockWeb } = await setup('analyst');
      const comp = fixture.componentInstance;
      comp.addLogForm.reset();
      comp.onAddLog();
      expect(mockWeb.addActivityLog).not.toHaveBeenCalled();
    });
  });

  // ── Admin role ──────────────────────────────────────────────────────────────
  describe('Admin role', () => {
    it('shows delete (×) button for each log row', async () => {
      const { compiled } = await setup('admin');
      const deleteBtns = compiled.querySelectorAll('button.btn-outline-danger');
      expect(deleteBtns.length).toBe(2);
    });

    it('calls deleteActivityLog with correct id on confirm', async () => {
      const { fixture, mockWeb } = await setup('admin');
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      fixture.componentInstance.deleteLog('l1');
      expect(mockWeb.deleteActivityLog).toHaveBeenCalledWith('l1');
    });

    it('does not call deleteActivityLog when confirm is cancelled', async () => {
      const { fixture, mockWeb } = await setup('admin');
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      fixture.componentInstance.deleteLog('l1');
      expect(mockWeb.deleteActivityLog).not.toHaveBeenCalled();
    });

    it('reloads logs after successful delete', async () => {
      const { fixture, mockWeb } = await setup('admin');
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      fixture.componentInstance.deleteLog('l1');
      // Called once on init, once after delete
      expect(mockWeb.getActivityLogsFiltered).toHaveBeenCalledTimes(2);
    });
  });

  // ── Analyst role ────────────────────────────────────────────────────────────
  describe('Analyst role', () => {
    it('does not show delete button on any log row', async () => {
      const { compiled } = await setup('analyst');
      const deleteBtns = compiled.querySelectorAll('button.btn-outline-danger');
      expect(deleteBtns.length).toBe(0);
    });

    it('can still view log detail on row click', async () => {
      const { fixture } = await setup('analyst');
      const comp = fixture.componentInstance;
      comp.viewLog(mockLogsData.logs[0]);
      expect(comp.selectedLog?._id).toBe('l1');
    });

    it('can filter logs', async () => {
      const { fixture, mockWeb } = await setup('analyst');
      const comp = fixture.componentInstance;
      comp.filterAction = 'login';
      comp.applyFilters();
      expect(mockWeb.getActivityLogsFiltered).toHaveBeenCalledTimes(2);
    });
  });
});
