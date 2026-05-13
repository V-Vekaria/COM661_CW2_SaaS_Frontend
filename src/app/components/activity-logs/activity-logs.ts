import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebService } from '../../services/web-service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-activity-logs',
  imports: [CommonModule, FormsModule],
  templateUrl: './activity-logs.html',
  styleUrl: './activity-logs.css'
})
export class ActivityLogs {

  logs: any[] = [];
  total: number = 0;
  page: number = 1;
  pageSize: number = 15;
  errorMessage: string = '';

  // filters
  filterAction: string = '';
  filterRegion: string = '';
  filterStatus: string = '';

  // detail view
  selectedLog: any = null;

  constructor(
    private webService: WebService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.errorMessage = '';
    let url = '/activity-logs?pn=' + this.page + '&ps=' + this.pageSize;
    if (this.filterAction) url += '&action_type=' + this.filterAction;
    if (this.filterRegion) url += '&region=' + this.filterRegion;
    if (this.filterStatus) url += '&status_code=' + this.filterStatus;

    this.webService.getActivityLogsFiltered(url).subscribe({
      next: (data) => {
        this.logs = data.logs || [];
        this.total = data.total || 0;
      },
      error: () => { this.errorMessage = 'Failed to load activity logs'; }
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
