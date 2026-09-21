import { buildUrl } from "@/utils/buildUrl";
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  const bgImage = process.env.NEXT_PUBLIC_BG_IMAGE || "/bg-d.png";

   // ★季節×時間帯に応じた背景画像を、ページ表示前にCSS変数として設定するスクリプト
  const seasonalBgScript = `
    (function() {
      var month = new Date().getMonth() + 1;
      var hour = new Date().getHours();

      var DAY = "/bg_daytime_house.jpg";
      var NIGHT = "/bg_night_house.jpg";

      // 季節ごとのファイル名
      var seasonImage = "/bg_spring.jpg";
      var seasonKey = "spring";
      if (month === 3 || month === 4) { seasonImage = "/bg_spring.jpg"; seasonKey = "spring"; }
      else if (month === 5 || month === 6) { seasonImage = "/bg_early_summer.jpg"; seasonKey = "early_summer"; }
      else if (month === 7 || month === 8) { seasonImage = "/bg_summer.jpg"; seasonKey = "summer"; }
      else if (month === 9 || month === 10) { seasonImage = "/bg_autumn.jpg"; seasonKey = "autumn"; }
      else if (month === 11) { seasonImage = "/bg_late_autumn.jpg"; seasonKey = "late_autumn"; }
      else { seasonImage = "/bg_winter1.jpg"; seasonKey = "winter"; }

      // 季節ごとの時間帯スケジュール（開始時刻, 終了時刻, タイプ）
      // タイプ: "day"=日中_家 / "season"=季節背景 / "night"=夜_家
      var schedules = {
        spring:       [[6,10,"day"], [10,15,"season"], [15,18,"day"], [18,30,"night"]],
        early_summer: [[6,7,"day"],  [7,10,"season"],  [10,18,"day"], [18,30,"night"]],
        summer:       [[6,15,"day"], [15,19,"season"], [19,30,"night"]],
        autumn:       [[6,15,"day"], [15,17,"season"], [17,30,"night"]],
        late_autumn:  [[6,10,"day"], [10,15,"season"], [15,17,"day"], [17,30,"night"]],
        winter:       [[6,18,"day"], [18,22,"season"], [22,30,"night"]]
      };

      // 0時〜5時台は「前日深夜からの継続」として扱うため、24を足して判定する
      var h = hour < 6 ? hour + 24 : hour;

      var periods = schedules[seasonKey];
      var type = "night"; // 念のためのデフォルト
      for (var i = 0; i < periods.length; i++) {
        if (h >= periods[i][0] && h < periods[i][1]) {
          type = periods[i][2];
          break;
        }
      }

      var bg = DAY;
      if (type === "season") bg = seasonImage;
      else if (type === "night") bg = NIGHT;
      else bg = DAY;

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
