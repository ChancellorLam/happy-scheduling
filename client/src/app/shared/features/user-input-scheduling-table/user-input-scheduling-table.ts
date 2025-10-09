import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { SchedulingTableInfo } from '../../models/scheduling-table-info';

@Component({
  selector: 'app-user-input-scheduling-table',
  imports: [MatInputModule, MatFormFieldModule, MatTooltipModule, MatButtonModule],
  templateUrl: './user-input-scheduling-table.html',
  styleUrl: './user-input-scheduling-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserInputSchedulingTable {
  // inputs
  public rows = input<number>(0);
  public columns = input<number>(0);
  public multipleAssignmentsPerTimeSlot = input<boolean>(false);

  // outputs
  public readonly schedulingTableSubmit = output<SchedulingTableInfo>();

  // component state
  public readonly timeSlots = signal<string[]>([]);
  public readonly assignmentsPerTimeSlot = signal<string[]>([]);
  public readonly candidates = signal<string[]>([]);
  public readonly candidatesTimeSlotRankings = signal<(string | number)[][]>([]);
  public invalidTimeSlotAssignment = signal<boolean>(false);
  public invalidRanking = signal<boolean>(false);
  public candidatesExceedAssignments = signal<boolean>(false);

  // effect for syncing table size
  syncTableSizeEffect = effect(() => {
    const m = this.rows();
    const n = this.columns();

    this.timeSlots.update((times) =>
      Array.from({ length: n }, (_, i) => times[i] ?? '')
    );

    this.candidates.update((candidates) =>
      Array.from({ length: m }, (_, i) => candidates[i] ?? '')
    );

    this.assignmentsPerTimeSlot.update((assignments) =>
      Array.from({ length: n }, (_, i) => assignments[i] ?? '')
    );

    this.candidatesTimeSlotRankings.update((rankings) =>
      Array.from({ length: m }, (_, i) => {
        const row = rankings[i] ?? [];
        return Array.from({ length: n }, (_, j) => row[j] ?? '');
      })
    );
  });

  public updateTimeSlot(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = input?.value ?? '';

    this.timeSlots.update(times => {
      const copy = [...times];
      copy[index] = newValue;
      return copy;
    });

    console.log(this.timeSlots());
  }

  public updateAssignmentsPerTimeSlot(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = input?.value ?? '';

    this.assignmentsPerTimeSlot.update(assignments => {
      const copy = [...assignments];
      copy[index] = newValue;
      return copy;
    });

    console.log(this.assignmentsPerTimeSlot());
  }

  public updateCandidate(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = input?.value ?? '';

    this.candidates.update(candidate => {
      const copy = [...candidate];
      copy[index] = newValue;
      return copy;
    });

    console.log(this.candidates());
  }

  public updateCandidateTimeSlotRankings(rowIndex: number, columnIndex: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = input?.value ?? '';

    this.candidatesTimeSlotRankings.update(rankings => {
      return rankings.map((row, rIndex) => {
        if (rIndex === rowIndex) {
          const updatedRow = [...row];
          updatedRow[columnIndex] = newValue;
          return updatedRow;
        }
        return row;
      });
    });

    console.log(this.candidatesTimeSlotRankings());
  }

  public generateTooltip(candidateIndex: number, timeSlotIndex: number): string {
    const candidate = this.candidates()[candidateIndex];
    const timeSlot = this.timeSlots()[timeSlotIndex];

    const candidateName = candidate || `Candidate #${candidateIndex}`;
    const timeSlotName = timeSlot || `Time #${timeSlotIndex}`;

    return `${candidateName}'s ranking for ${timeSlotName}`;
  }

  public generateAssignmentsPerTimeSlotsLabel(timeSlotIndex: number): string {
    if (this.timeSlots()[timeSlotIndex] === '') {
      return `# Slots for Time #${timeSlotIndex}`;
    }

    return `# of Slots for ${this.timeSlots()[timeSlotIndex]}`;
  }

  public submitSchedulingTable(): void {
    console.log('onSubmit called')
    this.candidatesExceedAssignments.set(false);

    if (this.schedulingTableValid()) {
      return;
    }

    this.initializeAssignmentsIfDefault();

    if(this.moreCandidatesThanTotalAssignments()) {
      return;
    }

    this.labelEmptyTimesAndCandidates();

    console.log({
      timeSlots: this.timeSlots(),
      assignmentsPerTimeSlot: this.assignmentsPerTimeSlot().map(assignment => Number(assignment)),
      candidates: this.candidates(),
      candidatesTimeSlotRankings: this.candidatesTimeSlotRankings().map(row =>
        row.map(rankingValue => Number(rankingValue))
      )
    });

    this.schedulingTableSubmit.emit({
      timeSlots: this.timeSlots(),
      assignmentsPerTimeSlot: this.assignmentsPerTimeSlot().map(assignment => Number(assignment)),
      candidates: this.candidates(),
      candidatesTimeSlotRankings: this.candidatesTimeSlotRankings().map(row =>
        row.map(rankingValue => Number(rankingValue))
      )
    });

    console.log('onSubmit success');
  }

  public clearAll(): void {
    const m = this.rows();
    const n = this.columns();

    this.timeSlots.set(Array(n).fill(''));
    this.candidates.set(Array(m).fill(''));
    this.candidatesTimeSlotRankings.set(Array.from({ length: m }, () => Array(n).fill('')));

    console.log({
      timeSlots: this.timeSlots(),
      candidates: this.candidates(),
      candidatesTimeSlotRankings: this.candidatesTimeSlotRankings().map(row =>
        row.map(rankingValue => rankingValue ?? 0)
      )
    });
  }

  private schedulingTableValid(): boolean {
    this.invalidRanking.set( !this.allRankingsValid() );
    this.invalidTimeSlotAssignment.set( this.multipleAssignmentsPerTimeSlot() && !this.assignmentsPerTimeSlotValid() );

    return !(this.invalidRanking || this.invalidTimeSlotAssignment)
  }

  private initializeAssignmentsIfDefault(): void {
    if (!this.multipleAssignmentsPerTimeSlot()) {
      this.assignmentsPerTimeSlot.update(assignments => assignments.map(() => "1"));
    }
  }

  private moreCandidatesThanTotalAssignments(): boolean {
    const numCandidates = this.candidates().length;
    const totalNumAssignments = this.assignmentsPerTimeSlot()
      .map(Number)
      .reduce((sum, n) => sum + n, 0);

    if (numCandidates > totalNumAssignments) {
      this.candidatesExceedAssignments.set(true);
      console.log(this.candidatesExceedAssignments());
      return true;
    }

    return false;
  }

  private labelEmptyTimesAndCandidates(): void {
    this.timeSlots.update(times =>
      times.map((time, i) => this.labelEmptyTime(time, i))
    );
    this.candidates.update(candidate =>
      candidate.map((candidate, i) => this.labelEmptyCandidate(candidate, i))
    );
  }

  private allRankingsValid(): boolean {
    return this.candidatesTimeSlotRankings().every(row =>
      row.every(cell => this.rankingValid(cell)));
  }

  private assignmentsPerTimeSlotValid(): boolean {
    return this.assignmentsPerTimeSlot().every(assignment => this.assignmentValid(assignment));
  }

  private rankingValid(value: unknown): boolean {
    if (value === null || value === undefined || value === '') {
      return false;
    }

    const numValue = Number(value);

    return !isNaN(numValue) && numValue >= 1;
  }

  private assignmentValid(value: unknown): boolean {
    if (value === null || value === undefined || value === '') {
      return false;
    }

    const numValue = Number(value);

    return Number.isInteger(numValue) && numValue >= 1;
  }

  private labelEmptyTime(time: string, index: number): string {
    return time.trim() === '' ? `Time #${index}` : time;
  }

  private labelEmptyCandidate(candidate: string, index: number): string {
    return candidate.trim() === '' ? `Candidate #${index}` : candidate;
  }

}
