import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormationsComponent } from './formations.component';

describe('RegisterComponent', () => {
  let component: FormationsComponent;
  let fixture: ComponentFixture<FormationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [FormationsComponent],
}).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
