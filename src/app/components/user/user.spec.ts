import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { User } from './user';
import { WebService } from '../../services/web-service';
import { AuthService } from '../../services/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

const mockUser = {
  _id: 'u1',
  profile: {
    first_name: 'Alice', last_name: 'Smith',
    email: 'alice@test.com', role: 'analyst',
    created_at: '2024-01-01T00:00:00Z',
    last_login: '2025-01-01T00:00:00Z'
  },
  subscription: { tier: 'pro', status: 'active' },
  metadata: { churn_risk: 'low', industry: 'tech' }
};

const mockUsageLogs = {
  logs: [{
    _id: 'l1', timestamp: '2025-01-01T00:00:00Z',
    metrics: { api_calls: 50, storage_mb: 10 },
    request: { region: 'eu-west', method: 'GET', status_code: 200 }
  }],
  total: 1
};

const mockApiKeys = [
  { _id: 'k1', key_prefix: 'sk_live_abc', permissions: ['read'], last_used: '2025-01-01', revoked: false }
];

const mockAlerts = [
  { _id: 'a1', message: 'High usage detected', alert_type: 'usage', severity: 'high', triggered_at: '2025-01-01', acknowledged: false }
];

function makeWebMock() {
  return {
    getUserById: vi.fn().mockReturnValue(of(mockUser)),
    getUserUsageLogs: vi.fn().mockReturnValue(of(mockUsageLogs)),
    getUserApiKeys: vi.fn().mockReturnValue(of(mockApiKeys)),
    getUserAlerts: vi.fn().mockReturnValue(of(mockAlerts)),
    updateUser: vi.fn().mockReturnValue(of({})),
    revokeApiKey: vi.fn().mockReturnValue(of({})),
    deleteApiKey: vi.fn().mockReturnValue(of({})),
    acknowledgeAlert: vi.fn().mockReturnValue(of({})),
    deleteAlert: vi.fn().mockReturnValue(of({})),
    addUsageLog: vi.fn().mockReturnValue(of({ log_id: 'new_log' })),
    deleteUsageLog: vi.fn().mockReturnValue(of({})),
    addApiKey: vi.fn().mockReturnValue(of({ key_id: 'new_key', key_prefix: 'sk_live_xyz' })),
    addAlert: vi.fn().mockReturnValue(of({ alert_id: 'new_alert' }))
  };
}

async function setup(role: string) {
  const mockWeb = makeWebMock();
  const mockAuth = {
    isAdmin: vi.fn().mockReturnValue(role === 'admin'),
    isAnalyst: vi.fn().mockReturnValue(role === 'analyst')
  };
  await TestBed.configureTestingModule({
    imports: [User],
    providers: [
      { provide: WebService, useValue: mockWeb },
      { provide: AuthService, useValue: mockAuth },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'u1' } } } },
      { provide: Router, useValue: { navigate: vi.fn() } }
    ],
    schemas: [NO_ERRORS_SCHEMA]
  }).compileComponents();
  const fixture = TestBed.createComponent(User);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, compiled: fixture.nativeElement as HTMLElement, mockWeb };
}

describe('User Detail Component', () => {

  // ── Data loading (both roles) ───────────────────────────────────────────────
  describe('Data loading', () => {
    it('loads user data by id on init', async () => {
      const { mockWeb } = await setup('admin');
      expect(mockWeb.getUserById).toHaveBeenCalledWith('u1');
    });

    it('loads usage logs on init', async () => {
      const { mockWeb } = await setup('admin');
      expect(mockWeb.getUserUsageLogs).toHaveBeenCalledWith('u1', 1, 5);
    });

    it('loads API keys on init', async () => {
      const { mockWeb } = await setup('admin');
      expect(mockWeb.getUserApiKeys).toHaveBeenCalledWith('u1');
    });

    it('loads alerts on init', async () => {
      const { mockWeb } = await setup('admin');
      expect(mockWeb.getUserAlerts).toHaveBeenCalledWith('u1');
    });

    it('displays user first and last name', async () => {
      const { compiled } = await setup('analyst');
      expect(compiled.textContent).toContain('Alice');
      expect(compiled.textContent).toContain('Smith');
    });

    it('displays user email', async () => {
      const { compiled } = await setup('analyst');
      expect(compiled.textContent).toContain('alice@test.com');
    });

    it('displays subscription tier badge', async () => {
      const { compiled } = await setup('analyst');
      expect(compiled.textContent).toContain('pro');
    });

    it('displays usage log row with api_calls', async () => {
      const { compiled } = await setup('analyst');
      expect(compiled.textContent).toContain('50');
    });

    it('displays API key prefix', async () => {
      const { compiled } = await setup('analyst');
      expect(compiled.textContent).toContain('sk_live_abc');
    });

    it('displays alert message', async () => {
      const { compiled } = await setup('analyst');
      expect(compiled.textContent).toContain('High usage detected');
    });
  });

  // ── Admin role ──────────────────────────────────────────────────────────────
  describe('Admin role', () => {
    it('shows Edit button in profile card header', async () => {
      const { compiled } = await setup('admin');
      const editBtn = compiled.querySelector('.card-header .btn-outline-light');
      expect(editBtn).toBeTruthy();
      expect(editBtn?.textContent).toContain('Edit');
    });

    it('shows Revoke button for active API keys', async () => {
      const { compiled } = await setup('admin');
      const revokeBtn = compiled.querySelector('button.btn-warning');
      expect(revokeBtn).toBeTruthy();
      expect(revokeBtn?.textContent).toContain('Revoke');
    });

    it('shows Delete button for API keys', async () => {
      const { compiled } = await setup('admin');
      const apiKeySection = compiled.querySelectorAll('button.btn-danger');
      expect(apiKeySection.length).toBeGreaterThan(0);
    });

    it('shows Delete button for alerts', async () => {
      const { compiled } = await setup('admin');
      const alertDeleteBtns = compiled.querySelectorAll('button.btn-danger');
      expect(alertDeleteBtns.length).toBeGreaterThan(0);
    });

    it('shows Actions column header in API keys table', async () => {
      const { compiled } = await setup('admin');
      const ths = Array.from(compiled.querySelectorAll('th'));
      expect(ths.some(th => th.textContent?.trim() === 'Actions')).toBe(true);
    });

    it('toggles edit form', async () => {
      const { fixture } = await setup('admin');
      const comp = fixture.componentInstance;
      expect(comp.showEditForm).toBe(false);
      comp.toggleEditForm();
      expect(comp.showEditForm).toBe(true);
      comp.toggleEditForm();
      expect(comp.showEditForm).toBe(false);
    });

    it('calls updateUser with account_status field (not status)', async () => {
      const { fixture, mockWeb } = await setup('admin');
      const comp = fixture.componentInstance;
      comp.editForm.setValue({ subscription_tier: 'enterprise', status: 'suspended', churn_risk: 'high' });
      comp.onSaveUser();
      expect(mockWeb.updateUser).toHaveBeenCalledWith('u1', {
        subscription_tier: 'enterprise',
        account_status: 'suspended',
        churn_risk: 'high'
      });
    });

    it('shows + Add Log button for usage logs', async () => {
      const { compiled } = await setup('admin');
      expect(compiled.textContent).toContain('+ Add Log');
    });

    it('toggles add usage log form', async () => {
      const { fixture } = await setup('admin');
      const comp = fixture.componentInstance;
      expect(comp.showAddUsageForm).toBe(false);
      comp.toggleAddUsageForm();
      expect(comp.showAddUsageForm).toBe(true);
    });

    it('calls addUsageLog with numeric values', async () => {
      const { fixture, mockWeb } = await setup('admin');
      const comp = fixture.componentInstance;
      comp.addUsageForm.setValue({ api_calls: 100, storage_mb: 50, region: 'eu-west', method: 'GET', endpoint: '/api/data' });
      comp.onAddUsageLog();
      expect(mockWeb.addUsageLog).toHaveBeenCalledWith('u1', expect.objectContaining({ api_calls: 100, storage_mb: 50 }));
    });

    it('calls deleteUsageLog on confirm', async () => {
      const { fixture, mockWeb } = await setup('admin');
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      fixture.componentInstance.deleteUsageLog('l1');
      expect(mockWeb.deleteUsageLog).toHaveBeenCalledWith('u1', 'l1');
    });

    it('shows + Add Key button for API keys', async () => {
      const { compiled } = await setup('admin');
      expect(compiled.textContent).toContain('+ Add Key');
    });

    it('toggles permission selection', async () => {
      const { fixture } = await setup('admin');
      const comp = fixture.componentInstance;
      comp.togglePermission('read');
      expect(comp.selectedPermissions).toContain('read');
      comp.togglePermission('read');
      expect(comp.selectedPermissions).not.toContain('read');
    });

    it('calls addApiKey with selected permissions', async () => {
      const { fixture, mockWeb } = await setup('admin');
      const comp = fixture.componentInstance;
      comp.selectedPermissions = ['read', 'write'];
      comp.onAddApiKey();
      expect(mockWeb.addApiKey).toHaveBeenCalledWith('u1', { permissions: ['read', 'write'] });
    });

    it('shows + Add Alert button', async () => {
      const { compiled } = await setup('admin');
      expect(compiled.textContent).toContain('+ Add Alert');
    });

    it('calls addAlert with correct payload', async () => {
      const { fixture, mockWeb } = await setup('admin');
      const comp = fixture.componentInstance;
      comp.addAlertForm.setValue({ message: 'Test alert', severity: 'high', alert_type: 'security_event' });
      comp.onAddAlert();
      expect(mockWeb.addAlert).toHaveBeenCalledWith('u1', {
        message: 'Test alert',
        severity: 'high',
        alert_type: 'security_event'
      });
    });

    it('calls revokeApiKey with correct ids', async () => {
      const { fixture, mockWeb } = await setup('admin');
      fixture.componentInstance.revokeKey('k1');
      expect(mockWeb.revokeApiKey).toHaveBeenCalledWith('u1', 'k1');
    });

    it('calls deleteApiKey on confirm', async () => {
      const { fixture, mockWeb } = await setup('admin');
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      fixture.componentInstance.deleteKey('k1');
      expect(mockWeb.deleteApiKey).toHaveBeenCalledWith('u1', 'k1');
    });

    it('does not call deleteApiKey when confirm cancelled', async () => {
      const { fixture, mockWeb } = await setup('admin');
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      fixture.componentInstance.deleteKey('k1');
      expect(mockWeb.deleteApiKey).not.toHaveBeenCalled();
    });

    it('calls deleteAlert with correct ids on confirm', async () => {
      const { fixture, mockWeb } = await setup('admin');
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      fixture.componentInstance.deleteAlert('a1');
      expect(mockWeb.deleteAlert).toHaveBeenCalledWith('u1', 'a1');
    });

    it('can also acknowledge alerts', async () => {
      const { fixture, mockWeb } = await setup('admin');
      fixture.componentInstance.acknowledgeAlert('a1');
      expect(mockWeb.acknowledgeAlert).toHaveBeenCalledWith('u1', 'a1');
    });
  });

  // ── Analyst role ────────────────────────────────────────────────────────────
  describe('Analyst role', () => {
    it('does not show Edit button in profile header', async () => {
      const { compiled } = await setup('analyst');
      const editBtn = compiled.querySelector('.card-header .btn-outline-light');
      expect(editBtn).toBeNull();
    });

    it('does not show Revoke button for API keys', async () => {
      const { compiled } = await setup('analyst');
      const revokeBtn = compiled.querySelector('button.btn-warning');
      expect(revokeBtn).toBeNull();
    });

    it('does not show Delete button for API keys or alerts', async () => {
      const { compiled } = await setup('analyst');
      const deleteBtns = compiled.querySelectorAll('button.btn-danger');
      expect(deleteBtns.length).toBe(0);
    });

    it('does not show Actions column in API keys table', async () => {
      const { compiled } = await setup('analyst');
      // API keys table header should not have "Actions" column
      const apiKeyTable = compiled.querySelectorAll('table')[1]; // second table = api keys
      if (apiKeyTable) {
        const ths = Array.from(apiKeyTable.querySelectorAll('th'));
        expect(ths.some(th => th.textContent?.trim() === 'Actions')).toBe(false);
      }
    });

    it('shows Acknowledge button for unacknowledged alert', async () => {
      const { compiled } = await setup('analyst');
      const ackBtn = compiled.querySelector('button.btn-success');
      expect(ackBtn).toBeTruthy();
      expect(ackBtn?.textContent).toContain('Ack');
    });

    it('calls acknowledgeAlert when Ack clicked', async () => {
      const { fixture, mockWeb } = await setup('analyst');
      fixture.componentInstance.acknowledgeAlert('a1');
      expect(mockWeb.acknowledgeAlert).toHaveBeenCalledWith('u1', 'a1');
    });

    it('displays usage logs in read-only table', async () => {
      const { compiled } = await setup('analyst');
      expect(compiled.textContent).toContain('eu-west');
      expect(compiled.textContent).toContain('GET');
    });

    it('can paginate usage logs', async () => {
      const { fixture, mockWeb } = await setup('analyst');
      const comp = fixture.componentInstance;
      comp.usageTotal = 15;
      comp.usagePage = 1;
      comp.nextUsagePage();
      expect(comp.usagePage).toBe(2);
      expect(mockWeb.getUserUsageLogs).toHaveBeenCalledTimes(2);
    });
  });
});
