import { Routes } from '@angular/router';
import { TransactionFormComponent } from './components/transaction-form/transaction-form.component';
import { StatisticsComponent } from './components/statistics/statistics.component';
import { TransactionListComponent } from './components/transaction-list/transaction-list.component';

export const routes: Routes = [
  { path: '', redirectTo: '/form', pathMatch: 'full' },
  { path: 'form', component: TransactionFormComponent },
  { path: 'statistics', component: StatisticsComponent },
  { path: 'list', component: TransactionListComponent }
];
