import { buildUrl } from "@/utils/buildUrl";
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  const bgImage = process.env.NEXT_PUBLIC_BG_IMAGE || "/bg-d.png";

  // ★季節に応じた背景画像を、ページ表示前にCSS変数として設定するスクリプト
  const seasonalBgScript = `
    (function() {
      var month = new Date().getMonth() + 1;
      var bg = "/bg_spring.jpg";
      if (month === 3 || month === 4) bg = "/bg_spring.jpg";
      else if (month === 5 || month === 6) bg = "/bg_early_summer.jpg";
      else if (month === 7 || month === 8) bg = "/bg_summer.jpg";
      else if (month === 9 || month === 10) bg = "/bg_autumn.jpg";
      else if (month === 11) bg = "/bg_late_autumn.jpg";
      else bg = "/bg_winter1.jpg";
      document.documentElement.style.setProperty("--seasonal-bg", "url(" + bg + ")");
    })();
  `;

  return (
    <Html lang="ja">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Kaisei+Decol:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: seasonalBgScript }} />
      </Head>
      <body
        style={{
          backgroundImage: `var(--seasonal-bg, url(${buildUrl(bgImage)}))`,
        }}
      >
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
