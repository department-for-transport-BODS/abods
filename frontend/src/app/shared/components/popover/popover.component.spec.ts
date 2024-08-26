import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxTippyDirective, NgxTippyModule } from 'ngx-tippy-wrapper';
import { PopoverComponent } from './popover.component';

describe('PopoverComponent', () => {
  let component: PopoverComponent;
  let fixture: ComponentFixture<PopoverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxTippyModule],
      declarations: [PopoverComponent, NgxTippyDirective],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PopoverComponent);
    component = fixture.componentInstance;
    component.identifier = 'test-popover';
    component.triggerLabel = 'popover';
    component.triggerType = 'link';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
