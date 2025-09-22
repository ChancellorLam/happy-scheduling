import { Component } from '@angular/core';
import { MatTabGroup, MatTab } from '@angular/material/tabs';

@Component({
  selector: 'app-home-page',
  imports: [MatTab, MatTabGroup],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css'
})
export class HomePage {

}
