import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'shorten',
  standalone: true
})
export class ShortenPipe implements PipeTransform {
  transform(val: string, length?: number): string {
    return length && val.length > length ? val.slice(0, length) + '...' : val;
  }
}
