# assets/finland/ 画像の置き方

`finland/index.html`（OKAPO LAB × FINLAND ページ）で使う写真置き場です。
ここにファイルを追加・上書きするだけで、HTML側は一切編集せずに写真が差し替わります
（`finland/index.html` 側は最初から `assets/finland/〇〇.jpg` を参照済みで、
ファイルが無い間は自動的に「PHOTO COMING SOON」のプレースホルダーを表示します）。

## 対応表

| ファイル名 | 使われる場所 |
| --- | --- |
| `hero.jpg` | 01 HERO のセクション背景（森・湖・雪の雰囲気を伝える1枚） |
| `nature-01.jpg` | 06 LIFE IN FINLAND — NATURE（森・湖・自然の写真） |
| `city-01.jpg` | 06 LIFE IN FINLAND — CITY（街並みの写真） |
| `food-01.jpg` | 06 LIFE IN FINLAND — FOOD（食事・カフェの写真） |
| `sauna-01.jpg` | 06 LIFE IN FINLAND — SAUNA（サウナの写真） |
| `everyday-01.jpg` | 06 LIFE IN FINLAND — EVERYDAY LIFE（日常風景の写真） |
| `recommend-01.jpg` | 07 LOCAL RECOMMENDS — MY FAVORITE PLACE |
| `recommend-02.jpg` | 07 LOCAL RECOMMENDS — MY FAVORITE FOOD |
| `recommend-03.jpg` | 07 LOCAL RECOMMENDS — MY FAVORITE CAFE |
| `recommend-04.jpg` | 07 LOCAL RECOMMENDS — MY FAVORITE NATURE SPOT |
| `recommend-05.jpg` | 07 LOCAL RECOMMENDS — MY FAVORITE SAUNA |
| `recommend-06.jpg` | 07 LOCAL RECOMMENDS — MY FAVORITE EXPERIENCE |

## 差し替え方法

1. 上の表と同じファイル名（拡張子は `.jpg` / `.jpeg` / `.png` / `.webp` のいずれでもOK。
   拡張子を変える場合は `finland/index.html` 内の該当 `<img src="...">` も合わせて変更してください）で、
   このフォルダに画像を保存する。
2. それだけで反映されます。ページ側の再編集は不要です。
3. まだファイルを置いていない項目は、自動的に灰色のプレースホルダー
   （「PHOTO COMING SOON」）が表示され続けます。壊れた画像アイコンが出ることはありません。

## 推奨サイズ・書き出し

- 横幅：1200px 前後（大きすぎるとページが重くなります）
- 形式：`.webp` 推奨（`.jpg` でも可）
- 向き：横長（16:9 〜 4:3 程度）を推奨。縦長写真は `object-fit: cover` で中央がトリミングされます。

## 注意（必ず守ってください）

- **本人（フィンランド在住の友人）からWebサイトへの掲載許可を得た写真のみ** を使用してください。
- 本名・顔がはっきり写った写真・SNSアカウント・勤務先や学校・住所が特定できる写真は、
  **本人の許可なしに掲載しないでください。**
- 許可が取れていない写真は、このフォルダに置かないでください
  （置かない限り、ページ側は自動的にプレースホルダーのままになります）。
