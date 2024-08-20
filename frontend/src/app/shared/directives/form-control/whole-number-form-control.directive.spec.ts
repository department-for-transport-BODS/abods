import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { WholeNumberFormControlDirective } from './whole-number-form-control.directive';

@Component({
  selector: 'app-test-component',
  template: `<form [formGroup]="form">
    <input formControlName="number" type="number" wholeNumber />
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

describe('WholeNumberFormControlDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestComponent, WholeNumberFormControlDirective],
      imports: [ReactiveFormsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it(
    'should accept whole number',
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
    'should update value to nearest whole number',
    waitForAsync(() => {
      const el = fixture.nativeElement.querySelector('input');
      el.value = 9.5;
      el.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        expect(component.form.controls.number.value).toEqual(9);
      });
    })
  );
});
