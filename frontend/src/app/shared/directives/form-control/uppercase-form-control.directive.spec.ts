import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UppercaseFormControlDirective } from './uppercase-form-control.directive';

@Component({
  selector: 'app-test-component',
  template: `<form [formGroup]="form">
    <input formControlName="email" uppercase />
  </form>`,
})
class TestComponent {
  form: FormGroup;

  constructor(private formBuilder: FormBuilder) {
    this.form = this.formBuilder.group({
      email: [''],
    });
  }
}

describe('UppercaseFormControlDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestComponent, UppercaseFormControlDirective],
      imports: [ReactiveFormsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it(
    'should convert value to uppercase on input',
    waitForAsync(() => {
      const el = fixture.nativeElement.querySelector('input');
      el.value = 'Make ME UPper casE';
      el.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        expect(component.form.controls.email.value).toEqual('MAKE ME UPPER CASE');
      });
    })
  );
});
