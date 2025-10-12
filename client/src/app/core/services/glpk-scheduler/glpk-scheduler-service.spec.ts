import { TestBed } from '@angular/core/testing';

import { GlpkSchedulerService } from './glpk-scheduler-service';

describe('GlpkSchedulerService', () => {
  let service: GlpkSchedulerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GlpkSchedulerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
