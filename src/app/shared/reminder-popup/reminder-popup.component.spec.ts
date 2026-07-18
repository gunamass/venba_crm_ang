import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReminderPopupComponent } from './reminder-popup.component';

describe('ReminderPopupComponent', () => {
  let component: ReminderPopupComponent;
  let fixture: ComponentFixture<ReminderPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReminderPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReminderPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
