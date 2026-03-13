import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { AppsComponent } from './features/apps/apps.component';
import { ReviewsComponent } from './features/reviews/reviews.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'catalogo', component: AppsComponent },
  { path: 'mis-apps', component: AppsComponent, data: { mine: true } },
  { path: 'reviews', component: ReviewsComponent }
];
