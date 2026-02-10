import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConditionsGeneralesDeVenteComponent } from './conditions-generales-de-vente.component';

describe('ConditionsGeneralesDeVenteComponent', () => {
  let component: ConditionsGeneralesDeVenteComponent;
  let fixture: ComponentFixture<ConditionsGeneralesDeVenteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConditionsGeneralesDeVenteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConditionsGeneralesDeVenteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
