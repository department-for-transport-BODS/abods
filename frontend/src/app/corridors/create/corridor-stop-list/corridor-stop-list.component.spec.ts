import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CorridorStopListComponent } from './corridor-stop-list.component';

describe('CorridorStopListComponent', () => {
  let component: CorridorStopListComponent;
  let fixture: ComponentFixture<CorridorStopListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CorridorStopListComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CorridorStopListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
