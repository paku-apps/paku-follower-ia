import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { StoreReviewResponse } from '../models/store.models';

export interface ReviewItem {
  id: string;
  appId: string;
  user: string;
  rating: number;
  content: string;
  reply?: string;
  lastModUserSeconds?: number;
  lastModDevSeconds?: number;
}

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  constructor(private http: HttpClient) {}

  list(appId: string, cursor?: string, limit = 10): Observable<{ items: ReviewItem[]; nextCursor?: string }> {
    let params = new HttpParams().set('limit', String(limit));
    if (cursor) params = params.set('cursor', cursor);
    return this.http.get<StoreReviewResponse>(`/apps/${appId}/reviews`, { params }).pipe(
      map((res) => {
        const items: ReviewItem[] =
          res.reviews?.map((r) => {
            const uc = r.comments.find((c) => !!c.userComment)?.userComment;
            const dc = r.comments.find((c) => !!c.developerComment)?.developerComment;
            return {
              id: r.reviewId,
              appId,
              user: r.authorName,
              rating: uc?.starRating ?? 0,
              content: uc?.text ?? '',
              reply: dc?.text,
              lastModUserSeconds: uc?.lastModified?.seconds ? Number(uc.lastModified.seconds) : undefined,
              lastModDevSeconds: dc?.lastModified?.seconds ? Number(dc.lastModified.seconds) : undefined
            };
          }) ?? [];
        const nextCursor = res.tokenPagination?.nextPageToken;
        return { items, nextCursor };
      })
    );
  }

  reply(appId: string, reviewId: string, text: string): Observable<void> {
    return this.http.post<void>(`/apps/${appId}/reviews/${reviewId}/developer-comment`, { text });
  }

  addReview(item: Omit<ReviewItem, 'id'> & { id?: string }): Observable<ReviewItem> {
    const id = item.id ?? `r${Date.now()}`;
    const review: ReviewItem = { ...item, id };
    return of(review);
  }
}
