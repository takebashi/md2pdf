# Markdown PDF System

Markdownファイルを、デザイン済みの読みやすいPDFへ変換する小さなCLIです。

## 使い方

```powershell
python .\md2pdf.py .\sample.md .\sample.pdf --preview-dir .\preview
```

テーマを変える場合:

```powershell
python .\md2pdf.py .\sample.md .\sample_editorial.pdf --theme editorial --preview-dir .\preview
```

## 入力Markdownで使えるもの

- YAML風の先頭メタ情報: `title`, `subtitle`, `author`, `date`
- 見出し: `#` から `####`
- 段落
- 太字、斜体、インラインコード、リンク
- 箇条書き、番号付きリスト
- 引用
- fenced code block
- Markdown表
- ローカル画像: `![説明](path/to/image.png)`

## 必要なもの

- Python 3.10以降
- `reportlab`
- 任意: `pdftoppm`

このCodex環境では同梱ランタイムに `reportlab` と `pdftoppm` が入っています。別PCで使う場合は次を実行してください。

```powershell
pip install reportlab
```

PNGプレビューも作る場合はPopplerを入れて、`pdftoppm` にPATHを通します。

## 設計方針

ChatGPTに毎回PDFデザインまで考えさせるのではなく、PDFの見た目はテンプレートに固定します。ChatGPTにはMarkdown原稿の整理だけを任せ、このツールで即座にPDF化する想定です。

## 次に足すと便利な機能

- HTMLテンプレートやCSSテーマからPDF化するモード
- 目次の自動生成
- `watch` モードによる保存時の自動再生成
- フォルダ内Markdownの一括変換
- 表紙なし、社内資料、提案書などのテンプレート追加
