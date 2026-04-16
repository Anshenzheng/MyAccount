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
      <div class="search-bar">
        <div class="quick-filters">
          <button 
            type="button" 
            class="quick-btn" 
            [class.active]="activeQuickFilter === 'day'"
            (click)="setQuickFilter('day')"
          >
            本日
          </button>
          <button 
            type="button" 
            class="quick-btn" 
            [class.active]="activeQuickFilter === 'week'"
            (click)="setQuickFilter('week')"
          >
            本周
          </button>
          <button 
            type="button" 
            class="quick-btn" 
            [class.active]="activeQuickFilter === 'month'"
            (click)="setQuickFilter('month')"
          >
            本月
          </button>
          <button 
            type="button" 
            class="quick-btn" 
            [class.active]="activeQuickFilter === 'year'"
            (click)="setQuickFilter('year')"
          >
            本年
          </button>
        </div>
        
        <form [formGroup]="filterForm" class="search-form">
          <div class="search-row">
            <div class="search-item">
              <label class="search-label">开始日期</label>
              <input type="date" formControlName="startDate" class="form-control">
            </div>
            <div class="search-item">
              <label class="search-label">结束日期</label>
              <input type="date" formControlName="endDate" class="form-control">
            </div>
            <div class="search-item">
              <label class="search-label">收支类型</label>
              <select formControlName="type" class="form-control">
                <option value="">全部</option>
                <option value="income">收入</option>
                <option value="expense">支出</option>
              </select>
            </div>
          </div>
          
          <div *ngIf="showAdvanced" class="advanced-section">
            <div class="search-row">
              <div class="search-item full-width">
                <label class="search-label">标签（支持多选，多个标签用逗号分隔或点击下方标签选择）</label>
                <div class="tags-search-container">
                  <div class="selected-filter-tags">
                    <span *ngFor="let tag of selectedFilterTags" class="tag-badge-small">
                      {{ tag }}
                      <button type="button" class="tag-remove-small" (click)="removeFilterTag(tag)">&times;</button>
                    </span>
                  </div>
                  <input 
                    type="text" 
                    #tagSearchInput
                    formControlName="tags"
                    class="form-control tag-search-input"
                    placeholder="输入标签后按回车添加"
                    (keyup.enter)="addFilterTagFromInput(tagSearchInput)"
                  >
                </div>
                <div *ngIf="existingTags.length > 0" class="existing-tags">
                  <span class="hint">常用标签：</span>
                  <button 
                    type="button" 
                    *ngFor="let tag of existingTags" 
                    class="existing-tag-btn"
                    [class.selected]="selectedFilterTags.includes(tag)"
                    (click)="toggleFilterTag(tag)"
                  >
                    {{ tag }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="search-actions">
            <button type="button" class="btn btn-sm btn-outline" (click)="toggleAdvanced()">
              {{ showAdvanced ? '收起高级' : '更多' }}
            </button>
            <button type="button" class="btn btn-secondary btn-sm" (click)="resetFilter()">重置</button>
            <button type="button" class="btn btn-primary btn-sm" (click)="applyFilter()">查询</button>
          </div>
        </form>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📋 收支明细</h3>
          <div class="card-header-right">
            <span class="record-count">共 {{ page?.totalElements || 0 }} 条记录</span>
            <button 
              *ngIf="transactions && transactions.length > 0"
              type="button" 
              class="btn btn-export-small" 
              (click)="exportTransactions()"
            >
              📥 导出
            </button>
          </div>
        </div>

        <div *ngIf="loading && transactions.length === 0" class="loading">
          <div class="spinner"></div>
        </div>

        <div *ngIf="!loading && (!transactions || transactions.length === 0)" class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-text">暂无记录</div>
          <p style="margin-top: 0.5rem; color: #7f8c8d;">去记一笔开始你的记账之旅吧</p>
        </div>

        <div *ngIf="!loading && groupedTransactions && groupedTransactions.length > 0" class="transaction-list-scroll" #scrollContainer (scroll)="onScroll($event)">
          <div *ngFor="let group of groupedTransactions" class="date-group">
            <div class="date-group-header">
              <span class="date-label">{{ formatDateLabel(group.date) }}</span>
              <span class="date-summary">
                <span *ngIf="group.income > 0" class="income-text">收入: +¥{{ group.income | number:'1.2-2' }}</span>
                <span *ngIf="group.income > 0 && group.expense > 0" class="summary-divider">|</span>
                <span *ngIf="group.expense > 0" class="expense-text">支出: -¥{{ group.expense | number:'1.2-2' }}</span>
              </span>
            </div>
            <div class="transaction-items">
              <div *ngFor="let transaction of group.transactions" class="transaction-item">
                <div class="transaction-icon" [class.income]="transaction.type === 'income'">
                  {{ getCategoryIcon(transaction.category, transaction.type) }}
                </div>
                
                <div class="transaction-info">
                  <div class="transaction-category">{{ transaction.category }}</div>
                  <div class="transaction-meta">
                    <span class="transaction-time">{{ formatTimeOnly(transaction.transactionTime) }}</span>
                    <span *ngIf="transaction.account" class="transaction-account">{{ transaction.account }}</span>
                    <span *ngIf="transaction.tags" class="transaction-tags">
                      <span *ngFor="let tag of transaction.tags.split(',')" class="tag-badge-tiny">
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
          </div>

          <div *ngIf="loadingMore" class="loading-more">
            <div class="spinner-small"></div>
            <span>加载中...</span>
          </div>

          <div *ngIf="!hasMore && transactions.length > 0" class="no-more-data">
            没有更多数据了
          </div>
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
      max-width: 1400px;
      margin: 0 auto;
    }

    .search-bar {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .quick-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #ecf0f1;
      align-items: center;
    }

    .quick-btn {
      padding: 0.5rem 1rem;
      border: 1.5px solid #ecf0f1;
      background: white;
      border-radius: 20px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #7f8c8d;
      font-weight: 500;
    }

    .quick-btn:hover {
      border-color: #3498db;
      color: #3498db;
    }

    .quick-btn.active {
      background: #3498db;
      color: white;
      border-color: #3498db;
    }

    .filter-divider {
      width: 1px;
      height: 24px;
      background: #ecf0f1;
      margin: 0 0.25rem;
    }

    .btn-export {
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
      border-radius: 20px;
      background: rgba(52, 152, 219, 0.1);
      color: #3498db;
      border: 1.5px solid rgba(52, 152, 219, 0.3);
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 500;
    }

    .btn-export:hover {
      background: #3498db;
      color: white;
      border-color: #3498db;
    }

    .search-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .search-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: flex-end;
    }

    .search-item {
      display: flex;
      flex-direction: column;
      min-width: 140px;
    }

    .search-item.full-width {
      flex: 1;
      min-width: auto;
    }

    .search-label {
      font-size: 0.8rem;
      font-weight: 500;
      color: #7f8c8d;
      margin-bottom: 0.35rem;
    }

    .search-item .form-control {
      padding: 0.55rem 0.85rem;
      font-size: 0.9rem;
      border: 1.5px solid #ecf0f1;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .search-item .form-control:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }

    .advanced-section {
      padding-top: 0.75rem;
      border-top: 1px dashed #ecf0f1;
    }

    .tags-search-container {
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

    .tags-search-container:focus-within {
      border-color: #3498db;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }

    .selected-filter-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    .tag-badge-small {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.2rem 0.6rem;
      background: #3498db;
      color: white;
      border-radius: 12px;
      font-size: 0.8rem;
    }

    .tag-remove-small {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 0.9rem;
      padding: 0;
      line-height: 1;
      opacity: 0.8;
    }

    .tag-remove-small:hover {
      opacity: 1;
    }

    .tag-search-input {
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

    .search-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #3498db;
      color: white;
    }

    .btn-primary:hover {
      background: #2980b9;
    }

    .btn-secondary {
      background: #f8f9fa;
      color: #7f8c8d;
    }

    .btn-secondary:hover {
      background: #ecf0f1;
      color: #2c3e50;
    }

    .btn-outline {
      background: transparent;
      border: 1.5px solid #ecf0f1;
      color: #7f8c8d;
    }

    .btn-outline:hover {
      border-color: #3498db;
      color: #3498db;
    }

    .btn-sm {
      padding: 0.4rem 0.85rem;
      font-size: 0.85rem;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #2c3e50;
      margin: 0;
    }

    .record-count {
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #ecf0f1;
      border-top-color: #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
    }

    .empty-state-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state-text {
      font-size: 1.25rem;
      font-weight: 500;
      color: #7f8c8d;
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
      border-radius: 12px;
      transition: all 0.2s ease;
    }

    .transaction-item:hover {
      background: rgba(52, 152, 219, 0.05);
    }

    .transaction-icon {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e74c3c;
      border-radius: 12px;
      font-size: 1.25rem;
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
      font-size: 0.8rem;
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

    .tag-badge-tiny {
      padding: 0.1rem 0.4rem;
      background: rgba(52, 152, 219, 0.15);
      color: #3498db;
      border-radius: 8px;
      font-size: 0.7rem;
    }

    .transaction-remark {
      font-size: 0.8rem;
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

    .text-income {
      color: #27ae60;
    }

    .text-expense {
      color: #e74c3c;
    }

    .transaction-actions {
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .card-header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .btn-export-small {
      padding: 0.35rem 0.75rem;
      font-size: 0.8rem;
      border-radius: 16px;
      background: rgba(52, 152, 219, 0.1);
      color: #3498db;
      border: 1.5px solid rgba(52, 152, 219, 0.3);
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 500;
    }

    .btn-export-small:hover {
      background: #3498db;
      color: white;
      border-color: #3498db;
    }

    .transaction-list-scroll {
      max-height: 600px;
      overflow-y: auto;
      padding-right: 0.5rem;
    }

    .date-group {
      margin-bottom: 1.5rem;
    }

    .date-group:last-child {
      margin-bottom: 0;
    }

    .date-group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0.75rem;
      margin-bottom: 0.75rem;
      background: linear-gradient(135deg, rgba(52, 152, 219, 0.05) 0%, rgba(52, 152, 219, 0.08) 100%);
      border-radius: 8px;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .date-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: #2c3e50;
    }

    .date-summary {
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .income-text {
      color: #27ae60;
      font-weight: 500;
    }

    .expense-text {
      color: #e74c3c;
      font-weight: 500;
    }

    .summary-divider {
      color: #bdc3c7;
    }

    .transaction-items {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .loading-more {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
      padding: 1.5rem;
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .spinner-small {
      width: 20px;
      height: 20px;
      border: 2px solid #ecf0f1;
      border-top-color: #3498db;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .no-more-data {
      text-align: center;
      padding: 1.5rem;
      color: #bdc3c7;
      font-size: 0.85rem;
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
      border-radius: 16px;
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
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #ecf0f1;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.15rem;
      color: #2c3e50;
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
      padding: 1.25rem 1.5rem;
      border-top: 1px solid #ecf0f1;
    }

    .modal-actions .btn {
      flex: 1;
    }

    form {
      padding: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      color: #7f8c8d;
      margin-bottom: 0.35rem;
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

      .search-row {
        flex-direction: column;
        align-items: stretch;
      }

      .search-item {
        min-width: auto;
      }

      .quick-filters {
        justify-content: center;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .pagination {
        flex-wrap: wrap;
        gap: 0.5rem;
      }
    }
  `]
})
export class TransactionListComponent implements OnInit, OnDestroy {
  transactions: Transaction[] = [];
  groupedTransactions: { date: string; transactions: Transaction[]; income: number; expense: number }[] = [];
  page?: Page<Transaction>;
  loading = false;
  loadingMore = false;
  hasMore = true;
  showFilter = true;
  showAdvanced = false;
  activeQuickFilter: 'day' | 'week' | 'month' | 'year' | null = 'month';
  accounts: string[] = ['支付宝', '微信', '银行卡', '现金', '信用卡'];
  existingTags: string[] = [];
  selectedFilterTags: string[] = [];

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
  private currentPage = 0;

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
    this.loadExistingTags();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  toggleFilter(): void {
    this.showFilter = !this.showFilter;
  }

  toggleAdvanced(): void {
    this.showAdvanced = !this.showAdvanced;
  }

  setQuickFilter(range: 'day' | 'week' | 'month' | 'year'): void {
    this.activeQuickFilter = range;
    const now = new Date();

    switch (range) {
      case 'day':
        this.filterForm.patchValue({
          startDate: this.formatDate(now),
          endDate: this.formatDate(now)
        });
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        this.filterForm.patchValue({
          startDate: this.formatDate(weekStart),
          endDate: this.formatDate(now)
        });
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        this.filterForm.patchValue({
          startDate: this.formatDate(monthStart),
          endDate: this.formatDate(now)
        });
        break;
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        this.filterForm.patchValue({
          startDate: this.formatDate(yearStart),
          endDate: this.formatDate(now)
        });
        break;
    }
    this.resetAndLoad();
  }

  addFilterTagFromInput(input: HTMLInputElement): void {
    const value = this.filterForm.get('tags')?.value?.trim();
    if (value) {
      const tags = value.split(',').map((t: string) => t.trim()).filter((t: string) => t);
      tags.forEach((tag: string) => {
        if (!this.selectedFilterTags.includes(tag)) {
          this.selectedFilterTags.push(tag);
        }
      });
      this.filterForm.get('tags')?.setValue('');
      input.value = '';
    }
  }

  toggleFilterTag(tag: string): void {
    if (this.selectedFilterTags.includes(tag)) {
      this.removeFilterTag(tag);
    } else {
      this.selectedFilterTags.push(tag);
    }
  }

  removeFilterTag(tag: string): void {
    this.selectedFilterTags = this.selectedFilterTags.filter(t => t !== tag);
  }

  applyFilter(): void {
    this.activeQuickFilter = null;
    this.resetAndLoad();
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
    this.activeQuickFilter = 'month';
    this.showAdvanced = false;
    this.selectedFilterTags = [];
    this.resetAndLoad();
  }

  private resetAndLoad(): void {
    this.currentPage = 0;
    this.transactions = [];
    this.groupedTransactions = [];
    this.hasMore = true;
    this.loadTransactions();
  }

  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - 100 && !this.loadingMore && this.hasMore) {
      this.loadMore();
    }
  }

  private loadMore(): void {
    if (this.loadingMore || !this.hasMore) return;
    this.currentPage++;
    this.loadingMore = true;

    const startDate = this.filterForm.get('startDate')?.value;
    const endDate = this.filterForm.get('endDate')?.value;
    const type = this.filterForm.get('type')?.value;
    const tags = this.selectedFilterTags.length > 0 ? this.selectedFilterTags.join(',') : undefined;

    let startTime: string | undefined;
    let endTime: string | undefined;

    if (startDate) {
      startTime = startDate + 'T00:00:00';
    }
    if (endDate) {
      endTime = endDate + 'T23:59:59';
    }

    this.subscription = this.transactionService.getTransactions(
      this.currentPage, this.pageSize, startTime, endTime, type || undefined, tags
    ).subscribe({
      next: (result) => {
        this.page = result;
        this.transactions = [...this.transactions, ...result.content];
        this.groupTransactions();
        this.loadingMore = false;
        if (result.last) {
          this.hasMore = false;
        }
      },
      error: () => {
        this.loadingMore = false;
        this.currentPage--;
        alert('加载数据失败');
      }
    });
  }

  private groupTransactions(): void {
    const groups: Map<string, { transactions: Transaction[]; income: number; expense: number }> = new Map();

    for (const transaction of this.transactions) {
      const dateKey = this.getDateKey(transaction.transactionTime);
      if (!groups.has(dateKey)) {
        groups.set(dateKey, { transactions: [], income: 0, expense: 0 });
      }
      const group = groups.get(dateKey)!;
      group.transactions.push(transaction);
      if (transaction.type === 'income') {
        group.income += transaction.amount;
      } else {
        group.expense += transaction.amount;
      }
    }

    this.groupedTransactions = Array.from(groups.entries()).map(([date, data]) => ({
      date,
      transactions: data.transactions,
      income: data.income,
      expense: data.expense
    }));
  }

  private getDateKey(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  formatDateLabel(dateStr: string): string {
    if (!dateStr) return '';
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    if (dateStr === todayStr) {
      return '今天';
    } else if (dateStr === yesterdayStr) {
      return '昨天';
    } else {
      const parts = dateStr.split('-');
      return `${parseInt(parts[1])}月${parseInt(parts[2])}日`;
    }
  }

  formatTimeOnly(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private loadExistingTags(): void {
    this.transactionService.getAllTags().subscribe({
      next: (tags) => {
        const allTags = tags.flatMap(t => t.split(',').map(s => s.trim()).filter(s => s));
        this.existingTags = [...new Set(allTags)].slice(0, 15);
      }
    });
  }

  private loadTransactions(): void {
    this.loading = true;

    const startDate = this.filterForm.get('startDate')?.value;
    const endDate = this.filterForm.get('endDate')?.value;
    const type = this.filterForm.get('type')?.value;
    const tags = this.selectedFilterTags.length > 0 ? this.selectedFilterTags.join(',') : undefined;

    let startTime: string | undefined;
    let endTime: string | undefined;

    if (startDate) {
      startTime = startDate + 'T00:00:00';
    }
    if (endDate) {
      endTime = endDate + 'T23:59:59';
    }

    this.subscription = this.transactionService.getTransactions(
      this.currentPage, this.pageSize, startTime, endTime, type || undefined, tags
    ).subscribe({
      next: (result) => {
        this.page = result;
        this.transactions = result.content;
        this.groupTransactions();
        this.loading = false;
        if (result.last) {
          this.hasMore = false;
        }
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
        this.resetAndLoad();
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
        this.resetAndLoad();
      },
      error: () => {
        this.deleting = false;
        alert('删除失败');
      }
    });
  }

  exportTransactions(): void {
    this.loadAllTransactionsForExport();
  }

  private loadAllTransactionsForExport(): void {
    const startDate = this.filterForm.get('startDate')?.value;
    const endDate = this.filterForm.get('endDate')?.value;
    const type = this.filterForm.get('type')?.value;
    const tags = this.selectedFilterTags.length > 0 ? this.selectedFilterTags.join(',') : undefined;

    let startTime: string | undefined;
    let endTime: string | undefined;

    if (startDate) {
      startTime = startDate + 'T00:00:00';
    }
    if (endDate) {
      endTime = endDate + 'T23:59:59';
    }

    this.transactionService.getTransactions(
      0, 1000, startTime, endTime, type || undefined, tags
    ).subscribe({
      next: (result) => {
        this.generateCSV(result.content);
      },
      error: () => {
        alert('导出失败，请重试');
      }
    });
  }

  private generateCSV(transactions: Transaction[]): void {
    if (transactions.length === 0) {
      alert('没有可导出的数据');
      return;
    }

    const headers = ['日期', '时间', '类型', '分类', '金额', '账户', '标签', '备注'];
    const rows = transactions.map(t => {
      const dateTime = t.transactionTime ? new Date(t.transactionTime) : new Date();
      const date = `${dateTime.getFullYear()}-${String(dateTime.getMonth() + 1).padStart(2, '0')}-${String(dateTime.getDate()).padStart(2, '0')}`;
      const time = `${String(dateTime.getHours()).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`;
      return [
        date,
        time,
        t.type === 'income' ? '收入' : '支出',
        t.category || '',
        t.type === 'income' ? `+${t.amount}` : `-${t.amount}`,
        t.account || '',
        t.tags || '',
        t.remark || ''
      ];
    });

    const csvContent = '\uFEFF' + [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', `账单导出_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
