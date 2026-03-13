import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { NotificationsService } from './core/services/notifications.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatButtonModule
  ],
  template: `
    <mat-sidenav-container class="layout">
      <mat-sidenav mode="side" opened class="sidebar">
        <div class="brand">
          <div class="logo"></div>
          <span>Paku Follow IA</span>
        </div>
        <mat-nav-list class="nav">
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
          <a mat-list-item routerLink="/catalogo" routerLinkActive="active">Catálogo</a>
          <a mat-list-item routerLink="/mis-apps" routerLinkActive="active">Mis Apps</a>
          <a mat-list-item routerLink="/reviews" routerLinkActive="active">Reviews</a>
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar color="primary" class="header">
          <span>Panel Administrativo</span>
          <span class="spacer"></span>
          <button mat-icon-button aria-label="Notificaciones" title="Notificaciones">
            <mat-icon>notifications</mat-icon>
          </button>
          <span style="font-size:12px;opacity:.9;margin:0 8px 0 4px">{{ count() }}</span>
          <span style="opacity:.8;margin-left:8px">v0.1</span>
        </mat-toolbar>
        <main class="content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  private notifications = inject(NotificationsService);
  readonly count = computed(() => this.notifications.items().filter((n) => !n.read).length);
}
