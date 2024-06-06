import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { LayoutModule } from 'src/app/layout/layout.module';
import { AuthenticationService } from '../authentication.service';

import { LogoutComponent } from './logout.component';

describe('LogoutComponent', () => {
  let component: LogoutComponent;
  let fixture: ComponentFixture<LogoutComponent>;
  let authenticationService: AuthenticationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LogoutComponent],
      imports: [RouterTestingModule, LayoutModule, ApolloTestingModule],
      providers: [
        {
          provide: AuthenticationService,
          useValue: {
            logout: jasmine.createSpy('logout'),
          },
        },
      ],
    }).compileComponents();
    authenticationService = TestBed.inject(AuthenticationService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LogoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call logout', () => {
    component.logout();

    expect(authenticationService.logout).toHaveBeenCalledWith();
  });
});
