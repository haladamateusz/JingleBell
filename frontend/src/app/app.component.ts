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

  emojiHashMap = new Map<string, string>([
    ['English', '🇺🇸'],
    ['French', '🇫🇷'],
    ['German', '🇩🇪']
  ]);

  constructor(public cdr: ChangeDetectorRef) {}

  ngOnInit() {
    console.log(
      'speechRecognition API exists',
      this.voiceRecognitionService.speechRecognitionApiInBrowser()
    );
    this.speechApiExists = this.voiceRecognitionService.speechRecognitionApiInBrowser();

    this.voiceRecognitionService.lastSpeech
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        tap((speech: string) => {
          console.log('voiceRecognitionObserver', speech);

          this.question = speech.charAt(0).toUpperCase() + speech.slice(1) + '?';
        }),
        exhaustMap(() => this.llamaService.askQuestion(this.question, this.sessionId))
      )
      .subscribe(response => {
        console.log('how many times are we here?');
        this.dataSource.data = response.result;
        this.showFeedback = true;

        this.recordingStarted = !this.recordingStarted;
      });

    // this.layoutObserver.subscribe((isSmallScreen: boolean) => {
    //   if (isSmallScreen) {
    //     this.visibleCharacters = 60;
    //     this.smallScreen = true;
    //     this.displayedColumns = ['description', 'language', 'url'];
    //   } else {
    //     this.visibleCharacters = 200;
    //     this.smallScreen = false;
    //     this.displayedColumns = ['description', 'type', 'language', 'url'];
    //   }
    // });
  }

  startRecording(): void {
    // if (this.isLoading) return;
    if (!this.recordingStarted) {
      this.recordingStarted = true;
      this.voiceRecognitionService.startVoiceRecognition();
    }
    // switch (this.recordingStarted) {
    //   case true:
    //     this.recordingStarted = false;
    //     console.log('stop audio');
    //     this.voiceRecognitionService.stopVoiceRecognition();
    //     break;
    //   case false:
    //     this.recordingStarted = true;
    //     console.log('record audio');
    //     this.voiceRecognitionService.startVoiceRecognition();
    //     break;
    // }
  }

  sendQuestion(): void {
    this.llamaService.askQuestion(this.question, this.sessionId).subscribe({
      next: (response: LlamaResponseResult) => {
        this.dataSource.data = response.result;
        this.showFeedback = true;
      }
    });
  }

  sendFeedback(feedback: FEEDBACK): void {
    this.llamaService.sendFeedback(feedback, this.sessionId).subscribe(() => {
      this.showFeedback = false;
      this.showDetailedNegativeFeedback = false;
      // this.cdr.detectChanges();
    });
  }
}
