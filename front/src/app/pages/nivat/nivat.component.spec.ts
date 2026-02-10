import { HttpClientTestingModule } from '@angular/common/http/testing'; // Mocks HTTP requests
import { NO_ERRORS_SCHEMA } from '@angular/core'; // Allows ignoring child components (like app-navbar)
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing'; // Mocks the Router

import { NivatService } from 'src/app/services/nivat.service';
import { NivatComponent } from './nivat.component';

describe('NivatComponent', () => {
  let component: NivatComponent;
  let fixture: ComponentFixture<NivatComponent>;

  /**
   * Setup phase: Configure the testing module.
   * We import testing modules to handle dependencies (Http, Router)
   * and declare the component under test.
   */
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NivatComponent],
      imports: [
        HttpClientTestingModule, // Prevents "No provider for HttpClient"
        RouterTestingModule, // Prevents "No provider for Router"
      ],
      providers: [
        NivatService, // Provide the service (mocked by HttpClientTestingModule)
      ],
      schemas: [NO_ERRORS_SCHEMA], // Ignore unknown elements (like <app-nivat-grid>) to isolate the test
    }).compileComponents();

    fixture = TestBed.createComponent(NivatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Trigger Angular change detection (ngOnInit)
  });

  /**
   * Smoke Test:
   * Verifies that the component instance can be instantiated without crashing.
   */
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
});
