import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { TransactionService } from '../../services/transaction.service';
import { Transaction } from '../../models/transaction.model';

function amountValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const strValue = String(value);
    if (strValue.includes('.')) {
      const parts = strValue.split('.');
      const integerPart = parts[0];
      const decimalPart = parts[1];
      if (integerPart.length > 9) {
        return { 'amountTooLarge': true };
      }
      if (decimalPart && decimalPart.length > 2) {
        return { 'decimalTooLong': true };
      }
    } else {
      if (strValue.length > 9) {
        return { 'amountTooLarge': true };
      }
    }
    return null;
  };
}

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-container">
      <div class="main-card">
        <div class="form-header">
          <h2 class="card-title">📝 记一笔</h2>
        </div>
        
        <div class="type-segment">
          <button 
            type="button" 
            class="segment-btn" 
            [class.active]="form.get('type')?.value === 'expense'"
            (click)="setType('expense')"
          >
            支出
          </button>
          <button 
            type="button" 
            class="segment-btn" 
            [class.active]="form.get('type')?.value === 'income'"
            (click)="setType('income')"
          >
            收入
          </button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="amount-center">
            <div class="amount-label">金额</div>
            <div class="amount-input-group">
              <span class="currency-symbol">¥</span>
              <input 
                type="number" 
                formControlName="amount" 
                class="amount-input"
                placeholder="0.00"
                step="0.01"
                min="0.01"
                autofocus
              >
            </div>
            <div *ngIf="form.get('amount')?.invalid && form.get('amount')?.touched" class="amount-error">
              <span *ngIf="form.get('amount')?.errors?.['required']">请输入金额</span>
              <span *ngIf="form.get('amount')?.errors?.['min']">金额必须大于0</span>
              <span *ngIf="form.get('amount')?.errors?.['amountTooLarge']">整数部分不能超过9位</span>
              <span *ngIf="form.get('amount')?.errors?.['decimalTooLong']">小数部分不能超过2位</span>
            </div>
          </div>

          <div class="form-section">
            <div class="section-row">
              <div class="form-item">
                <label class="form-label">分类</label>
                <div class="category-grid">
                  <button 
                    type="button" 
                    *ngFor="let cat of categories" 
                    class="category-btn"
                    [class.active]="form.get('category')?.value === cat"
                    (click)="selectCategory(cat)"
                  >
                    <span class="cat-icon">{{ getCategoryIcon(cat) }}</span>
                    <span class="cat-name">{{ cat }}</span>
                  </button>
                </div>
                <div *ngIf="form.get('category')?.invalid && form.get('category')?.touched" class="field-error">
                  请选择分类
                </div>
              </div>
            </div>

            <div class="section-row two-col">
              <div class="form-item">
                <label class="form-label">时间</label>
                <input type="datetime-local" formControlName="transactionTime" class="form-control" [max]="maxDateTime">
              </div>
              <div class="form-item">
                <label class="form-label">账户</label>
                <select formControlName="account" class="form-control">
                  <option value="">请选择</option>
                  <option *ngFor="let acc of accounts" [value]="acc">{{ acc }}</option>
                </select>
              </div>
            </div>

            <div class="section-row">
              <div class="form-item">
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
                  <span class="hint">常用：</span>
                  <button 
                    type="button" 
                    *ngFor="let tag of existingTags" 
                    class="existing-tag-btn"
                    [class.selected]="selectedTags.includes(tag)"
                    (click)="toggleExistingTag(tag)"
                  >
                    {{ tag }}
                  </button>
                </div>
              </div>
            </div>

            <div class="section-row">
              <div class="form-item">
                <label class="form-label">备注 <span class="char-count">{{ remarkLength }}/50</span></label>
                <textarea formControlName="remark" class="form-control" rows="2" placeholder="添加备注..." maxlength="50"></textarea>
                <div *ngIf="form.get('remark')?.invalid && form.get('remark')?.touched" class="field-error">
                  备注不能超过50字
                </div>
              </div>
            </div>
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

      <div class="quick-card">
        <div class="quick-header">
          <h3 class="quick-title">⚡ 快捷录入</h3>
        </div>
        <div class="quick-list">
          <button 
            type="button" 
            *ngFor="let entry of quickEntries" 
            class="quick-item"
            (click)="quickEntry(entry)"
          >
            <span class="quick-icon">{{ entry.icon }}</span>
            <span class="quick-info">
              <span class="quick-name">{{ entry.name }}</span>
              <span class="quick-amount" [class.income]="entry.type === 'income'">
                {{ entry.type === 'income' ? '+' : '-' }}¥{{ entry.amount }}
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 1400px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 1.5rem;
    }

    .main-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      padding: 1.5rem;
    }

    .form-header {
      margin-bottom: 1rem;
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #2c3e50;
      margin: 0;
    }

    .type-segment {
      display: inline-flex;
      background: #f8f9fa;
      border-radius: 8px;
      padding: 4px;
      margin-bottom: 1.5rem;
    }

    .segment-btn {
      padding: 0.5rem 1.5rem;
      border: none;
      background: transparent;
      border-radius: 6px;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #7f8c8d;
    }

    .segment-btn.active {
      background: #3498db;
      color: white;
      box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
    }

    .segment-btn:not(.active):hover {
      color: #3498db;
    }

    .amount-center {
      text-align: center;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, rgba(52, 152, 219, 0.05) 0%, rgba(52, 152, 219, 0.1) 100%);
      border-radius: 12px;
    }

    .amount-label {
      font-size: 0.85rem;
      color: #7f8c8d;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .amount-input-group {
      display: inline-flex;
      align-items: baseline;
      justify-content: center;
    }

    .currency-symbol {
      font-size: 2.5rem;
      font-weight: 600;
      color: #3498db;
      margin-right: 0.25rem;
    }

    .amount-input {
      font-size: 3rem;
      font-weight: 700;
      border: none;
      background: transparent;
      outline: none;
      color: #2c3e50;
      width: 300px;
      text-align: center;
      padding: 0;
    }

    .amount-input::placeholder {
      color: #bdc3c7;
    }

    .amount-error {
      color: #e74c3c;
      font-size: 0.85rem;
      margin-top: 0.5rem;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .section-row {
      display: flex;
      gap: 1rem;
    }

    .section-row.two-col .form-item {
      flex: 1;
    }

    .form-item {
      flex: 1;
    }

    .form-label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      color: #7f8c8d;
      margin-bottom: 0.35rem;
    }

    .form-control {
      width: 100%;
      padding: 0.6rem 0.85rem;
      border: 1.5px solid #ecf0f1;
      border-radius: 8px;
      font-size: 0.95rem;
      transition: all 0.2s ease;
      background: white;
    }

    .form-control:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }

    select.form-control {
      cursor: pointer;
    }

    textarea.form-control {
      resize: vertical;
      min-height: 60px;
    }

    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(85px, 1fr));
      gap: 0.5rem;
    }

    .category-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.75rem 0.5rem;
      border: 1.5px solid #ecf0f1;
      background: white;
      border-radius: 10px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #7f8c8d;
    }

    .category-btn:hover {
      border-color: #3498db;
      background: rgba(52, 152, 219, 0.05);
    }

    .category-btn.active {
      border-color: #3498db;
      background: rgba(52, 152, 219, 0.1);
      color: #3498db;
    }

    .cat-icon {
      font-size: 1.5rem;
      background: #f8f9fa;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .category-btn.active .cat-icon {
      background: rgba(52, 152, 219, 0.15);
    }

    .cat-name {
      font-weight: 500;
    }

    .field-error {
      color: #e74c3c;
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }

    .char-count {
      color: #bdc3c7;
      font-weight: 400;
      margin-left: 0.25rem;
    }

    .tags-input-container {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border: 1.5px solid #ecf0f1;
      border-radius: 8px;
      min-height: 46px;
      transition: all 0.2s ease;
    }

    .tags-input-container:focus-within {
      border-color: #3498db;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }

    .selected-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    .tag-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.6rem;
      background: #3498db;
      color: white;
      border-radius: 16px;
      font-size: 0.8rem;
    }

    .tag-remove {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 1rem;
      padding: 0;
      line-height: 1;
      opacity: 0.8;
    }

    .tag-remove:hover {
      opacity: 1;
    }

    .tag-input {
      flex: 1;
      min-width: 100px;
      border: none;
      outline: none;
      padding: 0.35rem;
      font-size: 0.9rem;
      background: transparent;
    }

    .existing-tags {
      margin-top: 0.5rem;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.35rem;
    }

    .hint {
      font-size: 0.8rem;
      color: #bdc3c7;
    }

    .existing-tag-btn {
      padding: 0.2rem 0.6rem;
      border: 1px solid #ecf0f1;
      background: white;
      border-radius: 12px;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #7f8c8d;
    }

    .existing-tag-btn:hover,
    .existing-tag-btn.selected {
      background: #3498db;
      color: white;
      border-color: #3498db;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #ecf0f1;
    }

    .form-actions .btn {
      flex: 1;
      padding: 0.85rem;
      font-size: 1rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
    }

    .btn-primary {
      background: #3498db;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2980b9;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f8f9fa;
      color: #7f8c8d;
    }

    .btn-secondary:hover {
      background: #ecf0f1;
      color: #2c3e50;
    }

    .success-toast {
      position: fixed;
      top: 80px;
      right: 20px;
      background: #27ae60;
      color: white;
      padding: 0.85rem 1.25rem;
      border-radius: 8px;
      font-weight: 500;
      animation: slideIn 0.3s ease;
      z-index: 1000;
      box-shadow: 0 4px 20px rgba(39, 174, 96, 0.3);
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

    .quick-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      padding: 1.25rem;
      position: sticky;
      top: 1.5rem;
    }

    .quick-header {
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #ecf0f1;
    }

    .quick-title {
      font-size: 1rem;
      font-weight: 600;
      color: #2c3e50;
      margin: 0;
    }

    .quick-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .quick-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border: 1px solid #ecf0f1;
      background: white;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
    }

    .quick-item:hover {
      border-color: #3498db;
      background: rgba(52, 152, 219, 0.03);
      transform: translateX(4px);
    }

    .quick-icon {
      font-size: 1.5rem;
      background: #f8f9fa;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .quick-item:hover .quick-icon {
      background: rgba(52, 152, 219, 0.1);
    }

    .quick-info {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-width: 0;
    }

    .quick-name {
      font-size: 0.9rem;
      font-weight: 500;
      color: #2c3e50;
    }

    .quick-amount {
      font-size: 0.85rem;
      font-weight: 600;
      color: #e74c3c;
    }

    .quick-amount.income {
      color: #27ae60;
    }

    @media (max-width: 1024px) {
      .form-container {
        grid-template-columns: 1fr;
      }

      .quick-card {
        position: static;
      }

      .quick-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
      }
    }

    @media (max-width: 768px) {
      .section-row {
        flex-direction: column;
        gap: 0.75rem;
      }

      .category-grid {
        grid-template-columns: repeat(3, 1fr);
      }

      .amount-input {
        font-size: 2rem;
        width: 200px;
      }

      .currency-symbol {
        font-size: 2rem;
      }

      .quick-list {
        grid-template-columns: 1fr;
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
  maxDateTime: string;

  get remarkLength(): number {
    return this.form.get('remark')?.value?.length || 0;
  }

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
    this.maxDateTime = this.formatDateTime(new Date());
    this.form = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01), amountValidator()]],
      type: ['expense', Validators.required],
      category: ['', Validators.required],
      transactionTime: [this.formatDateTime(new Date())],
      account: [''],
      remark: ['', [Validators.maxLength(50)]]
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
