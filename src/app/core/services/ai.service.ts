import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface AiReplyRequest {
  appName: string;
  user: string;
  rating: number;
  content: string;
  tone?: 'formal' | 'friendly' | 'concise';
}

@Injectable({ providedIn: 'root' })
export class AiService {
  generateReply(req: AiReplyRequest): Observable<string> {
    const tone = req.tone ?? 'friendly';
    let base: string;
    if (req.rating >= 4) {
      base = `¡Gracias ${req.user}! Nos encanta que ${req.appName} te ayude.`;
    } else if (req.rating <= 2) {
      base = `Lamentamos la experiencia, ${req.user}. Queremos mejorar ${req.appName}.`;
    } else {
      base = `Gracias por tu comentario, ${req.user}. Seguimos mejorando ${req.appName}.`;
    }
    const extra =
      tone === 'formal'
        ? ' Agradecemos su tiempo y retroalimentación.'
        : tone === 'concise'
        ? ''
        : ' ¡Gracias por confiar en nosotros!';
    return of(`${base} Sobre lo que mencionas: "${req.content}".${extra}`);
  }
}

