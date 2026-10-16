// Renders a JSON-LD structured data block. Google and LLM parsers use these
// to understand what the site/app is.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
