import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { AppsComponent } from './features/apps/apps.component';
import { ReviewsComponent } from './features/reviews/reviews.component';
import { LoginComponent } from './features/auth/login.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'catalogo', component: AppsComponent, canActivate: [authGuard] },
  { path: 'mis-apps', component: AppsComponent, data: { mine: true }, canActivate: [authGuard] },
  { path: 'reviews', component: ReviewsComponent, canActivate: [authGuard] }
];
