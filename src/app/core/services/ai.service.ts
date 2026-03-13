import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface AiReplyRequest {
  appName: string;
  user: string;
  rating: number;
  content: string;
  tone?: 'formal' | 'friendly' | 'concise';
}

@Injectable({ providedIn: 'root' })
export class AiService {
  constructor(private http: HttpClient) {}

  generateReply(req: AiReplyRequest): Observable<string> {
    const normalizedTone: 'neutral' | 'friendly' | 'formal' =
      req.tone === 'concise' ? 'neutral' : (req.tone ?? 'friendly');

    const payload = {
      reviewText: req.content,
      app: {
        appName: req.appName,
        rating: req.rating,
        description: '',
        category: '',
        ageRating: '3+'
      },
      language: 'es',
      tone: normalizedTone
    };

    return this.http.post<{ reply: string }>('/api/v1/review-replies', payload).pipe(
      map((r) => r.reply ?? ''),
      catchError(() => {
        let base: string;
        if (req.rating >= 4) {
          base = `¡Gracias ${req.user}! Nos encanta que ${req.appName} te ayude.`;
        } else if (req.rating <= 2) {
          base = `Lamentamos la experiencia, ${req.user}. Queremos mejorar ${req.appName}.`;
        } else {
          base = `Gracias por tu comentario, ${req.user}. Seguimos mejorando ${req.appName}.`;
        }
        const extra =
          req.tone === 'formal'
            ? ' Agradecemos su tiempo y retroalimentación.'
            : req.tone === 'concise'
            ? ''
            : ' ¡Gracias por confiar en nosotros!';
        return of(`${base} Sobre lo que mencionas: "${req.content}".${extra}`);
      })
    );
  }
}
