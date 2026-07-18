import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { SharedCommonModule } from '../../shared/shared-common/shared-common.module';
import { AllApiService } from '../../services/all-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChartData, ChartOptions } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SharedCommonModule, NgChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  isBrowser = false;

  stats = [
    {
      title: 'Total Leads',
      value: 0,
      subText: '+12% from last month',
      colorClass: 'text-dark',
      icon: 'group',
    },
    {
      title: 'Students Enrolled',
      value: 0,
      subText: 'Active students',
      colorClass: 'text-dark',
      icon: 'school',
    },
    {
      title: 'Fees Collected',
      value: '₹0',
      subText: 'This month: ₹0',
      colorClass: 'text-success',
      icon: 'attach_money',
    },
    {
      title: 'Fees Due',
      value: '₹0',
      subText: 'Outstanding amount',
      colorClass: 'text-danger',
      icon: 'error_outline',
    },
  ];

  // Dummy charts
  leadStageData: ChartData<'pie'> = {
    labels: ['Need to Connect', 'Confirmed Joining', 'In Progress'],
    datasets: [
      {
        data: [3, 5, 2],
        backgroundColor: ['#8e7cc3', '#42a5f5', '#34a853'],
      },
    ],
  };

  studentCourseData: ChartData<'doughnut'> = {
    labels: ['Web Dev', 'Data Science', 'UI/UX'],
    datasets: [
      {
        data: [4, 2, 3],
        backgroundColor: ['#26a69a', '#ab47bc', '#ffa726'],
      },
    ],
  };

  feeBarData: ChartData<'bar'> = {
    labels: ['UPI', 'Cash', 'Card'],
    datasets: [
      {
        label: 'Payments',
        data: [13000, 9000, 5000],
        backgroundColor: ['#7cb342', '#42a5f5', '#ef5350'],
      },
    ],
  };

  chartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: { enabled: true },
    },
  };

  constructor(
    private api: AllApiService,
    private noti: MatSnackBar,
    public auth: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.getDashboardData();
    }
  }

  getDashboardData() {
    this.api.getDashboardData().subscribe({
      next: (res) => {
        const data = res.responseObject;
        if (!data) return;

        // 1. Update Stats
        this.stats[0].value = data.leadDashBoardDTOS?.length || 0;
        this.stats[1].value = data.studentDashBoardDTOS?.length || 0;
        this.stats[2].value = `₹${(data.feeCollection?.collectionAmount / 1000).toFixed(1)}K`;
        this.stats[3].value = `₹${(data.feeCollection?.totalDueAmount / 1000).toFixed(1)}K`;

        // 2. Process Lead Stages for Pie Chart
        this.processLeadStages(data.leadDashBoardDTOS);

        // 3. Process Student Courses for Doughnut Chart
        this.processStudentCourses(data.studentDashBoardDTOS);

        // 4. Process Finance for Bar Chart
        this.processFinance(data.feeCollection);
      },
      error: () => this.noti.open('Error loading dashboard data', '', { duration: 1500 }),
    });
  }

  processLeadStages(leads: any[]) {
    if (!leads || !leads.length) return;
    const stages: { [key: string]: number } = {};
    leads.forEach(l => {
      const stage = l.stage || 'New';
      stages[stage] = (stages[stage] || 0) + 1;
    });

    this.leadStageData = {
      labels: Object.keys(stages),
      datasets: [{
        data: Object.values(stages),
        backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'],
        borderWidth: 0,
        hoverOffset: 15
      }]
    };
  }

  processStudentCourses(students: any[]) {
    if (!students || !students.length) return;
    const courses: { [key: string]: number } = {};
    students.forEach(s => {
      const course = s.course || 'Unassigned';
      courses[course] = (courses[course] || 0) + 1;
    });

    this.studentCourseData = {
      labels: Object.keys(courses),
      datasets: [{
        data: Object.values(courses),
        backgroundColor: ['#f43f5e', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#6366f1'],
        borderWidth: 0,
        hoverOffset: 15
      }]
    };
  }

  processFinance(finance: any) {
    if (!finance) return;
    this.feeBarData = {
      labels: ['Collection', 'Outstanding'],
      datasets: [
        {
          label: 'Amount (₹)',
          data: [finance.collectionAmount || 0, finance.totalDueAmount || 0],
          backgroundColor: ['#10b981', '#ef4444'],
          borderRadius: 8,
          barThickness: 40
        }
      ]
    };
  }
}
