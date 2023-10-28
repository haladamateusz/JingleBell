import { inject, Injectable } from '@angular/core';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { map } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private readonly xsBreakpoint = ['(max-width:575.98px)'];
  private readonly smBreakpoint = ['(max-width:576px)'];
  private readonly mdBreakpoint = ['(max-width:768px)'];
  private readonly lgBreakpoint = ['(max-width:992px)'];
  private readonly xlBreakpoint = '(min-width:1200px)';

  private breakpointObserver = inject(BreakpointObserver);

  observeMd() {
    return this.breakpointObserver
      .observe(this.mdBreakpoint)
      .pipe(map((data: BreakpointState) => data.matches));
  }
}
