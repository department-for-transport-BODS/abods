import { ViewContainerRef } from '@angular/core';
import { DynamicPanelComponentHostDirective } from './dynamic-panel-component-host.directive';

describe('DynamicPanelComponentHostDirective', () => {
  it('should create an instance', () => {
    const directive = new DynamicPanelComponentHostDirective(<ViewContainerRef>{});

    expect(directive).toBeTruthy();
  });
});
