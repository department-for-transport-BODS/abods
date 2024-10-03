import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MaxNumberFormControlDirective } from './max-number-form-control.directive';

@Component({
  selector: 'app-test-component',
  template: `<form [formGroup]="form">
    <input formControlName="number" type="number" [maxNumber]="10" />
  </form>`,
})
class TestComponent {
  form: FormGroup;

  constructor(private formBuilder: FormBuilder) {
    this.form = this.formBuilder.group({
      number: [''],
    });
  }
}

describe('MaxNumberFormControlDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestComponent, MaxNumberFormControlDirective],
      imports: [ReactiveFormsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it(
    'should accept value less than or equal to maxNumber',
    waitForAsync(() => {
      const el = fixture.nativeElement.querySelector('input');
      el.value = 10;
      el.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        expect(component.form.controls.number.value).toEqual(10);
      });
    })
  );

  it(
    'should update value to maxNumber if input is greater than maxNumber',
    waitForAsync(() => {
      const el = fixture.nativeElement.querySelector('input');
      el.value = 11;
      el.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        expect(component.form.controls.number.value).toEqual(10);
      });
    })
  );
});
