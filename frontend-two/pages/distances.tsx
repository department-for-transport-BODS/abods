import { BaseLayout } from "../components/layout/BaseLayout";
import { DistanceGrid } from "../components/distances/DistanceGrid";

const DistancesPage = () => {
  return (
      <BaseLayout title="Dashboard - Analyse Bus Open Data">
        <div className="app-page feed-monitoring-page">
          <h1 className="govuk-heading-xl app-page-header">Distances</h1>
          <DistanceGrid/>
        </div>
      </BaseLayout>
)};

export default DistancesPage;
