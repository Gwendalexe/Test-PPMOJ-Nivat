import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormationCardComponent } from './formation-card.component';

describe('FormationCard', () => {
  let component: FormationCardComponent;
  let fixture: ComponentFixture<FormationCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [FormationCardComponent],
});
    fixture = TestBed.createComponent(FormationCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
