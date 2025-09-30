import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ApolloTestingModule } from "apollo-angular/testing";

import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { RouterModule } from "@angular/router";
import { HeaderComponent } from "./header.component";

fdescribe("HeaderComponent", () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HeaderComponent],
      imports: [RouterModule.forRoot([]), ApolloTestingModule],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", async () => {
    await expect(component).toBeTruthy();
  });
});
