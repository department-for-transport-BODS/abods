import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { SharedModule } from 'src/app/shared/shared.module';
import { UserAccountComponent } from './nav/user-account/user-account.component';
import { NavComponent } from './nav/nav.component';
import { PageHeaderComponent } from './page-header/page-header.component';
import { InnerComponent } from './inner/inner.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { NgxTippyModule } from 'ngx-tippy-wrapper';
import { PageComponent } from './page/page.component';
import { NavToggleComponent } from './nav/nav-toggle/nav-toggle.component';
import { CookieBannerComponent } from './cookie-banner/cookie-banner.component';

@NgModule({
  declarations: [
    UserAccountComponent,
    NavComponent,
    PageHeaderComponent,
    InnerComponent,
    HeaderComponent,
    FooterComponent,
    PageComponent,
    NavToggleComponent,
    CookieBannerComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SharedModule,
    AngularSvgIconModule.forRoot(),
    HttpClientModule,
    NgxTippyModule,
  ],
  providers: [],
  exports: [
    UserAccountComponent,
    InnerComponent,
    NavComponent,
    PageHeaderComponent,
    HeaderComponent,
    FooterComponent,
    PageComponent,
    CookieBannerComponent,
  ],
})
export class LayoutModule {}
