import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuoteFlowComponent } from './quote-flow.component';

describe('QuoteFlowComponent', () => {
  let component: QuoteFlowComponent;
  let fixture: ComponentFixture<QuoteFlowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuoteFlowComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QuoteFlowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
