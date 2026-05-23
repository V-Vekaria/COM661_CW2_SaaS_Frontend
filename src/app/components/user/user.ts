import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { WebService } from '../../services/web-service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-user',
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user.html',
  styleUrl: './user.css'
})
export class User {

  userId: string = '';
  userData: any = null;
  errorMessage: string = '';
  successMessage: string = '';

  // usage logs
  usageLogs: any[] = [];
  usageTotal: number = 0;
  usagePage: number = 1;
  usagePageSize: number = 5;

  // api keys
  apiKeys: any[] = [];

  // alerts
  alerts: any[] = [];

  // edit form
  showEditForm: boolean = false;
  editForm: any;

  // add usage log form
  showAddUsageForm: boolean = false;
  addUsageForm: any;

  // add api key form
  showAddKeyForm: boolean = false;
  addKeyForm: any;
  availablePermissions = ['read', 'write', 'delete', 'admin', 'billing'];
  selectedPermissions: string[] = [];

  // add alert form
  showAddAlertForm: boolean = false;
  addAlertForm: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private webService: WebService,
    private fb: FormBuilder,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id') || '';

    this.editForm = this.fb.group({
      subscription_tier: ['', Validators.required],
      status: ['', Validators.required],
      churn_risk: ['', Validators.required]
    });

    this.addUsageForm = this.fb.group({
      api_calls: ['', [Validators.required, Validators.min(1)]],
      storage_mb: ['', [Validators.required, Validators.min(0)]],
      region: ['eu-west'],
      method: ['GET'],
      endpoint: ['/api/data']
    });

    this.addKeyForm = this.fb.group({});

    this.addAlertForm = this.fb.group({
      message: ['', Validators.required],
      severity: ['low'],
      alert_type: ['threshold_breach']
    });

    this.loadUser();
    this.loadUsageLogs();
    this.loadApiKeys();
    this.loadAlerts();
  }

  loadUser() {
    this.webService.getUserById(this.userId).subscribe({
      next: (data) => {
        this.userData = data;
        this.editForm.patchValue({
          subscription_tier: data.subscription?.tier || 'free',
          status: data.subscription?.status || 'active',
          churn_risk: data.metadata?.churn_risk || 'low'
        });
      },
      error: () => { this.errorMessage = 'Failed to load user'; }
    });
  }

  loadUsageLogs() {
    this.webService.getUserUsageLogs(this.userId, this.usagePage, this.usagePageSize).subscribe({
      next: (data) => {
        this.usageLogs = data.logs || [];
        this.usageTotal = data.total || 0;
      },
      error: () => { this.usageLogs = []; }
    });
  }

  usageTotalPages() { return Math.ceil(this.usageTotal / this.usagePageSize); }

  nextUsagePage() {
    if (this.usagePage < this.usageTotalPages()) {
      this.usagePage++;
      this.loadUsageLogs();
    }
  }

  prevUsagePage() {
    if (this.usagePage > 1) {
      this.usagePage--;
      this.loadUsageLogs();
    }
  }

  toggleAddUsageForm() {
    this.showAddUsageForm = !this.showAddUsageForm;
    if (!this.showAddUsageForm) { this.addUsageForm.reset({ region: 'eu-west', method: 'GET', endpoint: '/api/data' }); }
  }

  onAddUsageLog() {
    if (this.addUsageForm.valid) {
      const v = this.addUsageForm.value;
      this.webService.addUsageLog(this.userId, {
        api_calls: Number(v.api_calls),
        storage_mb: Number(v.storage_mb),
        region: v.region,
        method: v.method,
        endpoint: v.endpoint
      }).subscribe({
        next: () => {
          this.successMessage = 'Usage log added';
          this.showAddUsageForm = false;
          this.addUsageForm.reset({ region: 'eu-west', method: 'GET', endpoint: '/api/data' });
          this.usagePage = 1;
          this.loadUsageLogs();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: () => { this.errorMessage = 'Failed to add usage log'; }
      });
    }
  }

  deleteUsageLog(logId: string) {
    if (confirm('Delete this usage log?')) {
      this.webService.deleteUsageLog(this.userId, logId).subscribe({
        next: () => {
          this.usagePage = 1;
          this.loadUsageLogs();
        },
        error: () => { alert('Failed to delete usage log'); }
      });
    }
  }

  loadApiKeys() {
    this.webService.getUserApiKeys(this.userId).subscribe({
      next: (data) => { this.apiKeys = Array.isArray(data) ? data : []; },
      error: () => { this.apiKeys = []; }
    });
  }

  toggleAddKeyForm() {
    this.showAddKeyForm = !this.showAddKeyForm;
    this.selectedPermissions = [];
  }

  togglePermission(perm: string) {
    const idx = this.selectedPermissions.indexOf(perm);
    if (idx > -1) {
      this.selectedPermissions.splice(idx, 1);
    } else {
      this.selectedPermissions.push(perm);
    }
  }

  onAddApiKey() {
    if (this.selectedPermissions.length === 0) {
      alert('Select at least one permission');
      return;
    }
    this.webService.addApiKey(this.userId, { permissions: this.selectedPermissions }).subscribe({
      next: (res) => {
        this.successMessage = 'API key created: ' + res.key_prefix;
        this.showAddKeyForm = false;
        this.selectedPermissions = [];
        this.loadApiKeys();
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: () => { this.errorMessage = 'Failed to create API key'; }
    });
  }

  revokeKey(keyId: string) {
    this.webService.revokeApiKey(this.userId, keyId).subscribe({
      next: () => { this.loadApiKeys(); },
      error: () => { alert('Failed to revoke key'); }
    });
  }

  deleteKey(keyId: string) {
    if (confirm('Delete this API key?')) {
      this.webService.deleteApiKey(this.userId, keyId).subscribe({
        next: () => { this.loadApiKeys(); },
        error: () => { alert('Failed to delete key'); }
      });
    }
  }

  loadAlerts() {
    this.webService.getUserAlerts(this.userId).subscribe({
      next: (data) => { this.alerts = Array.isArray(data) ? data : []; },
      error: () => { this.alerts = []; }
    });
  }

  toggleAddAlertForm() {
    this.showAddAlertForm = !this.showAddAlertForm;
    if (!this.showAddAlertForm) { this.addAlertForm.reset({ severity: 'low', alert_type: 'threshold_breach' }); }
  }

  onAddAlert() {
    if (this.addAlertForm.valid) {
      const v = this.addAlertForm.value;
      this.webService.addAlert(this.userId, {
        message: v.message,
        severity: v.severity,
        alert_type: v.alert_type
      }).subscribe({
        next: () => {
          this.successMessage = 'Alert created';
          this.showAddAlertForm = false;
          this.addAlertForm.reset({ severity: 'low', alert_type: 'threshold_breach' });
          this.loadAlerts();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: () => { this.errorMessage = 'Failed to create alert'; }
      });
    }
  }

  acknowledgeAlert(alertId: string) {
    this.webService.acknowledgeAlert(this.userId, alertId).subscribe({
      next: () => { this.loadAlerts(); },
      error: () => { alert('Failed to acknowledge alert'); }
    });
  }

  deleteAlert(alertId: string) {
    if (confirm('Delete this alert?')) {
      this.webService.deleteAlert(this.userId, alertId).subscribe({
        next: () => { this.loadAlerts(); },
        error: () => { alert('Failed to delete alert'); }
      });
    }
  }

  toggleEditForm() {
    this.showEditForm = !this.showEditForm;
    this.successMessage = '';
    this.errorMessage = '';
  }

  onSaveUser() {
    if (this.editForm.valid) {
      const payload = {
        subscription_tier: this.editForm.value.subscription_tier,
        account_status: this.editForm.value.status,
        churn_risk: this.editForm.value.churn_risk
      };
      this.webService.updateUser(this.userId, payload).subscribe({
        next: () => {
          this.successMessage = 'User updated successfully';
          this.showEditForm = false;
          this.loadUser();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: () => { this.errorMessage = 'Failed to update user'; }
      });
    }
  }

  deleteUser() {
    if (confirm('Permanently delete this user and all their data?')) {
      this.webService.deleteUser(this.userId).subscribe({
        next: () => { this.router.navigate(['/users']); },
        error: () => { this.errorMessage = 'Failed to delete user'; }
      });
    }
  }

  severityClass(severity: string): string {
    const map: any = { critical: 'danger', high: 'warning', medium: 'info', low: 'secondary' };
    return map[severity?.toLowerCase()] || 'secondary';
  }

  churnClass(risk: string): string {
    const map: any = { high: 'danger', medium: 'warning', low: 'success' };
    return map[risk?.toLowerCase()] || 'secondary';
  }
}
