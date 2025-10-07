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
  rows = input<number>(0);
  columns = input<number>(0);

  // outputs
  readonly schedulingTableSubmit = output<SchedulingTableInfo>();

  // component state
  readonly timeSlots = signal<string[]>([]);
  readonly candidates = signal<string[]>([]);
  readonly candidatesTimeSlotRankings = signal<(string | number)[][]>([]);
  invalidSubmission = false;

  // effect for syncing table size, preserving values when expanding and retaining as much as possible when shrinking
  syncTableSizeEffect = effect(() => {
    const m = this.rows();
    const n = this.columns();

    this.timeSlots.update((slots) =>
      Array.from({ length: n }, (_, i) => slots[i] ?? '')
    );

    this.candidates.update((candidates) =>
      Array.from({ length: m }, (_, i) => candidates[i] ?? '')
    );

    this.candidatesTimeSlotRankings.update((ranks) =>
      Array.from({ length: m }, (_, i) => {
        const row = ranks[i] ?? [];
        return Array.from({ length: n }, (_, j) => row[j] ?? '');
      })
    );
  });

  updateTimeSlot(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = input?.value ?? '';

    this.timeSlots.update(slots => {
      const copy = [...slots];
      copy[index] = newValue;
      return copy;
    });

    console.log(this.timeSlots());
  }

  updateCandidate(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = input?.value ?? '';

    this.candidates.update(candidate => {
      const copy = [...candidate];
      copy[index] = newValue;
      return copy;
    });

    console.log(this.candidates());
  }

  updateCandidateTimeSlotRankings(rowIndex: number, columnIndex: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newValue = input?.value ?? '';

    this.candidatesTimeSlotRankings.update(ranking => {
      return ranking.map((row, rIndex) => {
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

  generateTooltip(candidateIndex: number, timeSlotIndex: number): string {
    const candidate = this.candidates()[candidateIndex];
    const timeSlot = this.timeSlots()[timeSlotIndex];

    const candidateName = candidate || `Candidate #${candidateIndex}`;
    const timeSlotName = timeSlot || `Time Slot #${timeSlotIndex}`;

    return `${candidateName}'s ranking for ${timeSlotName}`;
  }

  submitRankings(): void {
    console.log('onSubmit called')
    if (!this.allRankingsValid()) {
      this.invalidSubmission = true;
      return;
    }

    this.invalidSubmission = false;

    this.timeSlots.update(slot =>
      slot.map((slot, i) => this.labelEmptySlot(slot, i))
    );
    this.candidates.update(candidate =>
      candidate.map((candidate, i) => this.labelEmptyCandidate(candidate, i))
    );

    console.log({
      timeSlots: this.timeSlots(),
      candidates: this.candidates(),
      candidatesTimeSlotRankings: this.candidatesTimeSlotRankings().map(row =>
        row.map(rankingValue => Number(rankingValue))
      )
    });

    this.schedulingTableSubmit.emit({
      timeSlots: this.timeSlots(),
      candidates: this.candidates(),
      candidatesTimeSlotRankings: this.candidatesTimeSlotRankings().map(row =>
        row.map(rankingValue => Number(rankingValue))
      )
    });

    console.log('onSubmit success');
  }

  clearAll(): void {
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

  rankingValid(value: unknown): boolean {
    if (value === null || value === undefined || value === '') {
      return false;
    }

    const numValue = Number(value);

    return !isNaN(numValue) && numValue >= 1;
  }

  allRankingsValid(): boolean {
    return this.candidatesTimeSlotRankings().every(row => row.every(cell => this.rankingValid(cell)));
  }

  labelEmptySlot(slot: string, index: number): string {
    return slot.trim() === '' ? `Time Slot #${index}` : slot;
  }

  labelEmptyCandidate(candidate: string, index: number): string {
    return candidate.trim() === '' ? `Candidate #${index}` : candidate;
  }

}
