import { TestBed } from '@angular/core/testing';

import { CPTService } from '../CPT.service';

describe('CPTService', () => {
  let service: CPTService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CPTService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
