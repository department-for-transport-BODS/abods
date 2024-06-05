import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxTippyModule } from 'ngx-tippy-wrapper';

import { DatenavItemComponent } from './datenav-item.component';

describe('DatenavItemComponent', () => {
  let component: DatenavItemComponent;
  let fixture: ComponentFixture<DatenavItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DatenavItemComponent],
      imports: [NgxTippyModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DatenavItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
