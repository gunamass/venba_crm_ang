import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id?: number;
  message: string;
  type: 'error' | 'warn' | 'success';
  time?: number;
  x?: 'left' | 'right' | 'center';
  y?: 'top' | 'bottom' | 'center';
  theme?: 'arcade' | 'professional' | 'brutalist' | 'glass' | 'neon';
  animation?: 'slide' | 'bounce' | 'fade' | 'flip' | 'zoom';
}

@Injectable({
  providedIn: 'root'
})
export class BToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  private counter = 0;

  constructor() { }

  // Show new toast
  show(toast: Toast) {
    const newToast: Toast = {
      id: ++this.counter,
      time: toast.time ?? 3000,
      x: toast.x ?? 'right',
      y: toast.y ?? 'top',
      theme: toast.theme ?? 'arcade',
      animation: toast.animation ?? 'slide',
      ...toast
    };

    const current = this.toastsSubject.value;
    this.toastsSubject.next([newToast]);

    if (newToast.time && newToast.time > 0) {
      setTimeout(() => this.remove(newToast.id!), newToast.time);
    }
  }


  // Remove toast manually
  remove(id: number) {
    const updated = this.toastsSubject.value.filter(t => t.id !== id);
    this.toastsSubject.next(updated);
  }
}
