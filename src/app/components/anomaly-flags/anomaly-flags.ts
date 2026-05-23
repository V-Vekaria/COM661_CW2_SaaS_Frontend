import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebService } from '../../services/web-service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-anomaly-flags',
  imports: [CommonModule, FormsModule],
  templateUrl: './anomaly-flags.html',
  styleUrl: './anomaly-flags.css'
})
export class AnomalyFlags {

  flags: any[] = [];
  total: number = 0;
  page: number = 1;
  pageSize: number = 10;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // filters
  filterSeverity: string = '';
  filterCategory: string = '';
  filterResolved: string = '';

  // resolve modal state
  resolvingFlag: any = null;
  resolveNote: string = '';
  resolveError: string = '';

  // detail expand
  expandedId: string = '';

  constructor(
    private webService: WebService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.loadFlags();
  }

  loadFlags() {
    this.isLoading = true;
    this.errorMessage = '';
    let url = '/anomaly-flags?pn=' + this.page + '&ps=' + this.pageSize;
    if (this.filterSeverity) url += '&severity=' + this.filterSeverity;
    if (this.filterCategory) url += '&category=' + this.filterCategory;
    if (this.filterResolved !== '') url += '&resolved=' + this.filterResolved;

    this.webService.getAnomalyFlagsFiltered(url).subscribe({
      next: (data) => {
        this.flags = data.flags || [];
        this.total = data.total || 0;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load anomaly flags';
        this.isLoading = false;
      }
    });
  }

  applyFilters() { this.page = 1; this.loadFlags(); }

  clearFilters() {
    this.filterSeverity = '';
    this.filterCategory = '';
    this.filterResolved = '';
    this.page = 1;
    this.loadFlags();
  }

  totalPages() { return Math.ceil(this.total / this.pageSize); }
  nextPage() { if (this.page < this.totalPages()) { this.page++; this.loadFlags(); } }
  prevPage() { if (this.page > 1) { this.page--; this.loadFlags(); } }

  toggleExpand(id: string) {
    this.expandedId = this.expandedId === id ? '' : id;
  }

  openResolve(flag: any) {
    this.resolvingFlag = flag;
    this.resolveNote = '';
    this.resolveError = '';
  }

  closeResolve() {
    this.resolvingFlag = null;
    this.resolveNote = '';
    this.resolveError = '';
  }

  submitResolve() {
    if (!this.resolveNote.trim()) {
      this.resolveError = 'Note is required';
      return;
    }
    this.webService.resolveAnomaly(this.resolvingFlag._id, this.resolveNote).subscribe({
      next: () => {
        this.successMessage = 'Anomaly resolved successfully';
        this.closeResolve();
        this.loadFlags();
        setTimeout(() => { this.successMessage = ''; }, 3000);
      },
      error: () => { this.resolveError = 'Failed to resolve anomaly'; }
    });
  }

  deleteFlag(id: string) {
    if (confirm('Delete this anomaly flag?')) {
      this.webService.deleteAnomalyFlag(id).subscribe({
        next: () => { this.loadFlags(); },
        error: () => { alert('Failed to delete flag'); }
      });
    }
  }

  deleteResolution(flagId: string, resId: string) {
    if (confirm('Remove this resolution log?')) {
      this.webService.deleteResolutionLog(flagId, resId).subscribe({
        next: () => { this.loadFlags(); },
        error: () => { alert('Failed to delete resolution'); }
      });
    }
  }

  severityClass(s: string): string {
    const map: any = { critical: 'danger', high: 'warning', medium: 'info', low: 'secondary' };
    return map[s?.toLowerCase()] || 'secondary';
  }

  scoreBar(score: number): number { return Math.round((score || 0) * 100); }

  scoreColor(score: number): string {
    if (score >= 0.8) return 'danger';
    if (score >= 0.5) return 'warning';
    return 'success';
  }
}
