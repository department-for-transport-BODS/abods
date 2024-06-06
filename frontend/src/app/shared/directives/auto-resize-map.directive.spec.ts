import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AutoResizeMapDirective } from './auto-resize-map.directive';

@Component({ selector: 'mgl-map' }) // eslint-disable-line
class MockMapComponent {}

@Component({
  template: `<mgl-map [appAutoResizeMap]="map"></mgl-map>`,
})
class MockHostComponent {
  map = {
    resize() {}, // eslint-disable-line
  };
}

describe('AutoResizeMapDirective', () => {
  let component: MockHostComponent;
  let fixture: ComponentFixture<MockHostComponent>;
  let directiveEl: DebugElement;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AutoResizeMapDirective, MockMapComponent, MockHostComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MockHostComponent);
    directiveEl = fixture.debugElement.query(By.directive(AutoResizeMapDirective));
    component = fixture.componentInstance;
    el = directiveEl.nativeElement;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(directiveEl).toBeTruthy();
  });

  it('should call resize', () => {
    spyOnProperty(el, 'clientWidth', 'get').and.returnValue(1400);
    spyOn(component.map, 'resize');
    fixture.detectChanges();

    expect(component.map.resize).toHaveBeenCalledWith();
  });

  it('should not call resize', () => {
    spyOnProperty(el, 'clientWidth', 'get').and.returnValue(0);
    spyOn(component.map, 'resize');
    fixture.detectChanges();

    expect(component.map.resize).not.toHaveBeenCalledWith();
  });
});
