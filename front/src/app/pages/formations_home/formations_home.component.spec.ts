import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormationsHomeComponent } from './formations_home.component';

describe('RegisterComponent', () => {
  let component: FormationsHomeComponent;
  let fixture: ComponentFixture<FormationsHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [FormationsHomeComponent],
}).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormationsHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
