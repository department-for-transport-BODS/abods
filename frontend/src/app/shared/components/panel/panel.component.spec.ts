import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DynamicPanelComponentHostDirective } from './dynamic-panel-component-host.directive';
import { DynamicComponent, DynamicPanelComponentLoaderService } from './dynamic-panel-component-loader.service';

import { PanelComponent } from './panel.component';
import { PanelService } from './panel.service';

@Component({})
class TestDynamicComponent {}

describe('PanelComponent', () => {
  let component: PanelComponent;
  let fixture: ComponentFixture<PanelComponent>;
  let panelService: PanelService;

  const dynamicComponent = <DynamicComponent>{
    component: TestDynamicComponent,
    inputs: [],
    outputs: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PanelComponent, DynamicPanelComponentHostDirective],
      providers: [PanelService, DynamicPanelComponentLoaderService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PanelComponent);
    component = fixture.componentInstance;
    panelService = TestBed.inject(PanelService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngAfterViewInit', () => {
    it('should call loadComponent if component returned from panelService', () => {
      panelService.setComponent(dynamicComponent);
      spyOn(component['dynamicComponentLoaderService'], 'loadComponent');
      component.ngAfterViewInit();

      expect(component['dynamicComponentLoaderService'].loadComponent).toHaveBeenCalledWith(
        dynamicComponent,
        component.dynamicComponentHost.viewContainerRef,
        component['destroy$']
      );
    });
  });

  describe('close', () => {
    it('should call close', () => {
      spyOn(component['panelService'], 'close');
      component.close();

      expect(component['panelService'].close).toHaveBeenCalledWith();
    });
  });
});
