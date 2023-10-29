import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LlamaResponseResult } from '../../models/llama-response.interface';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { FEEDBACK } from 'src/app/models/feedback.enum';

@Injectable({
  providedIn: 'root'
})
export class LlamaService {
  private httpClient = inject(HttpClient);
  private lastQuestionAsked = new BehaviorSubject('');
  private lastResults = new BehaviorSubject<LlamaResponseResult>({} as LlamaResponseResult);

  askQuestion(question: string, userId: string): Observable<LlamaResponseResult> {
    // return of({ ...LlamaResponseMock, question, userId }).pipe(
    //   tap(data => {
    //     this.lastResults.next(data);
    //     this.lastQuestionAsked.next(question);
    //   })
    // );
    return this.httpClient
      .post<LlamaResponseResult>('http://127.0.0.1:8000/askQuestion/', { question, userId })
      .pipe(
        tap(data => {
          this.lastResults.next(data);
          this.lastQuestionAsked.next(question);
        })
      );
  }

  sendFeedback(feedback: FEEDBACK, userId: string): Observable<boolean> {
    // return of(true);
    return this.httpClient.post<boolean>('http://127.0.0.1:8000/sendFeedback/', {
      feedback,
      userId,
      previousQuestion: this.lastQuestionAsked.getValue(),
      previousResults: this.lastResults.getValue()
    });
  }
}
