import { TestBed } from '@angular/core/testing';

import { MojetteService } from '../mojette.service';

describe('MojetteService', () => {
  let service: MojetteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MojetteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
