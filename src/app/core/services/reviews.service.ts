import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface ReviewItem {
  id: string;
  appId: string;
  appName: string;
  user: string;
  rating: number;
  content: string;
  reply?: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  private reviews: ReviewItem[] = [
    { id: 'r1', appId: '1', appName: 'Paku Notes', user: 'Ana', rating: 5, content: 'Excelente app.' },
    { id: 'r2', appId: '3', appName: 'FitPaku', user: 'Luis', rating: 3, content: 'Faltan rutinas.' }
  ];

  list(): Observable<ReviewItem[]> {
    return of(this.reviews);
  }

  reply(id: string, text: string): Observable<ReviewItem | undefined> {
    const r = this.reviews.find((x) => x.id === id);
    if (r) {
      r.reply = text;
    }
    return of(r);
  }

  addReview(item: Omit<ReviewItem, 'id'> & { id?: string }): Observable<ReviewItem> {
    const id = item.id ?? `r${Date.now()}`;
    const review: ReviewItem = { ...item, id };
    this.reviews.unshift(review);
    return of(review);
  }
}
