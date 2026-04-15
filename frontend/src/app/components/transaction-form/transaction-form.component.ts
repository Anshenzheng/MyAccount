import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TransactionService } from '../../services/transaction.service';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-container">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">📝 记一笔</h2>
        </div>
        
        <div class="type-toggle">
          <button 
            type="button" 
            class="type-btn" 
            [class.active]="form.get('type')?.value === 'expense'"
            (click)="setType('expense')"
          >
            支出
          </button>
          <button 
            type="button" 
            class="type-btn" 
            [class.active]="form.get('type')?.value === 'income'"
            (click)="setType('income')"
          >
            收入
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="amount-section">
            <span class="currency-symbol">¥</span>
            <input 
              type="number" 
              formControlName="amount" 
              class="amount-input"
              placeholder="0.00"
              step="0.01"
              min="0.01"
            >
          </div>
          <div *ngIf="form.get('amount')?.invalid && form.get('amount')?.touched" class="error-message">
            请输入有效金额
          </div>

          <div class="quick-categories">
            <div class="section-label">快捷分类</div>
            <div class="category-grid">
              <button 
                type="button" 
                *ngFor="let cat of categories" 
                class="category-btn"
                [class.active]="form.get('category')?.value === cat"
                (click)="selectCategory(cat)"
              >
                {{ getCategoryIcon(cat) }} {{ cat }}
              </button>
            </div>
          </div>
          <div *ngIf="form.get('category')?.invalid && form.get('category')?.touched" class="error-message">
            请选择分类
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">时间</label>
              <input type="datetime-local" formControlName="transactionTime" class="form-control">
            </div>
            <div class="form-group">
              <label class="form-label">账户</label>
              <select formControlName="account" class="form-control">
                <option value="">请选择账户</option>
                <option *ngFor="let acc of accounts" [value]="acc">{{ acc }}</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">标签</label>
            <div class="tags-input-container">
              <div class="selected-tags">
                <span *ngFor="let tag of selectedTags" class="tag-badge">
                  {{ tag }}
                  <button type="button" class="tag-remove" (click)="removeTag(tag)">&times;</button>
                </span>
              </div>
              <input 
                type="text" 
                #tagInput
                [formControl]="tagControl"
                class="form-control tag-input"
                placeholder="输入标签后按回车添加"
                (keyup.enter)="addTag(tagInput)"
              >
            </div>
            <div *ngIf="existingTags.length > 0" class="existing-tags">
              <span class="hint">常用标签：</span>
              <button 
                type="button" 
                *ngFor="let tag of existingTags" 
                class="existing-tag-btn"
                (click)="toggleExistingTag(tag)"
              >
                {{ tag }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea formControlName="remark" class="form-control" rows="2" placeholder="添加备注..."></textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="resetForm()">重置</button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading">
              {{ loading ? '保存中...' : '保存' }}
            </button>
          </div>
        </form>

        <div *ngIf="showSuccess" class="success-toast">
          ✅ 保存成功！
        </div>
      </div>

      <div class="card quick-entries-card">
        <div class="card-header">
          <h2 class="card-title">⚡ 快捷录入</h2>
        </div>
        <div class="quick-entries">
          <button 
            type="button" 
            *ngFor="let entry of quickEntries" 
            class="quick-entry-btn"
            (click)="quickEntry(entry)"
          >
            <span class="quick-entry-icon">{{ entry.icon }}</span>
            <span class="quick-entry-name">{{ entry.name }}</span>
            <span class="quick-entry-amount">{{ entry.type === 'income' ? '+' : '-' }}¥{{ entry.amount }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 600px;
      margin: 0 auto;
    }

    .type-toggle {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .type-btn {
      flex: 1;
      padding: 1rem;
      border: 2px solid #ecf0f1;
      background: white;
      border-radius: 12px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .type-btn.active {
      border-color: #3498db;
      background: #3498db;
      color: white;
    }

    .type-btn:hover:not(.active) {
      border-color: #bdc3c7;
    }

    .amount-section {
      display: flex;
      align-items: center;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 12px;
    }

    .currency-symbol {
      font-size: 2rem;
      font-weight: 600;
      color: #3498db;
      margin-right: 0.5rem;
    }

    .amount-input {
      flex: 1;
      font-size: 2rem;
      font-weight: 600;
      border: none;
      background: transparent;
      outline: none;
      color: #2c3e50;
    }

    .amount-input::placeholder {
      color: #bdc3c7;
    }

    .quick-categories {
      margin-bottom: 1.5rem;
    }

    .section-label {
      font-weight: 600;
      color: #34495e;
      margin-bottom: 0.75rem;
    }

    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 0.75rem;
    }

    .category-btn {
      padding: 0.75rem;
      border: 2px solid #ecf0f1;
      background: white;
      border-radius: 10px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }

    .category-btn:hover {
      border-color: #3498db;
      background: #ebf5fb;
    }

    .category-btn.active {
      border-color: #3498db;
      background: #3498db;
      color: white;
    }

    .tags-input-container {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border: 2px solid #ecf0f1;
      border-radius: 8px;
      min-height: 50px;
    }

    .tags-input-container:focus-within {
      border-color: #3498db;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }

    .selected-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .tag-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.75rem;
      background: #3498db;
      color: white;
      border-radius: 20px;
      font-size: 0.85rem;
    }

    .tag-remove {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 1rem;
      padding: 0;
      line-height: 1;
    }

    .tag-input {
      flex: 1;
      min-width: 100px;
      border: none;
      outline: none;
      padding: 0.5rem;
      font-size: 0.95rem;
    }

    .existing-tags {
      margin-top: 0.5rem;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
    }

    .hint {
      font-size: 0.85rem;
      color: #7f8c8d;
    }

    .existing-tag-btn {
      padding: 0.25rem 0.75rem;
      border: 1px solid #bdc3c7;
      background: white;
      border-radius: 15px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .existing-tag-btn:hover {
      background: #3498db;
      color: white;
      border-color: #3498db;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .form-actions .btn {
      flex: 1;
    }

    .error-message {
      color: #e74c3c;
      font-size: 0.85rem;
      margin-top: 0.25rem;
    }

    .success-toast {
      position: fixed;
      top: 100px;
      right: 20px;
      background: #27ae60;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      font-weight: 500;
      animation: slideIn 0.3s ease;
      z-index: 1000;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .quick-entries-card {
      margin-top: 1.5rem;
    }

    .quick-entries {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 0.75rem;
    }

    .quick-entry-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 1rem;
      border: 2px solid #ecf0f1;
      background: white;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .quick-entry-btn:hover {
      border-color: #3498db;
      background: #ebf5fb;
      transform: translateY(-2px);
    }

    .quick-entry-icon {
      font-size: 1.5rem;
    }

    .quick-entry-name {
      font-size: 0.9rem;
      color: #34495e;
    }

    .quick-entry-amount {
      font-size: 0.85rem;
      font-weight: 600;
    }

    .quick-entry-amount:not([class*="income"]) {
      color: #e74c3c;
    }

    .quick-entry-amount[class*="income"],
    .quick-entry-btn .quick-entry-amount:first-child {
      color: #27ae60;
    }

    @media (max-width: 768px) {
      .category-grid {
        grid-template-columns: repeat(3, 1fr);
      }

      .quick-entries {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class TransactionFormComponent implements OnInit {
  form: FormGroup;
  tagControl = this.fb.control('');
  categories: string[] = [];
  accounts: string[] = [];
  existingTags: string[] = [];
  selectedTags: string[] = [];
  loading = false;
  showSuccess = false;

  quickEntries = [
    { name: '早餐', amount: 10, type: 'expense' as const, category: '餐饮', icon: '🍳' },
    { name: '午餐', amount: 25, type: 'expense' as const, category: '餐饮', icon: '🍱' },
    { name: '晚餐', amount: 30, type: 'expense' as const, category: '餐饮', icon: '🍽️' },
    { name: '交通', amount: 10, type: 'expense' as const, category: '交通', icon: '🚗' },
    { name: '工资', amount: 10000, type: 'income' as const, category: '工资', icon: '💰' },
    { name: '奖金', amount: 5000, type: 'income' as const, category: '奖金', icon: '🎁' },
  ];

  private categoryIcons: Record<string, string> = {
    '餐饮': '🍽️', '交通': '🚗', '购物': '🛒', '娱乐': '🎮',
    '医疗': '💊', '教育': '📚', '住房': '🏠', '其他支出': '📝',
    '工资': '💰', '奖金': '🎁', '投资收益': '📈', '兼职收入': '💼', '其他收入': '💵'
  };

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService
  ) {
    this.form = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      type: ['expense', Validators.required],
      category: ['', Validators.required],
      transactionTime: [this.formatDateTime(new Date())],
      account: [''],
      remark: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadAccounts();
    this.loadExistingTags();

    this.form.get('type')?.valueChanges.subscribe(() => {
      this.form.get('category')?.setValue('');
      this.loadCategories();
    });
  }

  private loadCategories(): void {
    const type = this.form.get('type')?.value || 'expense';
    this.transactionService.getDefaultCategories(type).subscribe({
      next: (cats) => this.categories = cats,
      error: () => {
        this.categories = type === 'income' 
          ? ['工资', '奖金', '投资收益', '兼职收入', '其他收入']
          : ['餐饮', '交通', '购物', '娱乐', '医疗', '教育', '住房', '其他支出'];
      }
    });
  }

  private loadAccounts(): void {
    this.transactionService.getAccounts().subscribe({
      next: (accs) => this.accounts = accs,
      error: () => {
        this.accounts = ['支付宝', '微信', '银行卡', '现金', '信用卡'];
      }
    });
  }

  private loadExistingTags(): void {
    this.transactionService.getAllTags().subscribe({
      next: (tags) => {
        const allTags = tags.flatMap(t => t.split(',').map(s => s.trim()).filter(s => s));
        this.existingTags = [...new Set(allTags)].slice(0, 10);
      }
    });
  }

  setType(type: 'income' | 'expense'): void {
    this.form.get('type')?.setValue(type);
  }

  selectCategory(category: string): void {
    this.form.get('category')?.setValue(category);
  }

  getCategoryIcon(category: string): string {
    return this.categoryIcons[category] || '📝';
  }

  addTag(input: HTMLInputElement): void {
    const tag = this.tagControl.value?.trim();
    if (tag && !this.selectedTags.includes(tag)) {
      this.selectedTags.push(tag);
      this.tagControl.setValue('');
      input.value = '';
    }
  }

  removeTag(tag: string): void {
    this.selectedTags = this.selectedTags.filter(t => t !== tag);
  }

  toggleExistingTag(tag: string): void {
    if (this.selectedTags.includes(tag)) {
      this.removeTag(tag);
    } else {
      if (!this.selectedTags.includes(tag)) {
        this.selectedTags.push(tag);
      }
    }
  }

  quickEntry(entry: { name: string; amount: number; type: 'income' | 'expense'; category: string; icon: string }): void {
    this.form.patchValue({
      amount: entry.amount,
      type: entry.type,
      category: entry.category
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    const transaction: Transaction = {
      ...this.form.value,
      tags: this.selectedTags.join(',')
    };

    this.transactionService.createTransaction(transaction).subscribe({
      next: () => {
        this.loading = false;
        this.showSuccess = true;
        setTimeout(() => this.showSuccess = false, 2000);
        this.resetForm();
        this.loadExistingTags();
      },
      error: () => {
        this.loading = false;
        alert('保存失败，请重试');
      }
    });
  }

  resetForm(): void {
    this.form.reset({
      amount: null,
      type: 'expense',
      category: '',
      transactionTime: this.formatDateTime(new Date()),
      account: '',
      remark: ''
    });
    this.selectedTags = [];
    this.tagControl.setValue('');
  }

  private formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
