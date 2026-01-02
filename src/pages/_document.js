import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* <title>Konfydence Admin Panel</title> */}
        <meta name="description" content="Admin panel for Konfydence" />
        <link rel="icon" type="image/png" href="/navbar-logo.png" />
        <link rel="shortcut icon" type="image/png" href="/navbar-logo.png" />
        <link rel="apple-touch-icon" type="image/png" href="/navbar-logo.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

