import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingSpinnerService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  private requestCount = 0;
  private startTime = 0;
  private minDuration = 300;

  show() {
    if (this.requestCount === 0) {
      this.startTime = Date.now();
      this.loadingSubject.next(true);
    }
    this.requestCount++;
  }

  hide() {
    this.requestCount--;
    if (this.requestCount <= 0) {
      const elapsed = Date.now() - this.startTime;
      const delay = Math.max(this.minDuration - elapsed, 0);

      setTimeout(() => {
        if (this.requestCount <= 0) {
          this.requestCount = 0;
          this.loadingSubject.next(false);
        }
      }, delay);
    }
  }
}



// {
//   private loadingSubject = new BehaviorSubject<boolean>(false);
//   loading$ = this.loadingSubject.asObservable();

//   private requestCount = 0;

//   show() {
//     this.requestCount++;
//     this.loadingSubject.next(true);
//   }

//   hide() {
//     this.requestCount--;
//     if (this.requestCount <= 0) {
//       this.requestCount = 0;
//       this.loadingSubject.next(false);
//     }
//   }
// }


