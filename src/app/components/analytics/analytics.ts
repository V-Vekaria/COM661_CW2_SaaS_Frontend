import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, Chart, registerables } from 'chart.js';
import { WebService } from '../../services/web-service';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css',
})
export class Analytics implements OnInit {

  errorMessage: string = '';
  avgApiCalls: number = 0;
  highUsageUsers: any[] = [];
  failedLogins: any[] = [];
  riskReport: any[] = [];

  tierChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  tierChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } }
  };

  anomalyChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  anomalyChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false
  };

  opsChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  opsChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { x: { stacked: true }, y: { stacked: true } }
  };

  constructor(private webService: WebService) {}

  ngOnInit() {
    this.loadTierData();
    this.loadHighUsage();
    this.loadFailedLogins();
    this.loadAnomalySummary();
    this.loadRiskReport();
    this.loadOpsBreakdown();
  }

  loadTierData() {
    this.webService.getAvgApiCallsByTier().subscribe({
      next: (data: any[]) => {
        const labels = data.map((d: any) => d._id || d.tier);
        const avgCalls = data.map((d: any) => Math.round(d.avg_api_calls ?? d.avgApiCalls ?? 0));
        const total = avgCalls.reduce((a: number, b: number) => a + b, 0);
        this.avgApiCalls = avgCalls.length ? Math.round(total / avgCalls.length) : 0;

        this.tierChartData = {
          labels,
          datasets: [{
            data: avgCalls,
            label: 'Avg API Calls',
            backgroundColor: ['#0d6efd', '#ffc107', '#198754', '#dc3545']
          }]
        };
      },
      error: () => { this.errorMessage = 'Failed to load tier analytics'; }
    });
  }

  loadOpsBreakdown() {
    this.webService.getOpsBreakdown().subscribe({
      next: (data: any[]) => {
        const labels = data.map((d: any) => (d.tier || d._id || '').toUpperCase());
        this.opsChartData = {
          labels,
          datasets: [
            {
              data: data.map((d: any) => d.total_reads ?? 0),
              label: 'Read Ops',
              backgroundColor: '#0d6efd'
            },
            {
              data: data.map((d: any) => d.total_writes ?? 0),
              label: 'Write Ops',
              backgroundColor: '#198754'
            },
            {
              data: data.map((d: any) => Math.max(0, (d.total_calls ?? 0) - (d.total_reads ?? 0) - (d.total_writes ?? 0))),
              label: 'Other Ops',
              backgroundColor: '#dc3545'
            }
          ]
        };
      },
      error: () => {}
    });
  }

  loadHighUsage() {
    this.webService.getHighUsage().subscribe({
      next: (data: any) => { this.highUsageUsers = data.results || data; },
      error: () => {}
    });
  }

  loadFailedLogins() {
    this.webService.getFailedLogins().subscribe({
      next: (data: any) => { this.failedLogins = data.flagged_users || data; },
      error: () => {}
    });
  }

  loadAnomalySummary() {
    this.webService.getAnomalySummary().subscribe({
      next: (data: any) => {
        const isArray = Array.isArray(data);
        const get = (key: string) => isArray
          ? (data.find((d: any) => (d.severity ?? d._id) === key)?.count ?? 0)
          : (data[key] ?? 0);

        this.anomalyChartData = {
          labels: ['Low', 'Medium', 'High', 'Critical'],
          datasets: [{
            data: [get('low'), get('medium'), get('high'), get('critical')],
            backgroundColor: ['#198754', '#ffc107', '#fd7e14', '#dc3545']
          }]
        };
      },
      error: () => {}
    });
  }

  loadRiskReport() {
    this.webService.getUserRiskReport().subscribe({
      next: (data: any[]) => { this.riskReport = data; },
      error: () => {}
    });
  }
}
