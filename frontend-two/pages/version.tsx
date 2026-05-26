import versionData from "../public/version.json";

export default function VersionPage() {
  return <p>Version: {versionData.version}</p>;
}
