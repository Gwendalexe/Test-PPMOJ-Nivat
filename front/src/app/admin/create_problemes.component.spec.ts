import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateProblemesComponent } from './create_problemes.component';

describe('RegisterComponent', () => {
  let component: CreateProblemesComponent;
  let fixture: ComponentFixture<CreateProblemesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    declarations: [CreateProblemesComponent],
}).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateProblemesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
