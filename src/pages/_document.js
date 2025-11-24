import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* <title>Konfydence Admin Panel</title> */}
        <meta name="description" content="Admin panel for Konfydence" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

