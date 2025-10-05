import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserInputSchedulingTable } from './user-input-scheduling-table';

describe('UserInputSchedulingTable', () => {
  let component: UserInputSchedulingTable;
  let fixture: ComponentFixture<UserInputSchedulingTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserInputSchedulingTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserInputSchedulingTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
