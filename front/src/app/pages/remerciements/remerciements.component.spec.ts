import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemerciementsComponent } from './remerciements.component';

describe('ConditionsGeneralesDeVenteComponent', () => {
  let component: RemerciementsComponent;
  let fixture: ComponentFixture<RemerciementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemerciementsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RemerciementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
