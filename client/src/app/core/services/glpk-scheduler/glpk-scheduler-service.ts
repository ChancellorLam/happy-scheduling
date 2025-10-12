import { Injectable } from '@angular/core';
import type { GLPK } from 'glpk.js';
import { SchedulingTableInfo } from '../../../shared/models/scheduling-table-info';
import { CandidateAssignment } from '../../../shared/models/candidate-assignment';

@Injectable({
  providedIn: 'root'
})
export class GlpkSchedulerService {
  private glpkInstance: GLPK | null = null;

  // Lazily load GLPK WebAssembly for browser use
  private async loadGlpk(): Promise<GLPK> {
    if (this.glpkInstance) {
      return this.glpkInstance;
    }

    const { default: glpkfactory } = await import('glpk.js');
    this.glpkInstance = await glpkfactory(); // initialize WASM build
    return this.glpkInstance;
  }

  async computeOptimalSchedule(schedulingTable: SchedulingTableInfo) {
    const glpk = await this.loadGlpk();

    // initialize variables
    const numTimeSlots = schedulingTable.timeSlots.length;
    const numCandidates = schedulingTable.candidates.length;
    const numPref = numCandidates * numTimeSlots;

    const c = schedulingTable.candidatesTimeSlotRankings.flat();

    const b = [
      ...Array(numCandidates).fill(1),
      ...schedulingTable.assignmentsPerTimeSlot
    ];

    const lowerBound = Array(numPref).fill(0);
    const upperBound = Array(numPref).fill(1);

    const varType = 'I'.repeat(numPref);
    const cType = 'S'.repeat(numCandidates) + 'U'.repeat(numTimeSlots);

    const msglev = 3;

    // setup constraint matrix
    const A: number[][] = Array.from({ length: numCandidates + numTimeSlots }, () =>
      Array(numPref).fill(0)
    );

    for (let i = 0; i < numCandidates; i++) {
      for (let j = 0; j < numTimeSlots; j++) {
        const varIndex = i * numTimeSlots + j;
        A[i][varIndex] = 1;
      }
    }

    for (let j = 0; j < numTimeSlots; j++) {
      for (let i = 0; i < numCandidates; i++) {
        const varIndex = i * numTimeSlots + j;
        A[numCandidates + j][varIndex] = 1;
      }
    }

    // run minimization integer program
    const result = await glpk.solve({
      name: 'Schedule',
      objective: {
        direction: glpk.GLP_MIN,
        name: 'total_rankings',
        vars: c.map((coef, i) => ({ name: `x${i}`, coef })),
      },
      subjectTo: A.map((row, i) => ({
        name: `constraint_${i}`,
        vars: row.map((coef, j) => ({ name: `x${j}`, coef })),
        bnds: {
          type: cType[i] === 'S' ? glpk.GLP_FX : glpk.GLP_UP,
          ub: b[i],
          lb: cType[i] === 'S' ? b[i] : 0,
        },
      })),
      bounds: lowerBound.map((lbVal, i) => ({
        name: `x${i}`,
        type: glpk.GLP_DB,
        lb: lbVal,
        ub: upperBound[i],
      })),
      generals: varType
        .split('')
        .map((v, i) => (v === 'I' ? `x${i}` : null))
        .filter((v): v is string => !!v),
    }, { msglev });


    // return array of CandidateAssignments objects
    const optimalAssignments: CandidateAssignment[] = [];

    for (let i = 0; i < numCandidates; i++) {
      const assignedIndex = Array.from({ length: numTimeSlots }).findIndex((_, j) => {
        const varIndex = i * numTimeSlots + j;
        return result.result.vars[`x${varIndex}`] === 1;
      });

      if (assignedIndex !== -1) {
        optimalAssignments.push({
          candidate: schedulingTable.candidates[i],
          assignedTimeSlot: schedulingTable.timeSlots[assignedIndex],
        });
      }
    }

    return optimalAssignments;
  }
}
