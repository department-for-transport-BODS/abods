import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { byText, createComponentFactory, Spectator } from '@ngneat/spectator';
import { Observable, of, Subject } from 'rxjs';
import { DynamicPanelComponentHostDirective } from './dynamic-panel-component-host.directive';
import { DynamicComponent, DynamicPanelComponentLoaderService } from './dynamic-panel-component-loader.service';

@Component({
  template: `
    <p>{{ testInput1 }}</p>
    <p>{{ testInput2 }}</p>
    <button (click)="testOutput1.emit()">Button 1</button>
    <button (click)="testOutput2.emit()">Button 2</button>
  `,
})
class TestDynamicComponent {
  @Input() testInput1!: string;
  @Input() testInput2!: Observable<number>;
  @Output() testOutput1 = new EventEmitter<string>();
  @Output() testOutput2 = new EventEmitter<number>();
}

@Component({
  template: `<ng-template appDynamicPanelComponentHost></ng-template>`,
})
class TestHostComponent {
  @ViewChild(DynamicPanelComponentHostDirective, { static: true })
  dynamicComponentHost!: DynamicPanelComponentHostDirective;
}

describe('DynamicPanelComponentLoaderService', () => {
  let spectator: Spectator<TestHostComponent>;
  let service: DynamicPanelComponentLoaderService;
  let component: TestHostComponent;
  let ref: ViewContainerRef;

  const destroy$ = new Subject<void>();
  const createDynamicComponent = (): DynamicComponent => {
    return <DynamicComponent>{
      component: TestDynamicComponent,
      inputs: [
        {
          name: 'testInput1',
          value: 'test1',
        },
        {
          name: 'testInput2',
          value: of(2),
        },
      ],
      outputs: [
        {
          name: 'testOutput1',
          outputEvent: () => 'output1',
        },
        {
          name: 'testOutput2',
          outputEvent: () => 'output2',
        },
      ],
    };
  };

  let dynamicComponent: DynamicComponent;

  const createComponent = createComponentFactory({
    component: TestHostComponent,
    declarations: [DynamicPanelComponentHostDirective, TestDynamicComponent],
    providers: [DynamicPanelComponentLoaderService],
    imports: [CommonModule],
    detectChanges: true,
  });

  beforeEach(() => {
    spectator = createComponent();
    component = spectator.component;
    service = spectator.inject(DynamicPanelComponentLoaderService);
    ref = component.dynamicComponentHost.viewContainerRef;
    dynamicComponent = createDynamicComponent();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadComponent', () => {
    it('should load component', () => {
      service.loadComponent(dynamicComponent, ref, destroy$);
      const instance = service.getComponentInstance<TestDynamicComponent>();

      expect(instance).toBeTruthy();
      expect(instance instanceof TestDynamicComponent).toBeTrue();
    });

    it('should set inputs', () => {
      service.loadComponent(dynamicComponent, ref, destroy$);
      spectator.detectChanges();

      expect(spectator.query(byText('test1'))).toBeVisible();
      expect(spectator.query(byText('2'))).toBeVisible();
    });

    it('should not set inputs', () => {
      dynamicComponent.inputs = [];
      service.loadComponent(dynamicComponent, ref, destroy$);
      spectator.detectChanges();

      expect(spectator.query(byText('test1'))).not.toBeVisible();
      expect(spectator.query(byText('2'))).not.toBeVisible();
    });

    it('should set outputs', () => {
      spyOn(dynamicComponent.outputs[0], 'outputEvent');
      spyOn(dynamicComponent.outputs[1], 'outputEvent');
      service.loadComponent(dynamicComponent, ref, destroy$);
      spectator.detectChanges();
      spectator.click(byText('Button 1'));

      expect(dynamicComponent.outputs[0].outputEvent).toHaveBeenCalledWith(undefined);
      expect(dynamicComponent.outputs[1].outputEvent).not.toHaveBeenCalledWith(undefined);
    });
  });

  describe('ngOnDestroy', () => {
    it('should call destory on componentRef', () => {
      service.loadComponent(dynamicComponent, ref, destroy$);
      spyOn(service['componentRef'], 'destroy');
      service.ngOnDestroy();

      expect(service['componentRef'].destroy).toHaveBeenCalledWith();
    });
  });
});
