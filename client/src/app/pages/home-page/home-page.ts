import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { merge } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserInputSchedulingTable } from '../../shared/features/user-input-scheduling-table/user-input-scheduling-table';

@Component({
  selector: 'app-home-page',
  imports: [MatTab, MatTabGroup, MatFormFieldModule, MatInputModule, ReactiveFormsModule, UserInputSchedulingTable],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePage {
  matrixDimensions = new FormGroup({
    // this defines matrix width and will only take positive whole numbers
    numTimeSlots: new FormControl('', [Validators.required, Validators.pattern(/^[1-9]\d*$/)]),
    // this defines matrix height and will only take positive whole numbers
    numCandidates: new FormControl('', [Validators.required, Validators.pattern(/^[1-9]\d*$/)]),
  });
  numTimeSlotsErrorMessage = signal('');
  numCandidatesErrorMessage = signal('');


  constructor() {
    merge(
      this.matrixDimensions.get('numTimeSlots')!.statusChanges,
      this.matrixDimensions.get('numTimeSlots')!.valueChanges,
      this.matrixDimensions.get('numCandidates')!.statusChanges,
      this.matrixDimensions.get('numCandidates')!.valueChanges,
    )
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessage());
  }

  get numCandidatesValue(): number {
    const value = this.matrixDimensions.get('numCandidates')?.value;
    return value ? +value : 0;
  }

  get numTimeSlotsValue(): number {
    const value = this.matrixDimensions.get('numTimeSlots')?.value;
    return value ? +value : 0;
  }

  updateErrorMessage() {
    const timeSlotsCtrl = this.matrixDimensions.get('numTimeSlots');
    const candidatesCtrl = this.matrixDimensions.get('numCandidates');

    if (timeSlotsCtrl?.hasError('required')) {
      this.numTimeSlotsErrorMessage.set('You must enter a value');
    }
    else if (timeSlotsCtrl?.hasError('pattern')) {
      this.numTimeSlotsErrorMessage.set('You must enter a positive whole number');
    }
    else {
      this.numTimeSlotsErrorMessage.set('');
    }

    if (candidatesCtrl?.hasError('required')) {
      this.numCandidatesErrorMessage.set('You must enter a value');
    }
    else if (candidatesCtrl?.hasError('pattern')) {
      this.numCandidatesErrorMessage.set('You must enter a positive whole number');
    }
    else {
      this.numCandidatesErrorMessage.set('');
    }
  }

}
