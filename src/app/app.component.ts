import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { NotificationsService } from './core/services/notifications.service';
import { AuthService } from './core/services/auth.service';
import { MyAppsService } from './core/services/my-apps.service';
import { MatBadgeModule } from '@angular/material/badge';
import { effect } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NgIf,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    MatBadgeModule
  ],
  template: `
    <mat-sidenav-container class="layout">
      <mat-sidenav *ngIf="isAuth()" mode="side" opened class="sidebar">
        <div class="brand">
          <div class="logo"></div>
          <span>Paku Follow IA</span>
        </div>
        <mat-nav-list class="nav">
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
          <a mat-list-item routerLink="/catalogo" routerLinkActive="active">Catálogo</a>
          <a mat-list-item routerLink="/mis-apps" routerLinkActive="active">
            <span style="display:flex;align-items:center;gap:8px">
              Mis Apps
              <mat-icon matBadge="{{ favCount() }}" matBadgeColor="accent">star</mat-icon>
            </span>
          </a>
          <a mat-list-item routerLink="/reviews" routerLinkActive="active">Reviews</a>
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar *ngIf="isAuth()" color="primary" class="header">
          <span>Panel Administrativo</span>
          <span class="spacer"></span>
          <button mat-icon-button aria-label="Notificaciones" title="Notificaciones">
            <mat-icon>notifications</mat-icon>
          </button>
          <span style="font-size:12px;opacity:.9;margin:0 8px 0 4px">{{ count() }}</span>
          <button mat-icon-button aria-label="Favoritos" title="Mis favoritos" routerLink="/mis-apps">
            <mat-icon style="color:var(--accent)">star</mat-icon>
          </button>
          <span style="font-size:12px;opacity:.9;margin:0 8px 0 4px">{{ favCount() }}</span>
          <span style="opacity:.8;margin-left:8px">v0.1</span>
          <span style="opacity:.95;margin-left:12px">{{ userName() }}</span>
          <button mat-icon-button aria-label="Salir" title="Salir" (click)="logout()">
            <mat-icon>logout</mat-icon>
          </button>
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
  private auth = inject(AuthService);
  private myApps = inject(MyAppsService);
  private router = inject(Router);
  readonly count = computed(() => this.notifications.items().filter((n) => n.message.startsWith('Nueva review hoy')).length);
  readonly isAuth = this.auth.isAuthenticatedSig;
  readonly userName = computed(() => {
    const u = this.auth.userSig();
    return u?.name || u?.email || '';
  });
  readonly favCount = computed(() => this.myApps.favoritesSig().length);

  constructor() {
    effect(() => {
      const u = this.auth.userSig();
      if (u?.id) {
        this.myApps.fetchMine(u.id).subscribe();
      }
    });
  }
  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
