import { BaseLayout } from "@/components/layout/BaseLayout";
import { useRequireAuth } from "@/hooks/useAuth";

export const SectionPlaceholder = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      <BaseLayout title={title}>
        <p className="govuk-body">Loading...</p>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout title={title}>
      <h1 className="govuk-heading-xl">{title}</h1>
      <p className="govuk-body">{description}</p>
    </BaseLayout>
  );
};
