import { Component, OnInit } from '@angular/core';
import { AllApiService } from '../../services/all-api.service';
import { SharedCommonModule } from '../../shared/shared-common/shared-common.module';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
  imports: [SharedCommonModule]
})
export class NotificationsComponent implements OnInit {
  notifications: any;
  loading: boolean = true;

  constructor(private api: AllApiService) { }

  ngOnInit() {
    this.api.getAllNotification().subscribe(res => {
      this.notifications = res.responseObject || {};
      this.loading = false;
    });
  }

}