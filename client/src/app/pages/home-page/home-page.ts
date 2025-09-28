import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-home-page',
  imports: [MatTab, MatTabGroup, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePage {
  matrixDimensions = new FormGroup({
    numTimeSlots: new FormControl(''), // define matrix width
    numCandidates: new FormControl(''), // define matrix height
  });


}
