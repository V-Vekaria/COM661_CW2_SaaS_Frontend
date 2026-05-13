import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
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

  constructor(
    private route: ActivatedRoute,
    private webService: WebService,
    private fb: FormBuilder,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    this.loadUser();
    this.loadUsageLogs();
    this.loadApiKeys();
    this.loadAlerts();

    this.editForm = this.fb.group({
      subscription_tier: ['', Validators.required],
      status: ['', Validators.required],
      churn_risk: ['', Validators.required]
    });
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

  loadApiKeys() {
    this.webService.getUserApiKeys(this.userId).subscribe({
      next: (data) => { this.apiKeys = Array.isArray(data) ? data : []; },
      error: () => { this.apiKeys = []; }
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
        status: this.editForm.value.status,
        churn_risk: this.editForm.value.churn_risk
      };
      this.webService.updateUser(this.userId, payload).subscribe({
        next: () => {
          this.successMessage = 'User updated successfully';
          this.showEditForm = false;
          this.loadUser();
        },
        error: () => { this.errorMessage = 'Failed to update user'; }
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
