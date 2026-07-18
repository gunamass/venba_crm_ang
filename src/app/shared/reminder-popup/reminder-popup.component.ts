// reminder-popup.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationReminderService } from '../../services/notification-reminder.service';

@Component({
  selector: 'app-reminder-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reminder-popup.component.html',
  styleUrl: './reminder-popup.component.scss'
})
export class ReminderPopupComponent {

  constructor(public reminderService: NotificationReminderService) { }

  onDismiss(id: string): void {
    this.reminderService.dismissReminder(id);
  }
}