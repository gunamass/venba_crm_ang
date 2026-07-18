import { Component, OnInit } from '@angular/core';
import { SharedCommonModule } from '../../shared/shared-common/shared-common.module';
import { NotificationsComponent } from "../notifications/notifications.component";
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { AllApiService } from '../../services/all-api.service';
import { PermissionService } from '../../services/permission.service';
import { NotificationReminderService } from '../../services/notification-reminder.service';
import { ReminderPopupComponent } from "../../shared/reminder-popup/reminder-popup.component";

@Component({
  selector: 'app-main-layout',
  imports: [SharedCommonModule, NotificationsComponent, ReminderPopupComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent implements OnInit {
  username: string = '';
  roleTitle: string = '';
  notiCount: any

  constructor(
    public auth: AuthService,
    private storage: StorageService,
    private api: AllApiService,
    private permission: PermissionService,
    private notificationReminderService: NotificationReminderService
  ) { }

  ngOnInit() {
    if (typeof localStorage !== "undefined") {
      const userStr = localStorage.getItem("currentUser");
      const user = userStr ? JSON.parse(userStr) : null;
      this.username = user?.username || this.auth.getUsername() || "User";
      this.roleTitle = user?.role || this.auth.getRole() || "Member";
    } else {
      this.username = this.auth.getUsername() || "User";
      this.roleTitle = this.auth.getRole() || "Member";
    }
    this.getCountNotification();
  }

  menuItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard', badge: 0 },
    { label: 'Leads', icon: 'group', route: '/admin/lead', badge: 0 },
    {
      label: 'Staff',
      icon: 'supervisor_account',
      route: '/admin/staff',
      badge: null,
    },
    { label: 'Students', icon: 'school', route: '/admin/students', badge: 0 },
    { label: 'Login Manage', icon: 'shield', route: '/admin/user-management', badge: 0 },
    {
      label: 'Student Attendance',
      icon: 'event_available',
      route: '/admin/students-attendance',
      badge: null,
    },
    { label: 'Fees', icon: 'payments', route: '/admin/fees', badge: '₹0K' },
    { label: 'Tasks', icon: 'assignment', route: '/admin/staff-task', badge: 0 },
    { label: 'Reports', icon: 'bar_chart', route: '/admin/reports', badge: null },
    { label: 'logout', icon: 'logout', route: null, badge: '', isLogout: true },
  ];

  get filteredMenuItems() {
    return this.menuItems.filter((item) => {
      // always allow logout
      if (item.isLogout || item.route === '/' || item.route === '') return true;
      // admin bypass
      if (this.auth.isAdmin()) return true;
      // derive module key from route like '/admin/lead' -> '/lead'
      const parts = (item.route || '').split('/').filter(Boolean);
      let moduleKey = '/';
      if (parts.length >= 2 && parts[0].toLowerCase() === 'admin') moduleKey = `/${parts[1]}`;
      else if (parts.length >= 1) moduleKey = `/${parts[0]}`;

      return this.permission.hasRoute(moduleKey);
    });
  }

  logout() {
    this.auth.logOut();
  }

  today: any = new Date();

  notificationsOpen: any = false;

  openNotifications() {
    this.notificationsOpen = true;
  }

  closeNotifications() {
    this.notificationsOpen = false;
  }

  getCountNotification() {
    this.api.getAllNotification().subscribe(response => {

      this.notiCount =
        response.responseObject.task.length +
        response.responseObject.lead.length +
        response.responseObject.studentAttendance.length +
        response.responseObject.studentDueDays.length;
      const leads = response.responseObject.lead;

      this.notificationReminderService
        .scheduleLeadReminders(leads);
    });
  }

}
