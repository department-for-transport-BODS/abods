import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DynamicComponent, DynamicPanelComponentLoaderService } from './dynamic-panel-component-loader.service';
import { PanelService } from './panel.service';

@Component({})
class TestDynamicComponent {}

describe('PanelService', () => {
  let service: PanelService;

  const dynamicComponent = <DynamicComponent>{
    component: TestDynamicComponent,
    inputs: [],
    outputs: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DynamicPanelComponentLoaderService],
    });
    service = TestBed.inject(PanelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setComponent', () => {
    it('should call next on componentSubject with component', () => {
      spyOn(service['componentSubject'], 'next');
      service.setComponent(dynamicComponent);

      expect(service['componentSubject'].next).toHaveBeenCalledOnceWith(dynamicComponent);
    });
  });

  describe('toggle', () => {
    it('should call close if isOpen is true', () => {
      service.open();
      spyOn(service, 'open');
      spyOn(service, 'close');
      service.toggle();

      expect(service.close).toHaveBeenCalledWith();
      expect(service.open).not.toHaveBeenCalledWith();
    });

    it('should call open if isOpen is false', () => {
      service.close();
      spyOn(service, 'open');
      spyOn(service, 'close');
      service.toggle();

      expect(service.close).not.toHaveBeenCalledWith();
      expect(service.open).toHaveBeenCalledWith();
    });
  });

  describe('destroy', () => {
    it('should call close and next on componentSubject with null', () => {
      service.setComponent(dynamicComponent);
      spyOn(service['componentSubject'], 'next');
      spyOn(service, 'close');
      service.destroy();

      expect(service['componentSubject'].next).toHaveBeenCalledOnceWith(null);
      expect(service.close).toHaveBeenCalledWith();
    });
  });
});
