import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { WebService } from '../../services/web-service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-activity-logs',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './activity-logs.html',
  styleUrl: './activity-logs.css'
})
export class ActivityLogs {

  logs: any[] = [];
  total: number = 0;
  page: number = 1;
  pageSize: number = 15;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // filters
  filterAction: string = '';
  filterRegion: string = '';
  filterStatus: string = '';

  // detail view
  selectedLog: any = null;

  // add log form
  showAddForm: boolean = false;
  addLogForm: any;

  constructor(
    private webService: WebService,
    private fb: FormBuilder,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.addLogForm = this.fb.group({
      user_id: ['', Validators.required],
      user_email: [''],
      action_type: ['login', Validators.required],
      region: ['eu-west'],
      device_type: ['desktop'],
      status_code: [200, [Validators.required, Validators.min(100), Validators.max(599)]],
      response_time_ms: [0, [Validators.required, Validators.min(0)]]
    });
    this.loadLogs();
  }

  loadLogs() {
    this.isLoading = true;
    this.errorMessage = '';
    let url = '/activity-logs?pn=' + this.page + '&ps=' + this.pageSize;
    if (this.filterAction) url += '&action_type=' + this.filterAction;
    if (this.filterRegion) url += '&region=' + this.filterRegion;
    if (this.filterStatus) url += '&status_code=' + this.filterStatus;

    this.webService.getActivityLogsFiltered(url).subscribe({
      next: (data) => {
        this.logs = data.logs || [];
        this.total = data.total || 0;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load activity logs';
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    this.page = 1;
    this.loadLogs();
  }

  clearFilters() {
    this.filterAction = '';
    this.filterRegion = '';
    this.filterStatus = '';
    this.page = 1;
    this.loadLogs();
  }

  totalPages() { return Math.ceil(this.total / this.pageSize); }

  nextPage() {
    if (this.page < this.totalPages()) { this.page++; this.loadLogs(); }
  }

  prevPage() {
    if (this.page > 1) { this.page--; this.loadLogs(); }
  }

  viewLog(log: any) {
    this.selectedLog = this.selectedLog?._id === log._id ? null : log;
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.addLogForm.reset({ action_type: 'login', region: 'eu-west', device_type: 'desktop', status_code: 200, response_time_ms: 0 });
    }
  }

  onAddLog() {
    if (this.addLogForm.valid) {
      const v = this.addLogForm.value;
      this.webService.addActivityLog({
        user_id: v.user_id,
        user_email: v.user_email,
        action_type: v.action_type,
        region: v.region,
        device_type: v.device_type,
        status_code: Number(v.status_code),
        response_time_ms: Number(v.response_time_ms)
      }).subscribe({
        next: () => {
          this.successMessage = 'Activity log created';
          this.showAddForm = false;
          this.addLogForm.reset({ action_type: 'login', region: 'eu-west', device_type: 'desktop', status_code: 200, response_time_ms: 0 });
          this.page = 1;
          this.loadLogs();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: () => { this.errorMessage = 'Failed to create log'; }
      });
    }
  }

  deleteLog(id: string) {
    if (confirm('Delete this activity log?')) {
      this.webService.deleteActivityLog(id).subscribe({
        next: () => {
          this.selectedLog = null;
          this.loadLogs();
        },
        error: () => { alert('Failed to delete log'); }
      });
    }
  }

  statusClass(code: number): string {
    if (code < 300) return 'success';
    if (code < 500) return 'warning';
    return 'danger';
  }
}
