import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { WebService } from '../../services/web-service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {

  // Stat cards
  totalUsers: number = 0;
  activeAnomalies: number = 0;
  avgResponseTime: number = 0;
  totalApiCalls: number = 0;

  // Recent anomalies (latest 5)
  recentAnomalies: any[] = [];
  errorMessage: string = '';

  // Pie chart — users by tier
  pieChartData: ChartData<'pie'> = {
    labels: ['Free', 'Pro', 'Enterprise'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#0d6efd', '#198754', '#ffc107']
    }]
  };
  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };

  // Bar chart — anomalies by severity
  barChartData: ChartData<'bar'> = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [{
      label: 'Count',
      data: [0, 0, 0, 0],
      backgroundColor: ['#dc3545', '#fd7e14', '#ffc107', '#0dcaf0']
    }]
  };
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
  };

  constructor(private webService: WebService) { }

  ngOnInit() {
    this.loadSummary();
    this.loadAnomalies();
    this.loadActivity();
    this.loadTierChart();
  }

  loadSummary() {
    this.webService.getDashboardSummary().subscribe(
      (data) => {
        this.totalUsers = data.total_users;
        this.activeAnomalies = data.open_anomalies;
      },
      () => { this.errorMessage = 'Failed to load dashboard summary'; }
    );
  }

  loadTierChart() {
    this.webService.getAvgApiCallsByTier().subscribe(
      (data: any[]) => {
        const labels = data.map((d: any) => (d.tier || d._id || '').toUpperCase());
        const values = data.map((d: any) => Math.round(d.avg_api_calls ?? 0));
        this.pieChartData = {
          labels,
          datasets: [{
            data: values,
            backgroundColor: ['#0d6efd', '#198754', '#ffc107']
          }]
        };
      },
      () => {}
    );
  }

  loadAnomalies() {
    this.webService.getAnomalyFlags(1, 100).subscribe(
      (response) => {
        const flags = response.flags;
        this.recentAnomalies = flags.slice(0, 5);
        this.buildSeverityChart(flags);
      },
      (error) => {
        this.errorMessage = 'Failed to load anomalies';
      }
    );
  }

  loadActivity() {
    this.webService.getActivityLogs(1, 50).subscribe(
      (response) => {
        this.totalApiCalls = response.total;
        const logs = response.logs;
        if (logs.length > 0) {
          let sum = 0;
          for (let log of logs) {
            sum = sum + (log.performance?.response_time_ms || 0);
          }
          this.avgResponseTime = Math.round(sum / logs.length);
        }
      },
      () => {}
    );
  }

  buildSeverityChart(flags: any[]) {
    const sev: any = { critical: 0, high: 0, medium: 0, low: 0 };
    for (let a of flags) {
      const s = (a.severity || 'low').toLowerCase();
      if (sev[s] !== undefined) {
        sev[s]++;
      }
    }
    this.barChartData = {
      labels: ['Critical', 'High', 'Medium', 'Low'],
      datasets: [{
        label: 'Count',
        data: [sev.critical, sev.high, sev.medium, sev.low],
        backgroundColor: ['#dc3545', '#fd7e14', '#ffc107', '#0dcaf0']
      }]
    };
  }

  quickResolve(id: string) {
    const note = prompt('Resolution note:');
    if (note) {
      this.webService.resolveAnomaly(id, note).subscribe(
        () => {
          this.loadAnomalies();
        },
        (error) => {
          alert('Failed to resolve anomaly');
        }
      );
    }
  }

}