import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { PublicHeaderComponent } from './public-header.component';

describe('PublicHeaderComponent', () => {
  let component: PublicHeaderComponent;
  let fixture: ComponentFixture<PublicHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicHeaderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PublicHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
