import { useEffect, useRef } from "react";
import { createEmbeddingContext } from "amazon-quicksight-embedding-sdk";

interface QuickSightEmbedProps {
  url: string;
}

export const QuickSightEmbed = ({ url }: QuickSightEmbedProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;

    const embed = async () => {
      try {
        const context = await createEmbeddingContext();
        if (cancelled || !containerRef.current) return;
        await context.embedDashboard({
          url,
          container: containerRef.current,
          height: "1450px",
          width: "100%",
        });
      } catch (error) {
        console.error("Failed to embed QuickSight dashboard:", error);
      }
    };

    embed();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return <div ref={containerRef} />;
};
