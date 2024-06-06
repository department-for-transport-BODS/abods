import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MouseupOutsideDirective } from './mouseup-outside.directive';

@Component({
  template: `
    <div (appMouseupOutside)="onMouseupOutside()"></div>
    <div id="outside"></div>
  `,
})
class TestComponent {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onMouseupOutside() {}
}

describe('MouseupOutsideDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let directiveEl: DebugElement;
  let outsideEl: DebugElement;

  const event = new MouseEvent('mouseup', {
    bubbles: true,
    cancelable: true,
    view: window,
  });

  beforeEach(() => {
    fixture = TestBed.configureTestingModule({
      declarations: [MouseupOutsideDirective, TestComponent],
    }).createComponent(TestComponent);
    directiveEl = fixture.debugElement.query(By.directive(MouseupOutsideDirective));
    outsideEl = fixture.debugElement.query(By.css('#outside'));
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(directiveEl).toBeTruthy();
  });

  it('should not call onMouseupOutside() if mouseup event is on element', () => {
    spyOn(component, 'onMouseupOutside');
    directiveEl.nativeElement.dispatchEvent(event);

    expect(component.onMouseupOutside).not.toHaveBeenCalledWith();
  });

  it('should call onMouseupOutside() if mouseup event is outside element', () => {
    spyOn(component, 'onMouseupOutside');
    outsideEl.nativeElement.dispatchEvent(event);

    expect(component.onMouseupOutside).toHaveBeenCalledWith();
  });
});
