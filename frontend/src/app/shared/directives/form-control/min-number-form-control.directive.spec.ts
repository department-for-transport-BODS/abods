import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MinNumberFormControlDirective } from './min-number-form-control.directive';

@Component({
  selector: 'app-test-component',
  template: `<form [formGroup]="form">
    <input formControlName="number" type="number" [minNumber]="10" />
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

describe('MinNumberFormControlDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestComponent, MinNumberFormControlDirective],
      imports: [ReactiveFormsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it(
    'should accept value greater than or equal to minNumber',
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
    'should update value to minNunber if input is less than minNumber',
    waitForAsync(() => {
      const el = fixture.nativeElement.querySelector('input');
      el.value = 9;
      el.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        expect(component.form.controls.number.value).toEqual(10);
      });
    })
  );
});
