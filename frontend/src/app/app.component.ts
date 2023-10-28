import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { LlamaService } from './service/llama/llama.service';
import { v4 as uuidv4 } from 'uuid';
import { LlamaResponse, LlamaResponseResult } from './models/llama-response.interface';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { ShortenPipe } from './pipe/shorten/shorten.pipe';
import { MatIconModule } from '@angular/material/icon';
import { FEEDBACK } from './models/feedback.enum';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    MatTableModule,
    ShortenPipe
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  protected readonly FEEDBACK = FEEDBACK;

  title = 'Jingle Bell';

  llamaService = inject(LlamaService);

  sessionId = uuidv4();

  question = '';

  displayedColumns: string[] = ['description', 'type', 'language', 'url'];

  dataSource: LlamaResponse[] = [];

  showFeedback = false;
  showDetailedNegativeFeedback = false;

  ngOnInit() {
    console.log('current session id', this.sessionId);
  }

  sendQuestion(): void {
    this.llamaService.askQuestion(this.question, this.sessionId).subscribe({
      next: (response: LlamaResponseResult) => {
        this.dataSource = response.result;
        this.showFeedback = true;
      }
    });
  }

  sendFeedback(feedback: FEEDBACK): void {
    console.log('feedback', feedback);
    this.llamaService.sendFeedback(feedback, this.sessionId).subscribe(() => {
      this.showFeedback = false;
      this.showDetailedNegativeFeedback = false;
    });
  }
}
