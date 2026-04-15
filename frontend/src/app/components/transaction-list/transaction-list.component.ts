import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TransactionService } from '../../services/transaction.service';
import { Transaction, Page } from '../../models/transaction.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="list-container">
      <div class="card filter-card">
        <div class="card-header">
          <h3 class="card-title">🔍 筛选条件</h3>
          <button type="button" class="btn btn-sm btn-outline" (click)="toggleFilter()">
            {{ showFilter ? '收起' : '展开' }}
          </button>
        </div>
        
        <div *ngIf="showFilter" class="filter-section">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">开始日期</label>
              <input type="date" formControlName="startDate" class="form-control">
            </div>
            <div class="form-group">
              <label class="form-label">结束日期</label>
              <input type="date" formControlName="endDate" class="form-control">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">收支类型</label>
              <select formControlName="type" class="form-control">
                <option value="">全部</option>
                <option value="income">收入</option>
                <option value="expense">支出</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">标签</label>
              <input type="text" formControlName="tags" class="form-control" placeholder="输入标签搜索">
            </div>
          </div>
          
          <div class="filter-actions">
            <button type="button" class="btn btn-secondary" (click)="resetFilter()">重置</button>
            <button type="button" class="btn btn-primary" (click)="applyFilter()">查询</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📋 收支明细</h3>
          <span class="record-count">共 {{ page?.totalElements || 0 }} 条记录</span>
        </div>

        <div *ngIf="loading" class="loading">
          <div class="spinner"></div>
        </div>

        <div *ngIf="!loading && (!transactions || transactions.length === 0)" class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-text">暂无记录</div>
          <p style="margin-top: 0.5rem; color: #7f8c8d;">去记一笔开始你的记账之旅吧</p>
        </div>

        <div *ngIf="!loading && transactions && transactions.length > 0" class="transaction-list">
          <div *ngFor="let transaction of transactions" class="transaction-item">
            <div class="transaction-icon" [class.income]="transaction.type === 'income'">
              {{ getCategoryIcon(transaction.category, transaction.type) }}
            </div>
            
            <div class="transaction-info">
              <div class="transaction-category">{{ transaction.category }}</div>
              <div class="transaction-meta">
                <span class="transaction-time">{{ formatDateTime(transaction.transactionTime) }}</span>
                <span *ngIf="transaction.account" class="transaction-account">{{ transaction.account }}</span>
                <span *ngIf="transaction.tags" class="transaction-tags">
                  <span *ngFor="let tag of transaction.tags.split(',')" class="tag-badge-small">
                    {{ tag.trim() }}
                  </span>
                </span>
              </div>
              <div *ngIf="transaction.remark" class="transaction-remark">
                {{ transaction.remark }}
              </div>
            </div>
            
            <div class="transaction-amount">
              <span [class.text-income]="transaction.type === 'income'" 
                    [class.text-expense]="transaction.type === 'expense'">
                {{ transaction.type === 'income' ? '+' : '-' }}¥{{ transaction.amount | number:'1.2-2' }}
              </span>
            </div>
            
            <div class="transaction-actions">
              <button type="button" class="btn btn-sm btn-secondary" (click)="editTransaction(transaction)">
                编辑
              </button>
              <button type="button" class="btn btn-sm btn-danger" (click)="deleteTransaction(transaction)">
                删除
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="page && page.totalPages > 1" class="pagination">
          <button type="button" (click)="goToPage(0)" [disabled]="page.first">首页</button>
          <button type="button" (click)="goToPage(page.number - 1)" [disabled]="page.first">上一页</button>
          
          <span class="page-info">
            第 {{ page.number + 1 }} / {{ page.totalPages }} 页
          </span>
          
          <button type="button" (click)="goToPage(page.number + 1)" [disabled]="page.last">下一页</button>
          <button type="button" (click)="goToPage(page.totalPages - 1)" [disabled]="page.last">末页</button>
        </div>
      </div>

      <div *ngIf="showEditModal" class="modal-overlay" (click)="closeEditModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>编辑记录</h3>
            <button type="button" class="modal-close" (click)="closeEditModal()">&times;</button>
          </div>
          
          <form [formGroup]="editForm" (ngSubmit)="saveEdit()">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">类型</label>
                <select formControlName="type" class="form-control">
                  <option value="income">收入</option>
                  <option value="expense">支出</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">金额</label>
                <input type="number" formControlName="amount" class="form-control" step="0.01" min="0.01">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">分类</label>
                <input type="text" formControlName="category" class="form-control">
              </div>
              <div class="form-group">
                <label class="form-label">账户</label>
                <select formControlName="account" class="form-control">
                  <option value="">请选择</option>
                  <option *ngFor="let acc of accounts" [value]="acc">{{ acc }}</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">时间</label>
              <input type="datetime-local" formControlName="transactionTime" class="form-control">
            </div>
            
            <div class="form-group">
              <label class="form-label">标签</label>
              <input type="text" formControlName="tags" class="form-control" placeholder="多个标签用逗号分隔">
            </div>
            
            <div class="form-group">
              <label class="form-label">备注</label>
              <textarea formControlName="remark" class="form-control" rows="2"></textarea>
            </div>
            
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" (click)="closeEditModal()">取消</button>
              <button type="submit" class="btn btn-primary" [disabled]="editForm.invalid || saving">
                {{ saving ? '保存中...' : '保存' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div *ngIf="showDeleteConfirm" class="modal-overlay" (click)="closeDeleteConfirm()">
        <div class="modal modal-small" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>确认删除</h3>
          </div>
          <div class="modal-body">
            <p>确定要删除这条记录吗？此操作不可撤销。</p>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" (click)="closeDeleteConfirm()">取消</button>
            <button type="button" class="btn btn-danger" (click)="confirmDelete()" [disabled]="deleting">
              {{ deleting ? '删除中...' : '删除' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .list-container {
      max-width: 1000px;
      margin: 0 auto;
    }

    .filter-card {
      margin-bottom: 1.5rem;
    }

    .record-count {
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .transaction-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .transaction-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 10px;
      transition: all 0.3s ease;
    }

    .transaction-item:hover {
      background: #ebf5fb;
    }

    .transaction-icon {
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e74c3c;
      border-radius: 50%;
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .transaction-icon.income {
      background: #27ae60;
    }

    .transaction-info {
      flex: 1;
      min-width: 0;
    }

    .transaction-category {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 0.25rem;
    }

    .transaction-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
      font-size: 0.85rem;
      color: #7f8c8d;
    }

    .transaction-time,
    .transaction-account {
      display: inline-flex;
      align-items: center;
    }

    .transaction-account::before {
      content: '·';
      margin: 0 0.5rem;
    }

    .transaction-tags {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin-left: 0.5rem;
    }

    .tag-badge-small {
      padding: 0.125rem 0.5rem;
      background: #3498db;
      color: white;
      border-radius: 10px;
      font-size: 0.75rem;
    }

    .transaction-remark {
      font-size: 0.85rem;
      color: #7f8c8d;
      margin-top: 0.25rem;
      font-style: italic;
    }

    .transaction-amount {
      font-size: 1.1rem;
      font-weight: 600;
      min-width: 120px;
      text-align: right;
    }

    .transaction-actions {
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal {
      background: white;
      border-radius: 12px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .modal-small {
      max-width: 400px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #ecf0f1;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #7f8c8d;
      padding: 0;
      line-height: 1;
    }

    .modal-close:hover {
      color: #2c3e50;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-body p {
      margin: 0;
      color: #34495e;
      line-height: 1.6;
    }

    .modal-actions {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #ecf0f1;
    }

    .modal-actions .btn {
      flex: 1;
    }

    form {
      padding: 1.5rem;
    }

    @media (max-width: 768px) {
      .transaction-item {
        flex-wrap: wrap;
      }

      .transaction-info {
        flex: 1 1 100%;
        order: 2;
        margin-top: 0.5rem;
      }

      .transaction-amount {
        order: 1;
        min-width: auto;
      }

      .transaction-actions {
        order: 3;
        width: 100%;
        justify-content: flex-end;
        margin-top: 0.5rem;
      }

      .form-row {
        flex-direction: column;
        gap: 0;
      }
    }
  `]
})
export class TransactionListComponent implements OnInit, OnDestroy {
  transactions: Transaction[] = [];
  page?: Page<Transaction>;
  loading = false;
  showFilter = true;
  accounts: string[] = ['支付宝', '微信', '银行卡', '现金', '信用卡'];

  filterForm: FormGroup;
  editForm: FormGroup;
  showEditModal = false;
  showDeleteConfirm = false;
  editingTransaction?: Transaction;
  deletingTransaction?: Transaction;
  saving = false;
  deleting = false;

  private subscription?: Subscription;
  private pageSize = 20;

  private categoryIcons: Record<string, string> = {
    '餐饮': '🍽️', '交通': '🚗', '购物': '🛒', '娱乐': '🎮',
    '医疗': '💊', '教育': '📚', '住房': '🏠', '其他支出': '📝',
    '工资': '💰', '奖金': '🎁', '投资收益': '📈', '兼职收入': '💼', '其他收入': '💵'
  };

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService
  ) {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    this.filterForm = this.fb.group({
      startDate: [this.formatDate(firstDayOfMonth)],
      endDate: [this.formatDate(today)],
      type: [''],
      tags: ['']
    });

    this.editForm = this.fb.group({
      amount: [null, []],
      type: ['expense'],
      category: [''],
      transactionTime: [''],
      account: [''],
      tags: [''],
      remark: ['']
    });
  }

  ngOnInit(): void {
    this.loadTransactions();
    this.loadAccounts();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  toggleFilter(): void {
    this.showFilter = !this.showFilter;
  }

  applyFilter(): void {
    this.loadTransactions(0);
  }

  resetFilter(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    this.filterForm.reset({
      startDate: this.formatDate(firstDayOfMonth),
      endDate: this.formatDate(today),
      type: '',
      tags: ''
    });
    this.loadTransactions(0);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < (this.page?.totalPages || 0)) {
      this.loadTransactions(page);
    }
  }

  private loadTransactions(page: number = 0): void {
    this.loading = true;

    const startDate = this.filterForm.get('startDate')?.value;
    const endDate = this.filterForm.get('endDate')?.value;
    const type = this.filterForm.get('type')?.value;
    const tags = this.filterForm.get('tags')?.value;

    let startTime: string | undefined;
    let endTime: string | undefined;

    if (startDate) {
      startTime = startDate + 'T00:00:00';
    }
    if (endDate) {
      endTime = endDate + 'T23:59:59';
    }

    this.subscription = this.transactionService.getTransactions(
      page, this.pageSize, startTime, endTime, type || undefined, tags || undefined
    ).subscribe({
      next: (result) => {
        this.page = result;
        this.transactions = result.content;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('加载数据失败');
      }
    });
  }

  private loadAccounts(): void {
    this.transactionService.getAccounts().subscribe({
      next: (accs) => this.accounts = accs
    });
  }

  editTransaction(transaction: Transaction): void {
    this.editingTransaction = transaction;
    this.editForm.patchValue({
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      transactionTime: this.formatDateTimeLocal(transaction.transactionTime),
      account: transaction.account || '',
      tags: transaction.tags || '',
      remark: transaction.remark || ''
    });
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingTransaction = undefined;
    this.editForm.reset();
  }

  saveEdit(): void {
    if (!this.editingTransaction || this.editForm.invalid) return;

    this.saving = true;
    const updatedTransaction: Transaction = {
      ...this.editingTransaction,
      ...this.editForm.value
    };

    this.transactionService.updateTransaction(this.editingTransaction.id!, updatedTransaction).subscribe({
      next: () => {
        this.saving = false;
        this.closeEditModal();
        this.loadTransactions(this.page?.number || 0);
      },
      error: () => {
        this.saving = false;
        alert('保存失败');
      }
    });
  }

  deleteTransaction(transaction: Transaction): void {
    this.deletingTransaction = transaction;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.deletingTransaction = undefined;
  }

  confirmDelete(): void {
    if (!this.deletingTransaction) return;

    this.deleting = true;
    this.transactionService.deleteTransaction(this.deletingTransaction.id!).subscribe({
      next: () => {
        this.deleting = false;
        this.closeDeleteConfirm();
        this.loadTransactions(this.page?.number || 0);
      },
      error: () => {
        this.deleting = false;
        alert('删除失败');
      }
    });
  }

  getCategoryIcon(category: string, type: string): string {
    return this.categoryIcons[category] || (type === 'income' ? '💰' : '📝');
  }

  formatDateTime(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDateTimeLocal(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
