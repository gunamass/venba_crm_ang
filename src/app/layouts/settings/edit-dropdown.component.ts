import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SharedCommonModule } from '../../shared/shared-common/shared-common.module';
import { AllApiService } from '../../services/all-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-edit-dropdown',
  templateUrl: './edit-dropdown.component.html',
  styleUrls: ['./edit-dropdown.component.css'],
  standalone: true,
  imports: [SharedCommonModule]
})
export class EditDropdownComponent implements OnInit {
  form!: FormGroup;
  selectedType: string = '';

  constructor(
    public dialogRef: MatDialogRef<EditDropdownComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private api: AllApiService,
    private noti: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      items: this.fb.array([])
    });

    if (this.data && this.data.values) {
      this.data.values.forEach((val: string) => {
        this.items.push(this.fb.control(val, Validators.required));
      });
    } else {
      this.addItem();
    }
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

  onSave(): void {
    if (this.form.valid) {
      const updatedValues = this.form.value.items;
      const payload = {
        id: this.data.id,
        dropdownType: this.data.dropdownType,
        values: updatedValues
      };
      this.api.updateDropDown(payload).subscribe({
        next: (res) => {
          this.noti.open('Dropdown updated successfully', 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.noti.open(err.error.message || 'Error updating dropdown', 'Close', { duration: 3000 });
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
