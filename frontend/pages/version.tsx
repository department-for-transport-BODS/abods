import { version } from "@/utils/config";

export default function VersionPage() {
  return <p>Version: {version.version}</p>;
}
