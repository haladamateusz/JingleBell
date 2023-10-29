import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

declare const webkitSpeechRecognition: any;
declare const webkitSpeechGrammarList: any;
declare const webkitSpeechRecognitionEvent: any;

@Injectable({
  providedIn: 'root'
})
export class VoiceRecognitionService {
  lastSpeech: Subject<string> = new Subject();
  recognition: any | undefined;

  speechRecognitionApiInBrowser(): boolean {
    return 'webkitSpeechRecognition' in window;
  }

  handler = (event: any) => {
    event.stopPropagation();
    const transcript = event.results[0][0].transcript;
    this.recognition.stop();
    this.recognition = undefined;
    this.lastSpeech.next(transcript);
  };

  startVoiceRecognition() {
    if (this.speechRecognitionApiInBrowser()) {
      const grammar = '#JSGF V1.0;';
      this.recognition = new webkitSpeechRecognition();
      const speechRecognitionList = new webkitSpeechGrammarList();
      speechRecognitionList.addFromString(grammar, 1);

      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = 'en-US';

      console.log('recognition started');
      this.recognition.start();

      this.recognition.addEventListener('result', this.handler, { once: true });
    }
  }

  stopVoiceRecognition() {
    this.recognition.stop();
    this.recognition.removeEventListener('result', this.handler);
  }
}
