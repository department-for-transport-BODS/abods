import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LowercaseFormControlDirective } from './lowercase-form-control.directive';

@Component({
  selector: 'app-test-component',
  template: `<form [formGroup]="form">
    <input formControlName="email" lowercase />
  </form>`,
})
class TestComponent {
  form: FormGroup;

  constructor(private formBuilder: FormBuilder) {
    this.form = this.formBuilder.group({
      email: ['', { updateOn: 'blur' }],
    });
  }
}

describe('LowercaseFormControlDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestComponent, LowercaseFormControlDirective],
      imports: [ReactiveFormsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it(
    'should convert value to lowercase on input',
    waitForAsync(() => {
      const el = fixture.nativeElement.querySelector('input');
      el.value = 'Make ME LOWer casE';
      el.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        expect(component.form.controls.email.value).toEqual('make me lower case');
      });
    })
  );
});
