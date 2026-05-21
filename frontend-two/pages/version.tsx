import useSWR from "swr";
import { fetchVersion } from "@/utils/config";

export default function VersionPage() {
  const { data } = useSWR("version", fetchVersion);
  return <p>Version: {data?.version}</p>;
}
