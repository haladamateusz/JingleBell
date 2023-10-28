import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LlamaResponseResult } from '../../models/llama-response.interface';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { LlamaResponseMock } from '../../mocks/LlamaResponse.mock';

@Injectable({
  providedIn: 'root'
})
export class LlamaService {
  private httpClient = inject(HttpClient);
  private lastQuestionAsked = new BehaviorSubject('');
  private lastResults = new BehaviorSubject<LlamaResponseResult>({} as LlamaResponseResult);

  askQuestion(question: string, userId: string): Observable<LlamaResponseResult> {
    console.log('endpoint: /askQuestion');
    console.log('body', { question, userId });
    return of(LlamaResponseMock).pipe(
      tap(data => {
        this.lastResults.next(data);
        this.lastQuestionAsked.next(question);
      })
    );
    //this.httpClient.post<LlamaResponse>('<PASTE_URL_HERE>', { question, userId });
  }

  sendFeedback(feedback: string, userId: string): Observable<boolean> {
    console.log('endpoint: /sendFeedback');
    console.log('body', {
      feedback,
      userId,
      question: this.lastQuestionAsked.getValue(),
      results: this.lastResults.getValue()
    });
    return of(true);
    // this.httpClient.post<LlamaResponse>('<PASTE_URL_HERE>', { feedback, userId, previousQuestion, previousResults });
  }
}
