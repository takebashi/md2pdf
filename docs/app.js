const sampleMarkdown = `---
title: Markdown PDF 自動生成システム
subtitle: ChatGPTのPDF制作待ち時間を減らすためのテンプレート型ワークフロー
author: Codex
date: 2026-07-09
---

# Markdown PDF 自動生成システム

このサンプルは、Markdown原稿から**人間が読みやすいPDF**を短時間で作るための出力例です。毎回ゼロからデザインを考えるのではなく、原稿を構造化して、固定テンプレートへ流し込みます。

## ねらい

- Markdownを書く
- コマンドを1回実行する
- デザイン済みのPDFと確認用PNGを得る
- 必要ならテーマだけ切り替える

> 目的は「PDF制作を依頼して待つ時間」を減らし、内容確認と微調整に集中できる状態を作ることです。

## 変換の流れ

| ステップ | 処理 | ポイント |
| --- | --- | --- |
| 1 | Markdownを読む | 見出し、段落、表、引用、コードを判定 |
| 2 | デザインを適用 | 余白、文字サイズ、色、表組みを固定 |
| 3 | PDFを書き出す | ブラウザの印刷機能でPDF保存 |
| 4 | 内容を確認 | プレビュー上で崩れを確認 |

## コードブロック

\`\`\`python
from pathlib import Path

source = Path("memo.md")
target = Path("memo.pdf")
print(f"convert {source} -> {target}")
\`\`\`

## 運用イメージ

1. ChatGPTには「原稿の構造化」だけを頼む
2. Markdownとして保存する
3. このWebアプリでPDF化する
4. 微調整はテーマや余白だけ変更する
`;

const state = {
  meta: {},
  blocks: [],
};

const elements = {
  input: document.querySelector("#markdownInput"),
  preview: document.querySelector("#preview"),
  title: document.querySelector("#documentTitle"),
  theme: document.querySelector("#themeSelect"),
  density: document.querySelector("#densitySelect"),
  file: document.querySelector("#fileInput"),
  sample: document.querySelector("#sampleButton"),
  print: document.querySelector("#printButton"),
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function inlineMarkdown(value) {
  let text = escapeHtml(value);
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const safeHref = escapeHtml(href);
    return `<a href="${safeHref}" target="_blank" rel="noreferrer">${label}</a>`;
  });
  return text;
}

function stripInline(value) {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function parseFrontMatter(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  if (lines[0]?.trim() !== "---") {
    return { meta: {}, lines };
  }
  const meta = {};
  let end = -1;
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].trim() === "---") {
      end = index;
      break;
    }
    const separator = lines[index].indexOf(":");
    if (separator > -1) {
      const key = lines[index].slice(0, separator).trim().toLowerCase();
      const value = lines[index].slice(separator + 1).trim().replace(/^["']|["']$/g, "");
      meta[key] = value;
    }
  }
  return end > -1 ? { meta, lines: lines.slice(end + 1) } : { meta: {}, lines };
}

function splitTableRow(line) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function isTableStart(lines, index) {
  if (!lines[index]?.includes("|") || !lines[index + 1]?.includes("|")) return false;
  const cells = splitTableRow(lines[index + 1]);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseMarkdown(markdown) {
  const { meta, lines } = parseFrontMatter(markdown);
  const blocks = [];
  let paragraph = [];
  let index = 0;

  function flushParagraph() {
    if (paragraph.length) {
      blocks.push({ type: "paragraph", text: paragraph.map((line) => line.trim()).join(" ") });
      paragraph = [];
    }
  }

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      index += 1;
      continue;
    }

    const fence = trimmed.match(/^```(\w+)?\s*$/);
    if (fence) {
      flushParagraph();
      const language = fence[1] || "";
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push({ type: "code", language, text: code.join("\n") });
      continue;
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2].trim() });
      index += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushParagraph();
      blocks.push({ type: "hr" });
      index += 1;
      continue;
    }

    const image = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (image) {
      flushParagraph();
      blocks.push({ type: "image", alt: image[1], src: image[2] });
      index += 1;
      continue;
    }

    if (isTableStart(lines, index)) {
      flushParagraph();
      const rows = [splitTableRow(lines[index])];
      index += 2;
      while (index < lines.length && lines[index].trim() && lines[index].includes("|")) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      blocks.push({ type: "table", rows });
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      const quote = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quote.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "quote", text: quote.join(" ") });
      continue;
    }

    const listItem = line.match(/^\s*([-*+]|\d+\.)\s+(.+)$/);
    if (listItem) {
      flushParagraph();
      const ordered = /^\d+\.$/.test(listItem[1]);
      const items = [];
      while (index < lines.length) {
        const item = lines[index].match(/^\s*([-*+]|\d+\.)\s+(.+)$/);
        if (!item || /^\d+\.$/.test(item[1]) !== ordered) break;
        items.push(item[2].trim());
        index += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    paragraph.push(line);
    index += 1;
  }

  flushParagraph();
  return { meta, blocks };
}

function inferTitle(meta, blocks) {
  if (meta.title) return meta.title;
  const h1 = blocks.find((block) => block.type === "heading" && block.level === 1);
  return h1 ? stripInline(h1.text) : "Markdown PDF";
}

function renderBlocks(meta, blocks) {
  const title = inferTitle(meta, blocks);
  const subtitle = meta.subtitle || "";
  const metaLine = [meta.author, meta.date].filter(Boolean).join(" / ");
  let skippedFirstTitle = false;
  const body = [];

  body.push(`
    <section class="doc-cover">
      <h1>${inlineMarkdown(title)}</h1>
      ${subtitle ? `<p>${inlineMarkdown(subtitle)}</p>` : ""}
      ${metaLine ? `<div class="doc-meta">${inlineMarkdown(metaLine)}</div>` : ""}
    </section>
  `);

  for (const block of blocks) {
    if (!skippedFirstTitle && block.type === "heading" && block.level === 1 && stripInline(block.text) === title) {
      skippedFirstTitle = true;
      continue;
    }

    if (block.type === "heading") {
      const level = Math.min(Math.max(block.level, 1), 4);
      body.push(`<h${level}>${inlineMarkdown(block.text)}</h${level}>`);
    } else if (block.type === "paragraph") {
      body.push(`<p>${inlineMarkdown(block.text)}</p>`);
    } else if (block.type === "quote") {
      body.push(`<blockquote>${inlineMarkdown(block.text)}</blockquote>`);
    } else if (block.type === "list") {
      const tag = block.ordered ? "ol" : "ul";
      const items = block.items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("");
      body.push(`<${tag}>${items}</${tag}>`);
    } else if (block.type === "code") {
      body.push(`<pre><code>${escapeHtml(block.text)}</code></pre>`);
    } else if (block.type === "table") {
      const [header = [], ...rows] = block.rows;
      const head = header.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join("");
      const tableRows = rows.map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join("")}</tr>`).join("");
      body.push(`<table><thead><tr>${head}</tr></thead><tbody>${tableRows}</tbody></table>`);
    } else if (block.type === "image") {
      body.push(`<figure><img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}"></figure>`);
    } else if (block.type === "hr") {
      body.push("<hr>");
    }
  }

  elements.title.textContent = title;
  elements.preview.innerHTML = body.join("\n");
}

function updatePreview() {
  const parsed = parseMarkdown(elements.input.value);
  state.meta = parsed.meta;
  state.blocks = parsed.blocks;
  elements.preview.className = `paper theme-${elements.theme.value} density-${elements.density.value}`;
  renderBlocks(state.meta, state.blocks);
}

function readFile(file) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    elements.input.value = String(reader.result || "");
    updatePreview();
  });
  reader.readAsText(file, "utf-8");
}

elements.input.value = sampleMarkdown;
elements.input.addEventListener("input", updatePreview);
elements.theme.addEventListener("change", updatePreview);
elements.density.addEventListener("change", updatePreview);
elements.sample.addEventListener("click", () => {
  elements.input.value = sampleMarkdown;
  updatePreview();
});
elements.print.addEventListener("click", () => window.print());
elements.file.addEventListener("change", (event) => {
  const [file] = event.target.files || [];
  if (file) readFile(file);
});

updatePreview();
