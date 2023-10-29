import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { LlamaService } from './service/llama/llama.service';
import { v4 as uuidv4 } from 'uuid';
import { LlamaResponse, LlamaResponseResult } from './models/llama-response.interface';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ShortenPipe } from './pipe/shorten/shorten.pipe';
import { MatIconModule } from '@angular/material/icon';
import { FEEDBACK } from './models/feedback.enum';
import { LayoutService } from './service/layout/layout.service';
import { debounceTime, distinctUntilChanged, exhaustMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VoiceRecognitionService } from './service/voice-recognition/voice-recognition.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
    ShortenPipe,
    MatProgressSpinnerModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  protected readonly FEEDBACK = FEEDBACK;

  title = 'Jingle Bell';

  llamaService = inject(LlamaService);

  layoutService = inject(LayoutService);

  voiceRecognitionService = inject(VoiceRecognitionService);

  layoutObserver = this.layoutService.observeMd().pipe(takeUntilDestroyed());

  sessionId = uuidv4();

  question = '';

  displayedColumns: string[] = ['description', 'type', 'language', 'url'];

  visibleCharacters = 200;

  dataSource: MatTableDataSource<LlamaResponse> = new MatTableDataSource<LlamaResponse>();

  showFeedback = false;
  showDetailedNegativeFeedback = false;
  smallScreen = true;
  recordingStarted = false;
  speechApiExists = false;
  isLoading = false;

  emojiHashMap = new Map<string, string>([
    ['English', '🇺🇸'],
    ['French', '🇫🇷'],
    ['German', '🇩🇪']
  ]);

  ngOnInit() {
    this.speechApiExists = this.voiceRecognitionService.speechRecognitionApiInBrowser();

    this.voiceRecognitionService.lastSpeech
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        tap((speech: string) => {
          this.question = speech.charAt(0).toUpperCase() + speech.slice(1) + '?';
        }),
        exhaustMap(() => this.llamaService.askQuestion(this.question, this.sessionId))
      )
      .subscribe(response => {
        this.dataSource.data = response.result;
        this.showFeedback = true;
        this.isLoading = false;
        this.recordingStarted = !this.recordingStarted;
      });

    this.layoutObserver.subscribe((isSmallScreen: boolean) => {
      if (isSmallScreen) {
        this.visibleCharacters = 60;
        this.smallScreen = true;
        this.displayedColumns = ['description', 'language', 'url'];
      } else {
        this.visibleCharacters = 200;
        this.smallScreen = false;
        this.displayedColumns = ['description', 'type', 'language', 'url'];
      }
    });
  }

  toggleRecording(): void {
    if (!this.recordingStarted) {
      this.voiceRecognitionService.startVoiceRecognition();
    } else {
      this.voiceRecognitionService.stopVoiceRecognition();
    }

    this.isLoading = !this.isLoading;
    this.recordingStarted = !this.recordingStarted;
  }

  sendQuestion(): void {
    this.isLoading = true;
    this.llamaService.askQuestion(this.question, this.sessionId).subscribe({
      next: (response: LlamaResponseResult) => {
        this.dataSource.data = response.result;
        this.showFeedback = true;
        this.isLoading = false;
      }
    });
  }

  sendFeedback(feedback: FEEDBACK): void {
    this.llamaService.sendFeedback(feedback, this.sessionId).subscribe(() => {
      this.showFeedback = false;
      this.showDetailedNegativeFeedback = false;
    });
  }
}
