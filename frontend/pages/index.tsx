import { useEffect } from "react";
import { useRouter } from "next/router";

const IndexPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return null;
};

export default IndexPage;
