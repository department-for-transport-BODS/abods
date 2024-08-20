import { Spectator, createComponentFactory } from '@ngneat/spectator';
import { ButtonCellRendererComponent } from './button-cell.component';

describe('ButtonCellRendererComponent', () => {
  let spectator: Spectator<ButtonCellRendererComponent>;
  const createComponent = createComponentFactory(ButtonCellRendererComponent);

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create component', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should set label to params.label in agInit if it exists', () => {
    const params = {
      label: 'Test label',
      click: jasmine.createSpy('click'),
      value: 'Test value',
      valueFormatted: 'Test value formatted',
      eGridCell: document.createElement('div'),
    } as any;

    spectator.component.agInit(params);

    expect(spectator.component.label).toEqual(params.label);
  });

  it('should set label to params.valueFormatted in agInit if params.label does not exist', () => {
    const params = {
      click: jasmine.createSpy('click'),
      value: 'Test value',
      valueFormatted: 'Test value formatted',
      eGridCell: document.createElement('div'),
    } as any;

    spectator.component.agInit(params);

    expect(spectator.component.label).toEqual(params.valueFormatted);
  });

  it('should set label to params.value in agInit if params.label and params.valueFormatted do not exist', () => {
    const params = {
      click: jasmine.createSpy('click'),
      value: 'Test value',
      eGridCell: document.createElement('div'),
    } as any;

    spectator.component.agInit(params);

    expect(spectator.component.label).toEqual(params.value);
  });

  it('should set onClick method correctly in agInit', () => {
    const params = {
      label: 'Test label',
      click: jasmine.createSpy('click'),
      value: 'Test value',
      valueFormatted: 'Test value formatted',
      eGridCell: document.createElement('div'),
    } as any;

    spectator.component.agInit(params);

    // eslint-disable-next-line jasmine/prefer-toHaveBeenCalledWith
    expect(params.click).toHaveBeenCalled();
  });

  it('should refresh and call agInit', () => {
    const params = {
      label: 'Test label',
      click: jasmine.createSpy('click'),
      value: 'Test value',
      valueFormatted: 'Test value formatted',
      eGridCell: document.createElement('div'),
    } as any;

    const agInitSpy = spyOn(spectator.component, 'agInit');

    const result = spectator.component.refresh(params);

    expect(result).toBeTrue();
    // eslint-disable-next-line jasmine/prefer-toHaveBeenCalledWith
    expect(agInitSpy).toHaveBeenCalled();
  });

  it('should trigger button click when Enter key is pressed', () => {
    const params = {
      label: 'Test label',
      click: jasmine.createSpy('click'),
      value: 'Test value',
      eGridCell: document.createElement('div'),
    } as any;

    spectator.component.agInit(params);

    const button = document.createElement('button');
    spectator.component.buttonElement = { nativeElement: button } as any;

    const clickSpy = spyOn(button, 'click');

    const event = new KeyboardEvent('keypress', { key: 'Enter' });
    params.eGridCell.dispatchEvent(event);

    // eslint-disable-next-line jasmine/prefer-toHaveBeenCalledWith
    expect(clickSpy).toHaveBeenCalled();
  });

  it('should trigger button click when Space key is pressed', () => {
    const params = {
      label: 'Test label',
      click: jasmine.createSpy('click'),
      value: 'Test value',
      eGridCell: document.createElement('div'),
    } as any;

    spectator.component.agInit(params);

    const button = document.createElement('button');
    spectator.component.buttonElement = { nativeElement: button } as any;

    const clickSpy = spyOn(button, 'click');

    const event = new KeyboardEvent('keypress', { key: ' ' });
    params.eGridCell.dispatchEvent(event);

    // eslint-disable-next-line jasmine/prefer-toHaveBeenCalledWith
    expect(clickSpy).toHaveBeenCalled();
  });

  it('should not trigger button click when any other key is pressed', () => {
    const params = {
      label: 'Test label',
      click: jasmine.createSpy('click'),
      value: 'Test value',
      eGridCell: document.createElement('div'),
    } as any;

    spectator.component.agInit(params);

    const button = document.createElement('button');
    spectator.component.buttonElement = { nativeElement: button } as any;

    const clickSpy = spyOn(button, 'click');

    const event = new KeyboardEvent('keypress', { key: 'a' });
    params.eGridCell.dispatchEvent(event);
    // eslint-disable-next-line jasmine/prefer-toHaveBeenCalledWith
    expect(clickSpy).not.toHaveBeenCalled();
  });
});
