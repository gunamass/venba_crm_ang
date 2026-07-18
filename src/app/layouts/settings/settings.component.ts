import { Component, OnInit } from '@angular/core';
import { AllApiService } from '../../services/all-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { SharedCommonModule } from '../../shared/shared-common/shared-common.module';
import { MatDialog } from '@angular/material/dialog';
import { EditDropdownComponent } from './edit-dropdown.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  imports: [SharedCommonModule]
})
export class SettingsComponent implements OnInit {
  form!: FormGroup;
  selectedType: string = '';
  allDropDown: any = [];
  selectedDropdown: any;
  isLoading: boolean = false;

  constructor(
    private api: AllApiService,
    private noti: MatSnackBar,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {

  }

  ngOnInit() {
    this.form = this.fb.group({
      items: this.fb.array([this.fb.control('', Validators.required)])
    });
    this.getAllDrop()
  }

  getAllDrop() {
    this.isLoading = true;
    this.api.getAllDropDown().subscribe({
      next: (res) => {
        this.allDropDown = res.responseObject;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.noti.open(`${err.error.message}`, 'close', { duration: 1500 });
      }
    });
  }

  get items() {
    return this.form.get('items') as FormArray;
  }

  addItem() {
    this.items.push(new FormControl('', Validators.required));
  }

  removeItem(index: number) {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  change(event: Event) {
    this.selectedType = (event.target as HTMLSelectElement).value;
    this.selectedDropdown = this.allDropDown.find((d: any) => d.dropdownType === this.selectedType);

    this.items.clear();
    if (this.selectedDropdown) {
      this.selectedDropdown.values.forEach((val: string) => {
        this.items.push(this.fb.control(val, Validators.required));
      });
    } else {
      this.addItem();
    }
  }

  createDrop(): any {
    let payLoad;
    if (!this.selectedType) return this.noti.open('Please select a dropdown type', '', { duration: 1500 });
    if (this.form.invalid) return this.noti.open('fill all', '', { duration: 1500 });

    if (this.selectedDropdown && this.selectedDropdown.id) {
      payLoad = {
        id: this.selectedDropdown.id,
        dropdownType: this.selectedType,
        values: this.form.value.items
      };
      this.api.updateDropDown(payLoad).subscribe({
        next: (res) => {
          this.noti.open(`${'updated'}`, 'close', { duration: 1500 });
          this.getAllDrop();
        },
        error: (err) => this.noti.open(`${err.error.message}`, 'close', { duration: 1500 })
      });
    } else {
      payLoad = {
        dropdownType: this.selectedType,
        values: this.form.value.items
      };
      this.api.createDropDown(payLoad).subscribe({
        next: (res) => {
          this.noti.open(`${'created'}`, 'close', { duration: 1500 });
          this.getAllDrop();
        },
        error: (err) => this.noti.open(`${err.error.message}`, 'close', { duration: 1500 })
      });
    }
  }

  editItem(item: any): void {
    const dialogRef = this.dialog.open(EditDropdownComponent, {
      width: '400px',
      data: item
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.getAllDrop();
      }
    });
  }
}
