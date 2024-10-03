import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { RadioItemComponent } from './radio-item.component';

describe('RadioItemComponent', () => {
  let component: RadioItemComponent;
  let fixture: ComponentFixture<RadioItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RadioItemComponent],
      imports: [FormsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RadioItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
