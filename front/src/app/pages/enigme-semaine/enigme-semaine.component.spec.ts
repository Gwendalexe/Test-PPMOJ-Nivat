import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnigmeSemaineComponent } from './enigme-semaine.component';

describe('GameComponent', () => {
  let component: EnigmeSemaineComponent;
  let fixture: ComponentFixture<EnigmeSemaineComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [EnigmeSemaineComponent],
});
    fixture = TestBed.createComponent(EnigmeSemaineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
