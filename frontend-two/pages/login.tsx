import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { ErrorSummary } from "@/components/form/ErrorSummary";
import { TextInput } from "@/components/form/TextInput";
import { PasswordInput } from "@/components/form/PasswordInput";
import { loginSchema, LoginSchema } from "@/schemas/login.schema";
import { ErrorInfo } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useConfig } from "@/contexts/ConfigContext";
import { LoginResult } from "@/services/auth.service";

const getLoginErrorMessage = (result: LoginResult): string => {
  if (result.locked && result.unlockAt) {
    const diffMs = new Date(result.unlockAt).getTime() - Date.now();
    const diffMins = Math.max(Math.ceil(diffMs / 60000), 0);
    return `Your account is locked for ${diffMins} minutes due to multiple failed attempts. Please try again later or reset your password if required.`;
  }

  let errorMessage = "Invalid username or password.";
  if (result.maxAttempts != null) {
    const remaining = result.maxAttempts - (result.failedAttempts ?? 0);
    errorMessage = `${errorMessage} You have ${remaining} more attempts remaining before your account is locked.`;
  }
  return errorMessage;
};

const LoginPage = () => {
  const router = useRouter();
  const { login } = useAuth();
  const { config } = useConfig();
  const [formData, setFormData] = useState<Partial<LoginSchema>>({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [returnUrl, setReturnUrl] = useState("/dashboard");

  // Capture returnUrl once router query params are available.
  // Only accept relative paths to prevent open redirect attacks.
  useEffect(() => {
    const raw = router.query.returnUrl;
    if (
      typeof raw === "string" &&
      raw.startsWith("/") &&
      !raw.startsWith("//")
    ) {
      setReturnUrl(raw);
    }
  }, [router.query.returnUrl]);

  // Clear errors when form data changes
  useEffect(() => {
    setErrors([]);
  }, [formData]);

  const updateField = (value: string, field: keyof LoginSchema) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrors([]);

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      setErrors(
        result.error.issues.map((issue) => ({
          id: issue.path.join("."),
          errorMessage: issue.message,
        })),
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const loginResult = await login(
        result.data.username,
        result.data.password,
      );
      if (!loginResult.success) {
        setErrors([
          {
            id: "username",
            errorMessage: getLoginErrorMessage(loginResult),
          },
        ]);
        return;
      }
      if (!loginResult.expiresAt) {
        setErrors([
          {
            id: "username",
            errorMessage: "Login failed",
          },
        ]);
        return;
      }
      router.replace(returnUrl);
    } catch (error) {
      setErrors([
        {
          id: "username",
          errorMessage:
            error instanceof Error
              ? error.message
              : "Invalid username or password.",
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseLayout title="Sign in - Analyse Bus Open Data" errors={errors}>
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-two-thirds-from-desktop">
          <ErrorSummary errors={errors} />
        </div>
      </div>

      <fieldset className="govuk-fieldset">
        <legend className="govuk-fieldset__legend govuk-fieldset__legend--xl">
          <h1 className="govuk-fieldset__heading">Sign in</h1>
        </legend>

        <form onSubmit={handleSubmit} noValidate>
          <div className="login govuk-grid-row">
            <div className="govuk-grid-column-two-thirds-from-desktop">
              <TextInput<LoginSchema>
                display="Email"
                inputName="username"
                width={20}
                value={formData.username}
                initialErrors={errors}
                stateUpdater={updateField}
                maxLength={100}
                required
                autocomplete="username"
              />

              <PasswordInput<LoginSchema>
                display="Password"
                inputName="password"
                width={20}
                value={formData.password}
                initialErrors={errors}
                stateUpdater={updateField}
                maxLength={100}
                required
                autocomplete="current-password"
              />

              <div style={{ maxWidth: "41ex" }}>
                <button
                  className="govuk-button"
                  data-module="govuk-button"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </button>
              </div>
            </div>

            <div className="govuk-grid-column-one-third-from-desktop govuk-body">
              <h2 className="govuk-heading-m">Forgot your password?</h2>
              <a
                className="govuk-link"
                href={`${config?.bodsBaseUrl}/account/password/reset/`}
              >
                Reset your password
              </a>
            </div>
          </div>
        </form>
      </fieldset>
    </BaseLayout>
  );
};

export default LoginPage;
