import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaction, Page, Statistics } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = 'http://localhost:8080/api/transactions';

  constructor(private http: HttpClient) { }

  createTransaction(transaction: Transaction): Observable<Transaction> {
    return this.http.post<Transaction>(this.apiUrl, transaction);
  }

  updateTransaction(id: number, transaction: Transaction): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.apiUrl}/${id}`, transaction);
  }

  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getTransaction(id: number): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.apiUrl}/${id}`);
  }

  getTransactions(
    page: number = 0,
    size: number = 20,
    startTime?: string,
    endTime?: string,
    type?: string,
    tags?: string
  ): Observable<Page<Transaction>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (startTime) params = params.set('startTime', startTime);
    if (endTime) params = params.set('endTime', endTime);
    if (type) params = params.set('type', type);
    if (tags) params = params.set('tags', tags);

    return this.http.get<Page<Transaction>>(this.apiUrl, { params });
  }

  getStatistics(startTime?: string, endTime?: string): Observable<Statistics> {
    let params = new HttpParams();
    if (startTime) params = params.set('startTime', startTime);
    if (endTime) params = params.set('endTime', endTime);

    return this.http.get<Statistics>(`${this.apiUrl}/statistics`, { params });
  }

  getAllTags(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/tags`);
  }

  getCategories(type: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categories`, {
      params: { type }
    });
  }

  getDefaultCategories(type: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/default-categories`, {
      params: { type }
    });
  }

  getAccounts(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/accounts`);
  }
}
