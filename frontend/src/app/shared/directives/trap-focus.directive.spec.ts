import { Component, DebugElement, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrapFocusDirective } from './trap-focus.directive';
import { By } from '@angular/platform-browser';

@Component({
  template: `
    <div [appTrapFocus]="trap"><button>Test</button></div>
    <div id="outside"></div>
  `,
})
class TestComponent {
  @Input() trap = false;
}

describe('TrapFocusDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let directiveEl: DebugElement;

  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    view: window,
    key: 'Tab',
  });

  beforeEach(() => {
    fixture = TestBed.configureTestingModule({
      declarations: [TrapFocusDirective, TestComponent],
    }).createComponent(TestComponent);
    directiveEl = fixture.debugElement.query(By.directive(TrapFocusDirective));
    component = fixture.componentInstance;
  });

  it('should be created', () => {
    expect(directiveEl).toBeTruthy();
  });

  it('should add event listener', () => {
    spyOn(window, 'addEventListener').and.callThrough();
    component.trap = true;
    fixture.detectChanges();
    window.dispatchEvent(event);

    // eslint-disable-next-line jasmine/prefer-toHaveBeenCalledWith
    expect(window.addEventListener).toHaveBeenCalled();
    expect(directiveEl.nativeElement.getAttribute('tabIndex')).toEqual('-1');
  });

  it('should remove event listener', () => {
    spyOn(window, 'removeEventListener').and.callThrough();
    component.trap = false;
    fixture.detectChanges();
    window.dispatchEvent(event);

    // eslint-disable-next-line jasmine/prefer-toHaveBeenCalledWith
    expect(window.removeEventListener).toHaveBeenCalled();
    expect(directiveEl.nativeElement.getAttribute('tabIndex')).toEqual('0');
  });
});
