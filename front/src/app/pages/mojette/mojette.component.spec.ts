import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MojetteComponent } from './mojette.component';

describe('MojetteComponent', () => {
  let component: MojetteComponent;
  let fixture: ComponentFixture<MojetteComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [MojetteComponent],
});
    fixture = TestBed.createComponent(MojetteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
