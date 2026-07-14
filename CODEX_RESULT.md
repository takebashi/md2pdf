# Citrus Punch Rich Preview 修正結果

## 変更概要

Citrus Punchを、標準Markdownの意味と構造を同期判定してリッチ表示するThemeへ改善した。H2番号、KPIカード、横型業務フロー、商品カテゴリ、強み、取り組みステータス、先頭画像のHero表示を追加し、確認用PDFを3ページから2ページへ整理した。BusinessとTeal Gray、PDFファイル名、A4設定、余白設定、Theme registry、LocalStorageは変更していない。

## 変更したファイル

- `docs/app.js`: Citrus Punch専用の同期装飾処理と厳密な意味判定を追加
- `docs/styles.css`: リッチ表示、狭幅表示、印刷時2ページ構成の専用CSSを追加
- `docs/samples/citrus-punch.md`: 重複文を削除し、カード判定可能な標準Markdownへ更新
- `docs/index.html`: 配信キャッシュ識別子を`citrus-rich-1`へ更新
- `output/pdf/citrus-punch-preview.pdf`: 最終確認用2ページPDFへ更新
- `CODEX_RESULT.md`: 本レポートへ更新

## リアルタイムPreview処理

既存の`input`イベントから`updatePreview()`を呼ぶ方式は維持した。入力ごとにMarkdownを再解析し、`renderBlocks()`がPreviewの`innerHTML`を1回更新する。Citrus Punch選択時だけ、その直後に`enhanceCitrusPunchContent(elements.preview)`を同期実行する。

実行順は次のとおり。

1. Markdownをブロックへ解析
2. HTML文字列を生成
3. Previewへ1回反映
4. Citrus Punchの場合のみPreview内を同期装飾
5. 完成済みDOMをそのままPreviewとPDFで共有

非同期装飾、MutationObserver、外部API、追加debounce、外部ライブラリは使用していない。毎回MarkdownからDOMを作り直すため、Theme切り替えや削除後に古い装飾は残らない。

## 装飾判定条件

### KPI

- 最も近い見出しが`KPI`、`主要指標`、`主要数値`、`主要実績`のいずれか
- データ行2〜6、列2〜4
- 列名に`指標`等と`実績`等を両方含む
- `前年比`、`注記`等は存在する場合だけ専用領域へ配置

各行を1カードとして、Orange、Lemon、Leaf、Tomatoの順に循環させる。元のtable、tr、tdは保持している。

### 業務フロー

- 見出しが`業務フロー`、`事業フロー`、`提供フロー`、`サービスフロー`、`処理フロー`のいずれか
- 直下が番号付きリスト
- 3〜6項目、入れ子なし、各項目80文字以内

デスクトップとPDFは横型、狭幅Previewは縦型にする。番号はOrange、接続矢印はLeaf、補助線はLemon、最終ステップはTomatoを使用する。

### 商品カテゴリ

- 見出しが`商品カテゴリ`、`サービスカテゴリ`、`取扱商品`、`商品構成`、`サービス構成`のいずれか
- 直下が2〜6項目のリスト
- 全項目が太字タイトルで始まり、説明文を持ち、110文字以内

### 強み

- 見出しが`強み`、`特徴`、`選ばれる理由`、`競争力`のいずれか
- 直下が2〜4項目のリスト
- 全項目が太字タイトルで始まり、説明文を持ち、130文字以内

### 最近の取り組み

- 最も近い見出しが`最近の取り組み`、`取り組み`、`施策`、`プロジェクト`、`実施事項`のいずれか
- データ行2〜6、列2〜4
- 列名に取り組み名、内容、状況の3役を含む
- `進行中`はTomato、`実施中`はLeaf、`強化中`はLemon、`準備中`はOrange、その他はDeep Cream

### Hero画像

- 文書先頭から最初のH2まで、最大4要素以内にある最初の画像だけを対象
- 画像がある場合のみ表紙へ移動
- 縦横比を維持し、狭幅ではタイトル下へ配置
- 一般画像の表示は変更しない

## Theme切り替え

Citrus PunchからBusinessまたはTeal Grayへ切り替えると、現在のMarkdownからPreview全体を再生成する。KPIは通常表、フローは通常番号付きリスト、カテゴリと強みは通常リスト、取り組みは通常表へ即時に戻る。往復切り替え後のCitrus専用class残存は0件だった。

## パフォーマンス対策

- DOM探索範囲を`#preview`内に限定
- 見出し条件を先に判定し、対象候補だけを構造確認
- 既存DOMとの差分復元や非同期再描画を行わない
- 画像の読み込み完了を待たずにPreview更新
- PDF直前の装飾再実行なし

30回連続更新の計測は平均約2.5ms、最大4.5msだった。各更新後もKPI 4件、フロー1件、カテゴリ4件、強み3件、取り組み3件で、重複は発生しなかった。

## ページ密度と改ページ

- Citrus Punchだけ表紙、H2、表、カード、注記の縦余白を約10〜15%調整
- 印刷時はKPI 4列、カテゴリ4列、フロー4列、強み3列を使用
- カード、フロー項目、取り組み行、Hero画像へ`break-inside: avoid`
- H2とH3は見出し直後の分断を回避
- 本文・リストへorphans/widowsを設定
- 共通の印刷フッター上余白`12mm`をCitrus Punchだけ適正化
- 本文フォントサイズ、A4設定、上下16mm・左右14mm余白は維持

確認用PDFは3ページから2ページになり、1ページ目に事業内容まで、2ページ目にカテゴリ、フロー、強み、取り組み、注記、出典、フッターまで収まった。

## 配色バランス

- Orange: H2番号、主要KPI、主要リンク
- Leaf: フロー矢印、強み、実施中ステータス
- Lemon: H2下線、補助KPI、カテゴリ、強化中ステータス
- Tomato: 4番目のKPI、最終ステップ、進行中ステータス、注意欄

Lemon上はCharcoal文字を使用し、色だけでなく番号、タイトル、数値、状況文字を併記している。

## 実施したテスト

- JavaScript構文チェックと`git diff --check`
- 文字追加・削除、貼り付け相当の入力更新
- KPI行追加、見出し変更による装飾解除、見出し復元
- Hero画像追加・削除
- 30回連続入力での重複・性能計測
- Citrus Punch、Business、Teal Grayの往復切り替え
- LocalStorageとURL Theme指定
- デスクトップ1440px、モバイル390pxの横あふれ確認
- KPIの4列／2列切り替え、フローの横／縦切り替え
- PDFファイル名`青葉フレッシュ株式会社 企業紹介レポート.pdf`
- Chromiumによる背景付きA4 PDF生成
- pypdfによる2ページ・抽出文字確認
- Popplerによる全ページPNG化と目視確認
- Hero画像付きPDFの縦横比・表紙配置確認

## リアルタイムPreview結果

追加文字は入力直後に1件表示され、削除直後に0件へ戻った。KPI行は4件から5件へ即時増加し、見出しを対象外名称へ変えると通常表へ戻り、名称復元後は4カードへ戻った。装飾の二重化、矢印増殖、H2番号の重複はなかった。

## PDF出力結果

- A4、2ページ
- 抽出文字数1,057文字
- Previewと同じKPI、フロー、カテゴリ、強み、取り組み、H2番号を保持
- 背景色、Lemon文字色、Tomatoバッジ、Leaf矢印を保持
- カード分断、表分断、見切れ、重なり、横スクロールなし
- 1ページ目と2ページ目の余白・見出し階層が一貫
- Hero画像付き別PDFでも画像比率と表紙配置を維持

## 既存Themeの回帰確認

- Business切り替え後のCitrus専用classは0件
- Businessでは通常表3件、通常番号付きリスト1件を維持
- Teal Grayを含むTheme選択UIと背景フェードを維持
- 初期ThemeはBusinessのまま
- Density、Editorial、Monoは復活していない
- 既存ThemeのCSSセレクタ、PDF余白、ファイル名生成は未変更
- Python CLI版は変更していない

## 残課題と人間による確認

実装上の残課題はない。公開後にGitHub Pages上でCitrus Punchを選び、Chromeの「PDFに保存」で2ページ表示を1回確認すると、ブラウザ配信キャッシュを含む最終確認になる。

## 確認用ファイル

- Markdown: `docs/samples/citrus-punch.md`
- PDF: `output/pdf/citrus-punch-preview.pdf`
- デスクトップPreview: `../citrus-punch-verification/citrus-punch-rich-desktop.png`
- モバイルPreview: `../citrus-punch-verification/citrus-punch-rich-mobile.png`
- Hero確認PDF: `../citrus-punch-verification/citrus-punch-hero-check.pdf`
