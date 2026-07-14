# Citrus Punch Theme 実装結果

## 変更概要

GitHub Pages版MD2PDFへ、BtoC企業の会社紹介・事業説明資料向けTheme「Citrus Punch」を追加した。白い本文面を基調に、Orangeを主要アクセント、Leafを階層マーカー、Lemonを補助線、Tomatoを注意喚起へ割り当てている。既存Themeの初期値、余白、文字サイズ、PDFファイル名生成、Theme切り替え方式は変更していない。

## 変更したファイル

- `docs/app.js`: Theme registryへCitrus Punchを追加
- `docs/styles.css`: Preview・レスポンシブ・印刷用のTheme専用CSSを追加
- `docs/index.html`: CSS/JSのキャッシュ識別子を更新
- `docs/samples/citrus-punch.md`: 標準Markdownだけで作成した確認サンプルを追加
- `output/pdf/citrus-punch-preview.pdf`: 最終確認用PDFを追加
- `CODEX_RESULT.md`: 本レポートを追加

## Theme情報

- Theme ID: `citrus-punch`
- 表示名: `Citrus Punch`
- 説明: `野菜・果物を感じる、力強くPOPなBtoC向けテーマ`
- Preview/PDF CSS class: `theme-citrus-punch`

## カラートークン

| 役割 | 値 |
|---|---|
| Primary / Orange | `#F05A00` |
| Secondary / Lemon | `#E6B800` |
| Support / Leaf | `#149A3A` |
| Emphasis / Tomato | `#D9362B` |
| Soft Surface / Deep Cream | `#F4E7C8` |
| Background / White | `#FFFFFF` |
| Main Text / Charcoal | `#222222` |
| Sub Text / Dark Gray | `#555555` |
| Divider / Warm Gray | `#E7DED2` |

UIの小さい白文字用に、Orangeの濃色派生 `#B84200` をボタン・リンク・強調文字へ限定して使用した。文書内のPrimary色は指定どおり `#F05A00` である。

## Previewへの反映

Theme registryから選択肢を生成し、選択時に `theme-citrus-punch` をPreviewへ付与する。アプリ背景は白からDeep Creamへ移る淡い背景とし、既存のガラス表示と背景フェードを維持した。Theme選択は既存どおりLocalStorageへ保存される。

## PDFへの反映

既存のブラウザ印刷方式を利用し、Previewと同じTheme classを印刷対象へ保持する。Citrus Punch全体へ `print-color-adjust: exact` を適用し、印刷時だけアプリ側のガラス影を除去した。既存のA4設定、上下16mm・左右14mm余白、ファイル名生成処理は変更していない。

## 実施したテスト

- JavaScript構文チェック
- Theme選択肢の順序と表示名
- URL指定、Theme切り替え、LocalStorage保存、再読み込み
- Business / Teal Gray / Citrus Punch間の往復切り替え
- H1、H2、H3、本文、強調、斜体、リスト、チェック項目、引用、表、リンク、水平線、インラインコード、コードブロック
- デスクトップ幅と390px幅の横あふれ確認
- PDFファイル名 `青葉フレッシュ株式会社 企業紹介レポート.pdf`
- Chromiumによる背景色付きPDF生成
- Popplerによる全3ページのPNG再描画と目視確認
- pypdfによるページ数・テキスト抽出確認
- `git diff --check`

## ビルド結果

静的なGitHub Pages構成のため専用ビルド工程はない。JavaScript構文チェックとブラウザ統合テストは成功した。最終PDFはA4・3ページで生成され、文字切れ、横あふれ、表の不自然な分断、背景色欠落、ページ末尾の孤立見出しは見つからなかった。

## アクセシビリティ確認

- Charcoal / White: `15.91:1`
- Dark Gray / White: `7.46:1`
- 濃色Orange / White: `5.50:1`
- Charcoal / Lemon: `8.50:1`
- White / Orange: `3.40:1`（大きな手順番号だけに限定）
- White / Tomato: `4.65:1`

H3本文はCharcoal、Leafはマーカーへ限定した。Lemon背景ではCharcoal文字を使用している。色だけに依存せず、見出し階層、ラベル、罫線、数値を併用した。

## 既存Themeの回帰確認

- Business: UI primary `#1976d2`、H2 `21px`、H3 `16.5px`を維持
- Teal Gray: UI primary `#079a9a`、H2 `22px`、H3 `17px`を維持
- 初期ThemeはBusinessのまま
- Density、Editorial、Monoは復活していない
- 既存Theme用CSSセレクタ、共通余白、PDFファイル名処理は未変更

## 残課題・人間による確認

実装上の残課題はない。公開後、GitHub Pages上でTheme選択とChromeの「PDFに保存」を1回確認すると、配信キャッシュを含めた最終確認になる。Python CLI版は今回のGitHub Pages Theme追加の対象外であり、変更していない。

## 確認用ファイル

- サンプルMarkdown: `docs/samples/citrus-punch.md`
- 確認用PDF: `output/pdf/citrus-punch-preview.pdf`
- デスクトップ画像: `../citrus-punch-verification/citrus-punch-preview.png`
- モバイル画像: `../citrus-punch-verification/citrus-punch-mobile.png`
