import { Component, OnInit } from '@angular/core';
import { SharedCommonModule } from '../../shared/shared-common/shared-common.module';
import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AllApiService } from '../../services/all-api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-staff-task',
  imports: [SharedCommonModule, DragDropModule],
  templateUrl: './staff-task.component.html',
  styleUrl: './staff-task.component.scss',
})
export class StaffTaskComponent implements OnInit {
  userRole: string = '';
  userId: string = '';
  searchQuery = '';
  selectedType = '';
  selectedStaff = '';
  taskList: any[] = [];
  isOverdue(dueDate: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    return dueDate < today;
  }

  taskStats = [
    { TotalTasks: 0 },
    { ToDo: 0 },
    { InProgress: 0 },
    { Completed: 0 },
    { Overdue: 0 },
  ];

  // Helper methods to extract key and value dynamically
  getStatName(stat: any): string {
    return Object.keys(stat)[0];
  }

  getStatValue(stat: any): number {
    return Object.values(stat)[0] as number;
  }

  taskTypes = ['Follow Up', 'Counseling', 'Document Collection'];

  staffList: any = [

  ];


  todo: any = [];
  inProgress: any = [];

  completed: any = []

  submitted: any = []

  drop(event: any) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    const targetId = event.container.id;
    const isStaff = this.auth.isStaff();
    const isSuperAdmin = this.auth.isSuperAdmin();

    // STAFF Restrictions: Can only move TO Active or Done
    if (isStaff && targetId !== 'inProgress' && targetId !== 'completed') {
      this.notify.open('Staff can only move tasks to Active or Completed', '', { duration: 2000 });
      return;
    }

    // ADMIN/SUPER_ADMIN: No strict restrictions for basic board movement

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    const movedTask = event.container.data[event.currentIndex];
    let newStatus = '';
    if (targetId === 'todo') newStatus = 'Pending';
    else if (targetId === 'inProgress') newStatus = 'InProgress';
    else if (targetId === 'completed') newStatus = 'Completed';
    else if (targetId === 'submitted') newStatus = 'Submitted';

    if (newStatus) {
      this.api.changeTaskStatus(movedTask.id, newStatus).subscribe({
        next: (res) => {
          movedTask.status = newStatus;
          this.calculateStats(); // Update stats after status change
          this.notify.open(res.responseMessage, '', { duration: 1500 });
        },
        error: (err) => {
          transferArrayItem(event.container.data, event.previousContainer.data, event.currentIndex, event.previousIndex);
          this.calculateStats(); // Revert stats view if failed
          this.notify.open('Failed to update status', '', { duration: 2000 });
        }
      });
    }
    this.calculateStats(); // Immediate UI update for card counts
  }


  taskForm!: FormGroup;

  constructor(private fb: FormBuilder, private api: AllApiService, private notify: MatSnackBar, public auth: AuthService) {
    this.taskForm = this.fb.group({
      taskTitle: ['', Validators.required],
      description: ['', Validators.required],
      taskType: ['', Validators.required],
      priority: ['', Validators.required],
      staffName: [''],
      dueDate: ['', Validators.required],
      associatedLead: [''],
      userId: [''],
      status: [''],
      staffId: ['', Validators.required]
    });
  }
  allStaffList: any
  ngOnInit(): void {
    this.getAllTasks();
    this.getAllStaffsAndId();
    this.getTaskTypes();
  }

  getTaskTypes() {
    this.api.getAllDropDown().subscribe({
      next: (res) => {
        const taskTypeDrop = res.responseObject.find((d: any) => d.dropdownType === 'TaskType');
        if (taskTypeDrop && taskTypeDrop.values) {
          this.taskTypes = taskTypeDrop.values;
        }
      },
      error: (err) => console.log(err)
    });
  }

  getAllStaffsAndId() {
    this.api.getAllStaffAndIds().subscribe({
      next: (res) => {
        this.staffList = res.responseObject;
        console.log(this.staffList);
      },
      error: (err) => { console.log(err); },
    });
  }




  getAllTasks() {
    this.api.getAllTasks().subscribe({
      next: (res) => {
        let allTasks = res.responseObject;

        // If Staff, filter tasks to only show assigned to them
        if (this.auth.isStaff()) {
          const currentUserId = this.auth.getUserId();
          allTasks = allTasks.filter((t: any) => t.staffId === currentUserId);
        }

        this.taskList = allTasks;
        this.applyFilters();
      },
      error: (err) => console.log(err)
    })
  }

  applyFilters() {
    let filtered = [...this.taskList];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.taskTitle?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.associatedLead?.toLowerCase().includes(q)
      );
    }

    if (this.selectedType) {
      filtered = filtered.filter(t => t.taskType === this.selectedType);
    }

    if (this.selectedStaff) {
      filtered = filtered.filter(t => t.staffId === this.selectedStaff);
    }

    this.todo = filtered.filter((e: any) => e.status == 'Pending')
    this.inProgress = filtered.filter((e: any) => e.status == 'InProgress')
    this.completed = filtered.filter((e: any) => e.status == 'Completed')
    this.submitted = filtered.filter((e: any) => e.status == 'Submitted')

    this.calculateStats();
  }

  calculateStats() {
    const today = new Date().toISOString().split('T')[0];

    // Derive counts directly from the mapped column arrays for perfect synchronization
    const todoCount = this.todo.length;
    const inProgressCount = this.inProgress.length;
    const completedCount = this.completed.length;
    const archivedCount = this.submitted.length;

    this.taskStats = [
      { TotalTasks: todoCount + inProgressCount + completedCount + archivedCount },
      { ToDo: todoCount },
      { InProgress: inProgressCount },
      { Completed: completedCount },
      {
        Overdue: this.taskList.filter(t =>
          t.status !== 'Completed' &&
          t.status !== 'Submitted' &&
          this.isOverdue(t.dueDate)
        ).length
      }
    ];
  }

  isTaskModalOpen = false;
  isEditMode = false;
  currentEditingTaskId: any = null;

  openTaskModal(isEdit: boolean = false) {
    this.isEditMode = isEdit;
    this.isTaskModalOpen = true;
  }

  closeTaskModal() {
    this.isTaskModalOpen = false;
    this.taskForm.reset()
    this.taskForm.enable()
  }


  createTask() {
    if (this.taskForm.invalid) {
      this.notify.open('Please fill all required fields', '', { duration: 1500 });
      return;
    }
    const selectedStaff = this.staffList.find(
      (staff: any) => staff.id === this.taskForm.value.staffId
    );
    const taskData = this.taskForm.value;
    taskData.status = 'Pending'
    taskData.staffName = selectedStaff?.name ?? ''


    if (this.isEditMode && this.currentEditingTaskId) {
      // Logic for updating task if API supports it, otherwise we just notify for now
      // Assuming a patch or put endpoint exists or will be added.
      this.notify.open('Task update logic would trigger here', '', { duration: 1500 });
      this.closeTaskModal();
    } else {
      this.api.createTaskAndAssign(taskData).subscribe({
        next: (res) => {
          this.notify.open(res.responseMessage, '', { duration: 1500 });
          // this.getAllTasks();
          // this.getAllStaffsAndId();
          this.closeTaskModal();
          document.location.reload()
        },
        error: (err) => this.notify.open(err.error?.responseMessage || 'Error creating task', '', { duration: 1500 })
      });
    }
  }

  deleteTask(id: any, event: Event) {
    event.stopPropagation(); // Prevent card click
    if (confirm('Are you sure you want to delete this task?')) {
      // Assuming a delete endpoint exists. If not, we filter locally for demo.
      this.notify.open('Task marked for deletion', '', { duration: 1500 });
      // Local removal for immediate UI feedback
      this.taskList = this.taskList.filter(t => t.id !== id);
      this.applyFilters();
    }
  }

  editTask(task: any, event: Event) {
    event.stopPropagation();
    this.currentEditingTaskId = task.id;
    this.taskForm.patchValue(task);
    this.taskForm.enable();
    this.openTaskModal(true);
  }

  viewTask(task: any) {
    console.log('oo clikced');

    this.taskForm.patchValue(task)
    this.taskForm.disable()
    this.openTaskModal()
  }

}
