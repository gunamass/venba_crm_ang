import { TestBed } from '@angular/core/testing';

import { NotificationReminderService } from './notification-reminder.service';

describe('NotificationReminderService', () => {
  let service: NotificationReminderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationReminderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
