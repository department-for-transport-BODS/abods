import { RouterTestingModule } from '@angular/router/testing';
import { ApolloTestingModule } from 'apollo-angular/testing';
import { AppComponent } from './app.component';
import { LayoutModule } from './layout/layout.module';
import { SharedModule } from './shared/shared.module';
import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { GoogleTagManagerService } from 'angular-google-tag-manager';

describe('AppComponent', () => {
  let spectator: Spectator<AppComponent>;

  const createComponent = createComponentFactory({
    component: AppComponent,
    imports: [RouterTestingModule, SharedModule, LayoutModule, ApolloTestingModule],
    mocks: [GoogleTagManagerService],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create the app', () => {
    expect(spectator.component).toBeTruthy();
  });
});
