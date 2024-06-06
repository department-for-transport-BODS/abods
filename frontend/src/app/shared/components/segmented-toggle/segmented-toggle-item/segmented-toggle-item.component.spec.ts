import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SegmentedToggleItemComponent } from './segmented-toggle-item.component';

describe('SegmentedToggleItemComponent', () => {
  let component: SegmentedToggleItemComponent;
  let fixture: ComponentFixture<SegmentedToggleItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SegmentedToggleItemComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SegmentedToggleItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
