import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnomalyFlags } from './anomaly-flags';

describe('AnomalyFlags', () => {
  let component: AnomalyFlags;
  let fixture: ComponentFixture<AnomalyFlags>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnomalyFlags],
    }).compileComponents();

    fixture = TestBed.createComponent(AnomalyFlags);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
