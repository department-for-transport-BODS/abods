import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { ConfigService } from "./config.service";

describe("ConfigService", () => {
  let service: ConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ConfigService);
  });

  it("should be created", async () => {
    await expect(service).toBeTruthy();
  });
});
