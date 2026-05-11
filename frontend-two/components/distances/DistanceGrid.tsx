import dynamic from "next/dynamic";
import { DistanceTable } from "./DistanceTable";

// TODO:NOW Figure out what the ORGANISATIONS filter is meant to do

const Button = dynamic(
  () => import("kainossoftwareltd-govuk-react-kainos").then((mod) => mod.Button),
  { ssr: false },
);

const Select = dynamic(
  () => import("kainossoftwareltd-govuk-react-kainos").then((mod) => mod.Select),
  { ssr: false },
);

// TODO:NOW Figure out what the operator filter is meant to do

export const DistanceGrid = () => {
  return (
    <div>
        {/* TODO:NOW Create a new component for the select with drop down and checkboxes. Also check how to do the ALL option */}
        {/* TODO:NOW Populate table */}
        <div className="distance-grid-filters">
            <Select
                name="date"
                label={{ children: "Date" }}
                items={[
                { value: "all", text: "All", selected: true },
                { value: "date1", text: "Date 1" },
                { value: "date2", text: "Date 2" },
                ]}
            />
            <Select
                name="admin-area"
                label={{ children: "Admin Area" }}
                items={[
                { value: "all", text: "All", selected: true },
                { value: "admin-area1", text: "Admin Area 1" },
                { value: "admin-area2", text: "Admin Area 2" },
                ]}
            />
            <Select
                name="organisations"
                label={{ children: "Organisations" }}
                items={[
                { value: "all", text: "All", selected: true },
                { value: "organisation1", text: "Organisation 1" },
                { value: "organisation2", text: "Organisation 2" },
                ]}
            />
        </div>
        <div className="distance-grid-filters">
            <Select
                name="operator"
                label={{ children: "Operators" }}
                items={[
                { value: "all", text: "All", selected: true },
                { value: "operator1", text: "Operator 1" },
                { value: "operator2", text: "Operator 2" },
                ]}
            />
            <Select
                name="licenses"
                label={{ children: "Licenses" }}
                items={[
                { value: "all", text: "All", selected: true },
                { value: "license1", text: "License 1" },
                { value: "license2", text: "License 2" },
                ]}
            />
            <Select
                name="services"
                label={{ children: "Services" }}
                items={[
                { value: "all", text: "All", selected: true },
                { value: "service1", text: "Service 1" },
                { value: "service2", text: "Service 2" },
                ]}
            />
        </div>
        <Button>Generate</Button>
        <DistanceTable />
    </div>
  );
};