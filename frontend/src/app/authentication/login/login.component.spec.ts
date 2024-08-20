import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { of } from 'rxjs';
import { LayoutModule } from 'src/app/layout/layout.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { AuthenticationService } from '../authentication.service';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let router: Router;
  let authenticationService: AuthenticationService;
  let route: ActivatedRoute;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [FormsModule, ReactiveFormsModule, RouterTestingModule, SharedModule, LayoutModule, ApolloTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {
                returnUrl: undefined,
              },
            },
          },
        },
        {
          provide: AuthenticationService,
          useValue: {
            login: jasmine.createSpy('login'),
            get isAuthenticated$() {
              return of(false);
            },
          },
        },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    route = TestBed.inject(ActivatedRoute);
    authenticationService = TestBed.inject(AuthenticationService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should redirect to returnUrl if user is authenticated', () => {
      const returnUrl = 'test-url';
      route.snapshot.queryParams.returnUrl = returnUrl;
      spyOn(router, 'navigateByUrl');
      spyOnProperty(authenticationService, 'isAuthenticated$', 'get').and.returnValue(of(true));
      component.ngOnInit();

      expect(router.navigateByUrl).toHaveBeenCalledWith(returnUrl);
    });

    it('should redirect to "/" if user is authenticated and returnUrl not set', () => {
      spyOn(router, 'navigateByUrl');
      spyOnProperty(authenticationService, 'isAuthenticated$', 'get').and.returnValue(of(true));
      component.ngOnInit();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    });

    it('should not redirect to returnUrl if user is not authenticated', () => {
      const returnUrl = 'test-url';
      route.snapshot.queryParams.returnUrl = returnUrl;
      spyOn(router, 'navigateByUrl');
      spyOnProperty(authenticationService, 'isAuthenticated$', 'get').and.returnValue(of(false));
      component.ngOnInit();

      expect(router.navigateByUrl).not.toHaveBeenCalledWith(returnUrl);
    });

    it('should not show error message if user is not authenticated and form not submitted', () => {
      component.submitted = false;
      spyOn(router, 'navigateByUrl');
      spyOnProperty(authenticationService, 'isAuthenticated$', 'get').and.returnValue(of(false));
      component.ngOnInit();

      expect(component.errors).toEqual([]);
    });

    it('should show error message if user is not authenticated and form submitted', () => {
      component.submitted = true;
      spyOn(router, 'navigateByUrl');
      spyOnProperty(authenticationService, 'isAuthenticated$', 'get').and.returnValue(of(false));
      component.ngOnInit();

      expect(component.errors).toEqual([
        {
          error: 'Sign in failed, check username and password.',
          label: 'login-username',
        },
      ]);
    });
  });

  describe('onSubmit', () => {
    it('should call login with username and password if form is valid', () => {
      component.f.username.setValue('test@test.com');
      component.f.password.setValue('testpass');
      component.onSubmit();

      expect(authenticationService.login).toHaveBeenCalledWith('test@test.com', 'testpass');
    });

    it('should not call login with username and password if username is empty string', () => {
      component.f.username.setValue('');
      component.f.password.setValue('testpass');
      component.onSubmit();

      expect(authenticationService.login).not.toHaveBeenCalledWith('', 'testpass');
    });

    it('should not call login with username and password if password is empty string', () => {
      component.f.username.setValue('test@test.com');
      component.f.password.setValue('');
      component.onSubmit();

      expect(authenticationService.login).not.toHaveBeenCalledWith('test@test.com', '');
    });
  });

  describe('getError', () => {
    const requiredErrorMsg = 'This field is required.';

    it('should return error if username is invalid and dirty', () => {
      component.f.username.markAsDirty();

      expect(component.getError('username')).toEqual(requiredErrorMsg);
    });

    it('should return error if username is invalid and touched', () => {
      component.f.username.markAsTouched();

      expect(component.getError('username')).toEqual(requiredErrorMsg);
    });

    it('should not return error if username is pristine', () => {
      component.f.username.markAsPristine();

      expect(component.getError('username')).toBeUndefined();
    });

    it('should not return error if username is valid', () => {
      component.f.username.setValue('test@test.com');

      expect(component.getError('username')).toBeUndefined();
    });

    it('should return error if password is invalid and dirty', () => {
      component.f.password.markAsDirty();

      expect(component.getError('password')).toEqual(requiredErrorMsg);
    });

    it('should return error if password is invalid and touched', () => {
      component.f.password.markAsTouched();

      expect(component.getError('password')).toEqual(requiredErrorMsg);
    });

    it('should not return error if password is pristine', () => {
      component.f.password.markAsPristine();

      expect(component.getError('password')).toBeUndefined();
    });

    it('should not return error if password is valid', () => {
      component.f.password.setValue('testpass');

      expect(component.getError('password')).toBeUndefined();
    });
  });
});
