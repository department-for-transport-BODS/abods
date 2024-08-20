import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { PasswordInputComponent } from './password-input.component';

describe('PasswordInputComponent', () => {
  let component: PasswordInputComponent;
  let fixture: ComponentFixture<PasswordInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PasswordInputComponent],
      imports: [ReactiveFormsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PasswordInputComponent);
    component = fixture.componentInstance;
    component.width = '20';
    component.label = 'Password';
    component.autocomplete = 'new-password';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set default id', () => {
    const debugEl = fixture.debugElement.query(By.css('.password-input__input'));

    expect(component.inputId).toContain('gds-password-input-');
    expect(debugEl.nativeElement.id).toContain('gds-password-input-');
  });

  it('should override default id', () => {
    component.inputId = 'test-passord';
    fixture.detectChanges();
    const debugEl = fixture.debugElement.query(By.css('.password-input__input'));

    expect(component.inputId).toEqual('test-passord');
    expect(debugEl.nativeElement.id).toEqual('test-passord');
  });

  it('should set label', () => {
    const debugEl = fixture.debugElement.query(By.css('.govuk-label'));

    expect(debugEl.nativeElement.innerHTML).toContain('Password');
  });

  it('should show asterix after label if required', () => {
    component.required = true;
    fixture.detectChanges();

    const debugEl = fixture.debugElement.query(By.css('.govuk-label'));
    const pseudoAfterContent = window.getComputedStyle(debugEl.nativeElement, ':after').getPropertyValue('content');

    expect(pseudoAfterContent).toContain('*');
  });

  it('should not show asterix after label if not required', () => {
    component.required = false;
    fixture.detectChanges();

    const debugEl = fixture.debugElement.query(By.css('.govuk-label'));
    const pseudoAfterContent = window.getComputedStyle(debugEl.nativeElement, ':after').getPropertyValue('content');

    expect(pseudoAfterContent).toEqual('none');
  });

  it('should be of type password', () => {
    expect(component.type).toEqual('password');
  });

  it('should show error', () => {
    component.error = 'Test error';
    fixture.detectChanges();

    const debugEl = fixture.debugElement.query(By.css('.govuk-error-message'));

    expect(debugEl.nativeElement.innerHTML).toContain('Test error');
  });

  it('should change label from Show to Hide and type from password to text', () => {
    const debugEl = fixture.debugElement.query(By.css('.password-input__suffix-button'));

    expect(debugEl.nativeElement.innerHTML).toContain('Show');
    expect(component.type).toEqual('password');

    debugEl.triggerEventHandler('mousedown', {});
    fixture.detectChanges();

    expect(debugEl.nativeElement.innerHTML).toContain('Hide');
    expect(component.type).toEqual('text');

    debugEl.triggerEventHandler('mouseup', {});
    fixture.detectChanges();

    expect(debugEl.nativeElement.innerHTML).toContain('Show');
    expect(component.type).toEqual('password');
  });
});
