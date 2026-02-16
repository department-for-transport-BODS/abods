import { Html, Head, Main, NextScript } from "next/document";

const Document = () => {
  return (
    <Html lang="en" className="govuk-template--rebranded">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="shortcut icon"
          sizes="16x16 32x32 48x48"
          href="/assets/rebrand/images/favicon.ico"
          type="image/x-icon"
        />
        <meta name="theme-color" content="#1d70b8" />
        <link rel="icon" sizes="48x48" href="/assets/rebrand/images/favicon.ico" />
        <link
          rel="icon"
          sizes="any"
          href="/assets/rebrand/images/favicon.svg"
          type="image/svg+xml"
        />
        <link
          rel="mask-icon"
          href="/assets/rebrand/images/govuk-icon-mask.svg"
          color="#1d70b8"
        />
        <link rel="apple-touch-icon" href="/assets/rebrand/images/govuk-icon-180.png" />
        <link rel="manifest" href="/assets/rebrand/manifest.json" />
        <meta property="og:image" content="/assets/rebrand/images/govuk-opengraph-image.png" />
      </Head>
      <body className="govuk-template__body">
        <script
          dangerouslySetInnerHTML={{
            __html:
              'document.body.className += " js-enabled" + ("noModule" in HTMLScriptElement.prototype ? " govuk-frontend-supported" : "");',
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
};

export default Document;
