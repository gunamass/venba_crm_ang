import { Component, OnInit } from '@angular/core';
import { SharedCommonModule } from '../../shared/shared-common/shared-common.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AllApiService } from '../../services/all-api.service';
import { BToastService } from '../../services/b-toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-lead',
  imports: [SharedCommonModule],
  templateUrl: './lead.component.html',
  styleUrl: './lead.component.scss',
})
export class LeadComponent implements OnInit {
  leads: any[] = [];
  filteredLeads: any[] = [];
  isModalOpen = false;

  isMailModalOpen = false

  searchTerm: string = '';
  statusFilter: string = '';
  courseFilter: string = '';

  statuses: string[] = [];
  courses: string[] = [];

  totalLead: any = 0;
  totalVisitedLead: any = 0;
  totalConvertedLead: any = 0;
  futureInterestedLead: any = 0;
  // courses: string[] = [];

  leadForm: FormGroup;
  activityLogForm: FormGroup;
  setReminderForm: FormGroup;

  // courses = [
  //   'Web Development',
  //   'Data Science',
  //   'UI/UX Design',
  //   'Frontend',
  //   'java backend',
  //   'video edit',
  //   'graphic',
  //   'digital marketing',
  // ];
  sources = [
    'Website',
    'Social Media',
    'Referral',
    'meta adds',
    'google adds',
    'youtube adds',
  ];
  counselors: any = ['John Doe', 'Jane Smith', 'David Johnson'];

  constructor(
    private fb: FormBuilder,
    private api: AllApiService,
    private toast: BToastService,
    public auth: AuthService
  ) {
    this.leadForm = this.fb.group({
      fullName: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      courseInterest: ['', Validators.required],
      source: ['', Validators.required],
      counselor: ['', Validators.required],
      notes: [''],

      stage: ['Fresh Lead'],
      createdAt: [new Date().toISOString()],
      updatedAt: [new Date().toISOString()],
      activityLog: this.fb.control([]),
      reminderLog: this.fb.control([]),
    });

    (this.activityLogForm = this.fb.group({
      type: [''],
      description: [''],
      logResult: [''],
      createdAt: [new Date().toISOString()],
    })),
      (this.setReminderForm = this.fb.group({
        type: [''],
        description: [''],
        reminderDate: [''],
        reminderTime: [''],
        createdAt: [new Date().toISOString()],
      }));
  }

  ngOnInit(): void {
    this.getAllLead();
    this.getAllStaffsAndId();
    this.getDropDowns();
  }

  getDropDowns() {
    this.api.getAllDropDown().subscribe({
      next: (res) => {
        const leadStatusDrop = res.responseObject.find((d: any) => d.dropdownType === 'leadStatus');
        if (leadStatusDrop && leadStatusDrop.values) {
          this.statuses = leadStatusDrop.values;
        }

        const courseDrop = res.responseObject.find((d: any) => d.dropdownType === 'course');
        if (courseDrop && courseDrop.values) {
          this.courses = courseDrop.values;
        }
      },
      error: (err) => console.log(err)
    });
  }

  counselorsMap: Map<string, string> = new Map();

  getAllStaffsAndId() {
    this.api.getAllStaffAndIds().subscribe({
      next: (res) => {
        this.counselors = res.responseObject
        // Build a map of ID -> Name for quick lookup
        this.counselorsMap.clear();
        this.counselors.forEach((counselor: any) => {
          this.counselorsMap.set(counselor.id, counselor.name || counselor.username);
        });
      },
      error: (err) => { console.log(err) },
    })
  }

  getCounselorName(counselorId: string): string {
    return this.counselorsMap.get(counselorId) || counselorId || 'N/A';
  }

  onSubmit() {
    if (this.leadForm.valid) {
      this.leadForm.patchValue({
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stage: 'Need to connect',
        activityLog: this.leadForm.value.activityLog || [],
        reminderLog: this.leadForm.value.reminderLog || [],
      });

      this.api.createLead(this.leadForm.value).subscribe(
        (res) => {
          this.toast.show({ message: 'added successfully', type: 'success', animation: 'bounce' });
          this.isModalOpen = false;
          this.getAllLead();
          this.closeModal();

        },
        (err) => this.toast.show({ message: `${err.error.responseMessage}`, type: 'warn', animation: 'bounce' })
      );
    } else {
      this.toast.show({ message: 'FILL ALL with VALID DATA like (mail, Ph no)', type: 'warn', animation: 'bounce' });
    }
  }

  getAllLead() {
    this.api.getAllLead().subscribe(
      (res) => {
        // console.log(res);
        this.leads = res.responseObject;
        this.totalLead = res.responseObject.length;
        this.filteredLeads = this.leads;
        this.totalVisitedLead = this.leads.filter(
          (el) => el.stage === 'Visiting'
        ).length;
        this.totalConvertedLead = this.leads.filter(
          (el) => el.stage === 'Converted'
        ).length;
        this.futureInterestedLead = this.leads.filter(
          (el) => el.stage === 'Interested in Future'
        ).length;
      },
      (err) => console.log(err)
    );
  }

  applyFilters(): void {
    // console.log(this.searchTerm, this.leads);

    if (this.searchTerm == '') {
      this.leads = this.filteredLeads;
    } else {
      this.leads = this.leads.filter((lead) => {
        const matchesSearch =
          lead.fullName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          lead.phoneNumber.includes(this.searchTerm);

        const matchesStatus = this.statusFilter
          ? lead.status === this.statusFilter
          : true;
        const matchesCourse = this.courseFilter
          ? lead.course === this.courseFilter
          : true;

        return matchesSearch && matchesStatus && matchesCourse;
      });
    }
  }

  statusFilters() {
    this.leads = this.filteredLeads;

    if (this.statusFilter) {
      this.leads = this.leads.filter((lead) => {
        const matchesStatus = this.statusFilter
          ? lead.stage === this.statusFilter
          : true;
        return matchesStatus;
      });
    }
  }

  courseFilters() {
    this.leads = this.filteredLeads;

    if (this.courseFilter) {
      this.leads = this.leads.filter((lead) => {
        const matchesCourse = this.courseFilter
          ? lead.courseInterest === this.courseFilter
          : true;

        return matchesCourse;
      });
    }
  }

  resetFilters(): void {
    // console.log('dd', this.filteredLeads, this.leads);

    this.searchTerm = '';
    this.statusFilter = '';
    this.courseFilter = '';
    this.leads = [...this.filteredLeads];
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.leadForm.reset();
    // console.log(this.isModalOpen);
  }

  getBadgeClass(status: string): string {
    switch (status) {
      case 'Converted':
        return 'bg-success';
      case 'Pending':
        return 'bg-warning text-dark';
      case 'Lost':
        return 'bg-danger';
      case 'In Progress':
        return 'bg-info text-dark';
      default:
        return 'bg-secondary';
    }
  }

  //view leads
  selectedLead: any = null;
  isDetailsModalOpen = false;

  openDetailsModal(lead: any) {
    this.selectedLead = lead;
    this.isDetailsModalOpen = true;
  }

  closeDetailsModal() {
    this.isDetailsModalOpen = false;
    this.selectedLead = null;
  }

  updateStage(lead: any) {
    // console.log(this.selectedLead.stage);

    this.api
      .updateLeadStage(lead.id, this.selectedLead.stage)
      .subscribe(() => {
        this.toast.show({ message: 'Stage updated', type: 'success', animation: 'bounce' });
        this.closeDetailsModal();
        this.getAllLead();
      });
  }

  isLogEditModal = false;
  openLogEditModal(lead: any) {
    this.selectedLead = lead;
    this.isLogEditModal = true;
  }
  closeLogEditModal() {
    this.isLogEditModal = false;
    this.selectedLead = null;
    this.setReminderForm.reset();
    this.activityLogForm.reset();
  }

  createLog(lead: any) {
    const newLog = {
      ...this.activityLogForm.value,
    };

    this.api.updateLeadActLog(this.selectedLead.id, newLog).subscribe(() => {
      this.toast.show({ message: 'Activity log added', type: 'success', animation: 'bounce' });

      this.getAllLead(); // refresh list
      this.activityLogForm.reset();
      this.isLogEditModal = false;
    });
  }
  setReminder(lead: any) {
    const formValue = this.setReminderForm.value;

    const newReminder = {
      type: formValue.type,
      description: formValue.description,
      reminderDate: formValue.reminderDate,
      reminderTime: formValue.reminderTime,
    };

    this.api
      .updateLeadRimLog(this.selectedLead.id, newReminder)
      .subscribe(() => {
        this.toast.show({ message: 'Reminder added', type: 'success', animation: 'bounce' });

        this.getAllLead(); // refresh
        this.setReminderForm.reset();
        this.isLogEditModal = false;
      });
  }


  closeMailModal() {
    this.isMailModalOpen = !this.isMailModalOpen
  }

  openMailModal(s: any) {
    this.mailData.receiver = s
    this.closeMailModal()
    console.log(this.mailData);

  }

  mailData = {
    receiver: "",
    message: "",
    subject: ''
  };

  sendMailToClient() {
    if (!this.mailData.message && !this.mailData.receiver && !this.mailData.subject) return this.toast.show({ type: 'warn', message: 'Compose a mail!' })

    this.api.sendMailToClient(this.mailData).subscribe({
      next: (res) => {
        this.closeMailModal();
        this.mailData = { receiver: "", message: "", subject: '' };
        this.toast.show({ type: 'success', message: 'Mail Sent Successfully!' })
      },
      error: (err) => {
        this.toast.show({ type: 'error', message: 'Error sending mail!' })
        console.error(err);
      }
    });
  }

  exportToExcel() {
    const data = this.leads;
    if (!data || data.length === 0) return;

    const headers = ['Full Name', 'Phone Number', 'Email', 'Course Interest', 'Source', 'Counselor', 'Stage', 'Created At'];
    const rows = data.map(l => [
      l.fullName,
      l.phoneNumber,
      l.email,
      l.courseInterest,
      l.source,
      l.counselor,
      l.stage,
      l.createdAt
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


}
