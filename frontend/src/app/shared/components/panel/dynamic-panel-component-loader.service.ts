import { ComponentFactoryResolver, ComponentRef, Injectable, OnDestroy, Type, ViewContainerRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface ComponentInput {
  name: string;
  value: any;
}

export interface ComponentOutput {
  name: string;
  outputEvent: ($event?: any) => void;
}

export interface DynamicComponent {
  component: Type<any>;
  inputs: ComponentInput[];
  outputs: ComponentOutput[];
}

@Injectable()
export class DynamicPanelComponentLoaderService implements OnDestroy {
  private componentRef!: ComponentRef<any>;
  private destroy$ = new Subject<void>();

  constructor(private componentFactoryResolver: ComponentFactoryResolver) {}

  ngOnDestroy(): void {
    this.destroyComponent();
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadComponent(component: DynamicComponent, viewContainerRef: ViewContainerRef, destroy$: Subject<any>) {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(component.component);

    viewContainerRef.clear();

    this.destroy$ = destroy$;
    this.componentRef = viewContainerRef.createComponent<any>(componentFactory);

    this.setInputs(component);
    this.setOutputs(component);
  }

  destroyComponent() {
    this.componentRef.destroy();
  }

  getComponentInstance<T>(): ComponentRef<T> {
    return this.componentRef.instance;
  }

  private setInputs(component: DynamicComponent) {
    component.inputs.forEach((input: ComponentInput) => {
      this.setInput(input);
    });
  }

  private setInput(input: ComponentInput) {
    if (input.value instanceof Observable) {
      input.value
        .pipe(takeUntil(this.destroy$))
        .subscribe((value: any) => ((<any>this.componentRef.instance)[input.name] = value));
    } else {
      (<any>this.componentRef.instance)[input.name] = input.value;
    }
  }

  private setOutputs(component: DynamicComponent) {
    component.outputs.forEach((output: ComponentOutput) => {
      this.setOutput(output);
    });
  }

  private setOutput(output: ComponentOutput) {
    (<any>this.componentRef.instance)[output.name]
      .pipe(takeUntil(this.destroy$))
      .subscribe(($event: any) => output.outputEvent($event));
  }
}
