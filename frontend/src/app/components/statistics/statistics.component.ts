import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { TransactionService } from '../../services/transaction.service';
import { Statistics, CategoryStatistics } from '../../models/transaction.model';
import { Subscription } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="statistics-container">
      <div class="card filter-card">
        <div class="filter-section">
          <div class="form-group">
            <label class="form-label">时间范围</label>
            <select formControlName="timeRange" class="form-control" (change)="onTimeRangeChange()">
              <option value="day">今天</option>
              <option value="week">本周</option>
              <option value="month">本月</option>
              <option value="year">本年</option>
              <option value="custom">自定义</option>
            </select>
          </div>
          
          <div *ngIf="isCustomRange" class="form-group">
            <label class="form-label">开始日期</label>
            <input type="date" formControlName="startDate" class="form-control">
          </div>
          
          <div *ngIf="isCustomRange" class="form-group">
            <label class="form-label">结束日期</label>
            <input type="date" formControlName="endDate" class="form-control">
          </div>
          
          <div class="filter-actions">
            <button type="button" class="btn btn-primary" (click)="loadStatistics()">查询</button>
          </div>
        </div>
      </div>

      <div class="summary-cards">
        <div class="summary-card income-card">
          <div class="summary-icon">📈</div>
          <div class="summary-info">
            <div class="summary-label">总收入</div>
            <div class="summary-amount">¥{{ statistics?.totalIncome || 0 | number:'1.2-2' }}</div>
          </div>
        </div>
        
        <div class="summary-card expense-card">
          <div class="summary-icon">📉</div>
          <div class="summary-info">
            <div class="summary-label">总支出</div>
            <div class="summary-amount">¥{{ statistics?.totalExpense || 0 | number:'1.2-2' }}</div>
          </div>
        </div>
        
        <div class="summary-card balance-card">
          <div class="summary-icon">💰</div>
          <div class="summary-info">
            <div class="summary-label">结余</div>
            <div class="summary-amount" [class.positive]="(statistics?.balance || 0) >= 0">
              {{ (statistics?.balance || 0) >= 0 ? '+' : '' }}¥{{ statistics?.balance || 0 | number:'1.2-2' }}
            </div>
          </div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="card chart-card">
          <div class="card-header">
            <h3 class="card-title">📊 收支对比</h3>
          </div>
          <div class="chart-container">
            <canvas #barChartCanvas></canvas>
          </div>
        </div>

        <div class="card chart-card">
          <div class="card-header">
            <h3 class="card-title">🥧 分类占比</h3>
            <div class="chart-type-toggle">
              <button 
                type="button" 
                class="toggle-btn"
                [class.active]="pieChartType === 'expense'"
                (click)="setPieChartType('expense')"
              >
                支出
              </button>
              <button 
                type="button" 
                class="toggle-btn"
                [class.active]="pieChartType === 'income'"
                (click)="setPieChartType('income')"
              >
                收入
              </button>
            </div>
          </div>
          <div class="chart-container">
            <canvas #pieChartCanvas></canvas>
          </div>
          <div *ngIf="currentCategoryStats.length > 0" class="category-legend">
            <div *ngFor="let item of currentCategoryStats; let i = index" class="legend-item">
              <span class="legend-color" [style.background]="pieChartColors[i]"></span>
              <span class="legend-name">{{ item.category }}</span>
              <span class="legend-amount">¥{{ item.amount | number:'1.2-2' }}</span>
              <span class="legend-percent">{{ item.percentage }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
      </div>
    </div>
  `,
  styles: [`
    .statistics-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .filter-card {
      margin-bottom: 1.5rem;
    }

    .filter-section {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: flex-end;
    }

    .filter-section .form-group {
      margin-bottom: 0;
      min-width: 150px;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .summary-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .income-card {
      background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
      color: white;
    }

    .expense-card {
      background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
      color: white;
    }

    .balance-card {
      background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      color: white;
    }

    .summary-icon {
      font-size: 2.5rem;
    }

    .summary-label {
      font-size: 0.9rem;
      opacity: 0.9;
      margin-bottom: 0.25rem;
    }

    .summary-amount {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .summary-amount.positive {
      color: #d4edda;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .chart-card {
      min-height: 500px;
    }

    .chart-container {
      position: relative;
      height: 300px;
      width: 100%;
    }

    .chart-type-toggle {
      display: flex;
      gap: 0.5rem;
    }

    .toggle-btn {
      padding: 0.5rem 1rem;
      border: 1px solid #ecf0f1;
      background: white;
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .toggle-btn:hover {
      border-color: #3498db;
    }

    .toggle-btn.active {
      background: #3498db;
      color: white;
      border-color: #3498db;
    }

    .category-legend {
      margin-top: 1rem;
      max-height: 200px;
      overflow-y: auto;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid #ecf0f1;
    }

    .legend-item:last-child {
      border-bottom: none;
    }

    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .legend-name {
      flex: 1;
      font-size: 0.9rem;
    }

    .legend-amount {
      font-size: 0.9rem;
      font-weight: 600;
      color: #2c3e50;
    }

    .legend-percent {
      font-size: 0.85rem;
      color: #7f8c8d;
      min-width: 50px;
      text-align: right;
    }

    @media (max-width: 1024px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .summary-cards {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .filter-section {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-section .form-group {
        min-width: auto;
      }
    }
  `]
})
export class StatisticsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('barChartCanvas') barChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChartCanvas') pieChartCanvas!: ElementRef<HTMLCanvasElement>;

  form: FormGroup;
  statistics?: Statistics;
  loading = false;
  pieChartType: 'income' | 'expense' = 'expense';
  currentCategoryStats: CategoryStatistics[] = [];

  private barChart?: Chart;
  private pieChart?: Chart;
  private subscription?: Subscription;
  private chartsInitialized = false;
  private pendingStatistics?: Statistics;

  private colors = [
    '#3498db', '#e74c3c', '#27ae60', '#f39c12', '#9b59b6',
    '#1abc9c', '#e67e22', '#34495e', '#95a5a6', '#d35400',
    '#16a085', '#8e44ad', '#2c3e50', '#f1c40f', '#e91e63'
  ];

  get pieChartColors(): string[] {
    return this.colors.slice(0, this.currentCategoryStats.length);
  }

  get isCustomRange(): boolean {
    return this.form.get('timeRange')?.value === 'custom';
  }

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService
  ) {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    this.form = this.fb.group({
      timeRange: ['month'],
      startDate: [this.formatDate(firstDayOfMonth)],
      endDate: [this.formatDate(today)]
    });
  }

  ngOnInit(): void {
    this.loadStatistics();
  }

  ngAfterViewInit(): void {
    this.chartsInitialized = true;
    this.initCharts();
    
    if (this.pendingStatistics) {
      this.statistics = this.pendingStatistics;
      this.updateCharts();
      this.pendingStatistics = undefined;
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.barChart?.destroy();
    this.pieChart?.destroy();
  }

  onTimeRangeChange(): void {
    const timeRange = this.form.get('timeRange')?.value;
    const now = new Date();

    switch (timeRange) {
      case 'day':
        this.form.patchValue({
          startDate: this.formatDate(now),
          endDate: this.formatDate(now)
        });
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        this.form.patchValue({
          startDate: this.formatDate(weekStart),
          endDate: this.formatDate(now)
        });
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        this.form.patchValue({
          startDate: this.formatDate(monthStart),
          endDate: this.formatDate(now)
        });
        break;
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        this.form.patchValue({
          startDate: this.formatDate(yearStart),
          endDate: this.formatDate(now)
        });
        break;
    }
  }

  loadStatistics(): void {
    this.loading = true;
    const startDate = this.form.get('startDate')?.value;
    const endDate = this.form.get('endDate')?.value;

    let startTime: string | undefined;
    let endTime: string | undefined;

    if (startDate) {
      startTime = startDate + 'T00:00:00';
    }
    if (endDate) {
      endTime = endDate + 'T23:59:59';
    }

    this.subscription = this.transactionService.getStatistics(startTime, endTime).subscribe({
      next: (stats) => {
        this.statistics = stats;
        this.loading = false;
        
        if (this.chartsInitialized) {
          this.updateCharts();
        } else {
          this.pendingStatistics = stats;
        }
      },
      error: () => {
        this.loading = false;
        alert('加载统计数据失败');
      }
    });
  }

  setPieChartType(type: 'income' | 'expense'): void {
    this.pieChartType = type;
    this.updatePieChart();
  }

  private initCharts(): void {
    if (!this.chartsInitialized) return;

    this.initBarChart();
    this.initPieChart();
  }

  private initBarChart(): void {
    if (!this.barChartCanvas) return;

    const ctx = this.barChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: ['暂无数据'],
        datasets: [
          {
            label: '收入',
            data: [0],
            backgroundColor: 'rgba(39, 174, 96, 0.8)',
            borderColor: 'rgba(39, 174, 96, 1)',
            borderWidth: 1
          },
          {
            label: '支出',
            data: [0],
            backgroundColor: 'rgba(231, 76, 60, 0.8)',
            borderColor: 'rgba(231, 76, 60, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y ?? 0;
                return `${context.dataset.label}: ¥${value.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => '¥' + value
            }
          }
        }
      }
    };

    this.barChart = new Chart(ctx, config);
  }

  private initPieChart(): void {
    if (!this.pieChartCanvas) return;

    const ctx = this.pieChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: ['暂无数据'],
        datasets: [{
          data: [1],
          backgroundColor: ['#bdc3c7'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((a, b) => (a as number) + (b as number), 0) as number;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return `${label}: ¥${value.toFixed(2)} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.pieChart = new Chart(ctx, config);
  }

  private updateCharts(): void {
    if (!this.chartsInitialized || !this.statistics) return;

    if (!this.barChart || !this.pieChart) {
      this.initCharts();
    }

    this.updateBarChart();
    this.updatePieChart();
  }

  private updateBarChart(): void {
    if (!this.barChart || !this.statistics) return;

    const dailyStats = this.statistics.dailyStatistics || [];
    
    if (dailyStats.length === 0) {
      this.barChart.data.labels = ['暂无数据'];
      this.barChart.data.datasets[0].data = [0];
      this.barChart.data.datasets[1].data = [0];
    } else {
      const labels = dailyStats.map(d => this.formatDateLabel(d.date));
      const incomeData = dailyStats.map(d => d.income || 0);
      const expenseData = dailyStats.map(d => d.expense || 0);

      this.barChart.data.labels = labels;
      this.barChart.data.datasets[0].data = incomeData;
      this.barChart.data.datasets[1].data = expenseData;
    }

    this.barChart.update();
  }

  private updatePieChart(): void {
    if (!this.pieChart || !this.statistics) return;

    const categoryStats = this.statistics.categoryStatistics || [];
    this.currentCategoryStats = categoryStats.filter(c => c.type === this.pieChartType);

    if (this.currentCategoryStats.length === 0) {
      this.pieChart.data.labels = ['暂无数据'];
      this.pieChart.data.datasets[0].data = [1];
      this.pieChart.data.datasets[0].backgroundColor = ['#bdc3c7'];
    } else {
      const labels = this.currentCategoryStats.map(c => c.category);
      const data = this.currentCategoryStats.map(c => c.amount);
      const colors = this.colors.slice(0, this.currentCategoryStats.length);

      this.pieChart.data.labels = labels;
      this.pieChart.data.datasets[0].data = data;
      this.pieChart.data.datasets[0].backgroundColor = colors;
    }

    this.pieChart.update();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDateLabel(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
    }
    return dateStr;
  }
}
