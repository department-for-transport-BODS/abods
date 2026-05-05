import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { BaseLayout } from "@/components/layout/BaseLayout";
import { FeedSummaryGrid } from "@/components/feed-monitoring/FeedSummaryGrid";

const FeedMonitoringPage = () => (
  <BaseLayout title="Dashboard - Analyse Bus Open Data">
    <div className="app-page feed-monitoring-page">
      <h1 className="govuk-heading-xl app-page-header"> NOC feed monitoring</h1>
      <div className="govuk-form-group">
        <label className="govuk-label">
          Search for an operator
        </label>
        <input className="govuk-input govuk-input--width-20" id="operator-search" type="text" />
      </div>
      <FeedSummaryGrid title="Inactive feeds" active={false} />
      <FeedSummaryGrid title="Active feeds" active={true} />
    </div>
  </BaseLayout>
);

export default FeedMonitoringPage;
