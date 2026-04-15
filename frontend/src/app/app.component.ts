import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>💰 个人记账系统</h1>
        <nav class="nav-menu">
          <a routerLink="/form" routerLinkActive="active">记账</a>
          <a routerLink="/statistics" routerLinkActive="active">报表</a>
          <a routerLink="/list" routerLinkActive="active">明细</a>
        </nav>
      </header>
      <main class="app-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }
    
    .app-header {
      background: white;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 0 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .app-header h1 {
      margin: 0;
      font-size: 1.5rem;
      color: #2c3e50;
      padding: 1rem 0;
    }
    
    .nav-menu {
      display: flex;
      gap: 0.5rem;
    }
    
    .nav-menu a {
      padding: 0.75rem 1.5rem;
      text-decoration: none;
      color: #7f8c8d;
      border-radius: 8px;
      transition: all 0.3s ease;
      font-weight: 500;
    }
    
    .nav-menu a:hover {
      background: #ecf0f1;
      color: #3498db;
    }
    
    .nav-menu a.active {
      background: #3498db;
      color: white;
    }
    
    .app-main {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    @media (max-width: 768px) {
      .app-header {
        flex-direction: column;
        padding: 1rem;
      }
      
      .nav-menu {
        width: 100%;
        justify-content: center;
      }
      
      .nav-menu a {
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
      }
      
      .app-main {
        padding: 1rem;
      }
    }
  `]
})
export class AppComponent {
  title = '个人记账系统';
}
