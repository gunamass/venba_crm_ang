import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ActiveReminder {
  id: string;
  leadName: string;
  description: string;
  time: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationReminderService {

  private scheduledReminders = new Set<string>();

  // 👇 holds whatever reminders are currently "popped up" on screen
  private activeRemindersSubject = new BehaviorSubject<ActiveReminder[]>([]);
  activeReminders$ = this.activeRemindersSubject.asObservable();

  // 👇 single looping audio instance — shared across all active popups
  private audio: HTMLAudioElement | null = null;

  constructor() {
    this.setupAudioRetry();
  }

  // On EVERY user interaction (not just the first), if there's a
  // reminder audio currently paused because the browser blocked it,
  // try to resume it. This covers the case where the reminder fires
  // before the user has clicked anything that session — the very
  // next click/keypress anywhere on the page will resume the loop.
  private setupAudioRetry(): void {

    const tryResume = () => {
      if (this.audio && this.audio.paused) {
        this.audio.play().catch(() => {
          // still blocked, will retry on the next interaction
        });
      }
    };
    document.addEventListener('click', tryResume, { capture: true });
    document.addEventListener('keydown', tryResume, { capture: true });
    document.addEventListener('touchstart', tryResume, { capture: true });
    document.addEventListener('pointerdown', tryResume, { capture: true });
  }

  scheduleLeadReminders(leads: any[]): void {

    const now = new Date();

    leads.forEach((lead) => {

      lead.reminderLogs?.forEach((reminder: any) => {

        const reminderId = reminder.id;

        if (this.scheduledReminders.has(reminderId)) {
          return;
        }

        const [year, month, day] =
          reminder.reminderDate.split('-').map(Number);

        const [hours, minutes] =
          reminder.reminderTime.split(':').map(Number);

        const reminderDateTime = new Date(
          year, month - 1, day, hours, minutes, 0
        );

        const delay = reminderDateTime.getTime() - now.getTime();

        if (delay <= 0) {
          return;
        }

        this.scheduledReminders.add(reminderId);

        setTimeout(() => {
          this.triggerReminder(lead.fullName, reminder);
        }, delay);
      });
    });
  }

  private triggerReminder(leadName: string, reminder: any): void {

    const current = this.activeRemindersSubject.value;

    // avoid duplicate popup for the same reminder
    if (current.some(r => r.id === reminder.id)) {
      return;
    }

    this.activeRemindersSubject.next([
      ...current,
      {
        id: reminder.id,
        leadName,
        description: reminder.description,
        time: reminder.reminderTime
      }
    ]);

    this.startLoopingSound();
  }

  private startLoopingSound(): void {

    if (this.audio) {
      return; // already looping, don't stack multiple audios
    }

    this.audio = new Audio('/audio/notify.mp3');
    this.audio.loop = true;

    this.audio.play().catch(err => {
      console.log('Audio blocked for now — will retry on next click/keypress', err);
    });
  }

  private stopSound(): void {

    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
  }

  dismissReminder(id: string): void {

    const remaining = this.activeRemindersSubject.value.filter(r => r.id !== id);
    this.activeRemindersSubject.next(remaining);

    // only stop the sound once ALL popups are dismissed
    if (remaining.length === 0) {
      this.stopSound();
    }
  }
}