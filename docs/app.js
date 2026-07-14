const emptyPreviewMessage = "Markdownを入力すると、ここにプレビューが表示されます。";

const state = {
  meta: {},
  blocks: [],
};

const themes = [
  {
    id: "business",
    label: "Business",
    enabled: true,
    ui: {
      primary: "#1976d2",
      primaryStrong: "#1265be",
      accent: "#49a7ed",
      background: `
        radial-gradient(circle at 18% 12%, rgba(73, 167, 237, 0.22), transparent 34%),
        radial-gradient(circle at 86% 18%, rgba(25, 118, 210, 0.16), transparent 36%),
        linear-gradient(135deg, #eaf6ff 0%, #dce8f7 100%)
      `,
      shadowTint: "rgba(34, 111, 178, 0.18)",
      focusRing: "rgba(25, 118, 210, 0.24)",
    },
    pdfClassName: "theme-business",
  },
  {
    id: "teal-gray",
    label: "Teal Gray",
    enabled: true,
    ui: {
      primary: "#079a9a",
      primaryStrong: "#087b80",
      accent: "#46b9b5",
      background: `
        radial-gradient(circle at 18% 12%, rgba(70, 185, 181, 0.18), transparent 34%),
        radial-gradient(circle at 86% 18%, rgba(8, 123, 128, 0.13), transparent 36%),
        linear-gradient(135deg, #eff7f5 0%, #e2ecec 100%)
      `,
      shadowTint: "rgba(20, 121, 121, 0.16)",
      focusRing: "rgba(7, 154, 154, 0.23)",
    },
    pdfClassName: "theme-teal-gray",
  },
  {
    id: "citrus-punch",
    label: "Citrus Punch",
    description: "野菜・果物を感じる、力強くPOPなBtoC向けテーマ",
    enabled: true,
    ui: {
      primary: "#F05A00",
      primaryStrong: "#B84200",
      accent: "#E6B800",
      background: `
        radial-gradient(circle at 16% 10%, rgba(240, 90, 0, 0.10), transparent 32%),
        radial-gradient(circle at 86% 16%, rgba(230, 184, 0, 0.10), transparent 34%),
        linear-gradient(135deg, #ffffff 0%, #f8f0dc 100%)
      `,
      shadowTint: "rgba(150, 82, 22, 0.15)",
      focusRing: "rgba(240, 90, 0, 0.24)",
    },
    palette: {
      primary: "#F05A00",
      secondary: "#E6B800",
      support: "#149A3A",
      emphasis: "#D9362B",
      softSurface: "#F4E7C8",
      background: "#FFFFFF",
      mainText: "#222222",
      subText: "#555555",
      divider: "#E7DED2",
    },
    pdfClassName: "theme-citrus-punch",
  },
];

const availableThemes = themes.filter((theme) => theme.enabled);
const fallbackTheme = availableThemes.find((theme) => theme.id === "business") || availableThemes[0];
let currentTheme = fallbackTheme;
let backgroundTransitionId = 0;

const elements = {
  input: document.querySelector("#markdownInput"),
  preview: document.querySelector("#preview"),
  title: document.querySelector("#documentTitle"),
  theme: document.querySelector("#themeSelect"),
  file: document.querySelector("#fileInput"),
  print: document.querySelector("#printButton"),
  backgroundCurrent: document.querySelector(".theme-background-layer.is-current"),
  backgroundNext: document.querySelector(".theme-background-layer.is-next"),
};

const printMargins = { top: "16mm", right: "14mm", bottom: "16mm", left: "14mm" };
const themeStorageKeys = ["md2pdf.theme", "markdown-to-pdf-theme"];

function resolveTheme(themeId) {
  return availableThemes.find((theme) => theme.id === themeId) || fallbackTheme;
}

function readInitialThemeId() {
  const params = new URLSearchParams(window.location.search);
  const urlTheme = params.get("theme");
  if (urlTheme) return urlTheme;

  try {
    for (const key of themeStorageKeys) {
      const storedTheme = window.localStorage.getItem(key);
      if (storedTheme) return storedTheme;
    }
  } catch {
    // Ignore unavailable storage, such as strict privacy modes.
  }

  return fallbackTheme.id;
}

function saveThemePreference(theme) {
  try {
    window.localStorage.setItem(themeStorageKeys[0], theme.id);
  } catch {
    // Theme persistence is optional; rendering should never depend on it.
  }
}

function renderThemeOptions() {
  elements.theme.innerHTML = availableThemes
    .map((theme) => `<option value="${theme.id}">${theme.label}</option>`)
    .join("");
}

function setThemeTokens(theme) {
  const root = document.documentElement;
  root.style.setProperty("--ui-primary", theme.ui.primary);
  root.style.setProperty("--ui-primary-strong", theme.ui.primaryStrong);
  root.style.setProperty("--ui-accent", theme.ui.accent);
  root.style.setProperty("--ui-background", theme.ui.background);
  root.style.setProperty("--ui-shadow-tint", theme.ui.shadowTint);
  root.style.setProperty("--ui-focus-ring", theme.ui.focusRing);
  root.dataset.uiTheme = theme.id;
}

function setBackgroundLayer(layer, theme) {
  if (layer) {
    layer.style.background = theme.ui.background;
  }
}

function applyUiTheme(theme, { immediate = false } = {}) {
  const nextTheme = resolveTheme(theme?.id);
  setThemeTokens(nextTheme);

  if (!elements.backgroundCurrent || !elements.backgroundNext) {
    currentTheme = nextTheme;
    return;
  }

  if (immediate || nextTheme.id === currentTheme.id) {
    setBackgroundLayer(elements.backgroundCurrent, nextTheme);
    elements.backgroundCurrent.style.opacity = "1";
    elements.backgroundNext.style.opacity = "0";
    currentTheme = nextTheme;
    return;
  }

  const transitionId = (backgroundTransitionId += 1);
  setBackgroundLayer(elements.backgroundNext, nextTheme);
  elements.backgroundNext.style.opacity = "1";
  elements.backgroundCurrent.style.opacity = "0";

  window.setTimeout(() => {
    if (transitionId !== backgroundTransitionId) return;
    setBackgroundLayer(elements.backgroundCurrent, nextTheme);
    elements.backgroundCurrent.style.opacity = "1";
    elements.backgroundNext.style.opacity = "0";
    currentTheme = nextTheme;
  }, 430);
}

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

function inferLead(meta, blocks, title) {
  if (meta.subtitle) return { text: meta.subtitle, blockIndex: -1 };
  const titleIndex = blocks.findIndex(
    (block) => block.type === "heading" && block.level === 1 && stripInline(block.text) === title,
  );
  if (titleIndex > -1 && blocks[titleIndex + 1]?.type === "paragraph") {
    return { text: blocks[titleIndex + 1].text, blockIndex: titleIndex + 1 };
  }
  return { text: "", blockIndex: -1 };
}

function classifyCallout(text) {
  const normalized = stripInline(text).trim();
  const rules = [
    ["callout-conclusion", /^(結論|推奨)\s*[：:]/],
    ["callout-warning", /^(注意|重要)\s*[：:]/],
    ["callout-risk", /^リスク\s*[：:]/],
    ["callout-info", /^(補足|ポイント)\s*[：:]/],
    ["callout-action", /^次のアクション\s*[：:]/],
  ];
  return rules.find(([, pattern]) => pattern.test(normalized))?.[0] || "callout-info";
}

function calloutLabel(className) {
  return {
    "callout-conclusion": "CONCLUSION",
    "callout-warning": "NOTE",
    "callout-risk": "RISK",
    "callout-info": "INFO",
    "callout-action": "ACTION",
  }[className] || "INFO";
}

function isNumericLike(value) {
  return /^[\s¥$€£+\-]?\d[\d,]*(\.\d+)?\s*(%|円|件|台|GB|MB|TB|時間|分|日|ヶ月|年)?\s*$/.test(stripInline(value));
}

function renderListItem(item) {
  const task = item.match(/^\[( |x|X)\]\s+(.+)$/);
  if (!task) return inlineMarkdown(item);
  const checked = task[1].toLowerCase() === "x";
  return `<span class="task-box${checked ? " is-checked" : ""}" aria-hidden="true"></span><span>${inlineMarkdown(task[2])}</span>`;
}

function listClasses(block, previousHeading) {
  const classes = [];
  if (block.items.every((item) => /^\[( |x|X)\]\s+/.test(item))) classes.push("task-list");
  if (block.ordered && /^(手順|ステップ|進め方|流れ)$/.test(previousHeading)) classes.push("steps-list");
  if (/^(次のアクション|対応事項|確認事項|TODO)$/.test(previousHeading)) classes.push("action-list");
  return classes.join(" ");
}

function renderBlocks(meta, blocks) {
  const title = inferTitle(meta, blocks);
  const lead = inferLead(meta, blocks, title);
  const metaLine = [meta.author, meta.date].filter(Boolean).join(" / ");
  let skippedFirstTitle = false;
  let previousHeading = "";
  const body = [];

  body.push(`
    <section class="doc-cover">
      <h1>${inlineMarkdown(title)}</h1>
      ${lead.text ? `<p>${inlineMarkdown(lead.text)}</p>` : ""}
      ${metaLine ? `<div class="doc-meta">${inlineMarkdown(metaLine)}</div>` : ""}
    </section>
  `);

  blocks.forEach((block, blockIndex) => {
    if (!skippedFirstTitle && block.type === "heading" && block.level === 1 && stripInline(block.text) === title) {
      skippedFirstTitle = true;
      previousHeading = stripInline(block.text);
      return;
    }

    if (blockIndex === lead.blockIndex) {
      return;
    }

    if (block.type === "heading") {
      const level = Math.min(Math.max(block.level, 1), 4);
      body.push(`<h${level}>${inlineMarkdown(block.text)}</h${level}>`);
      previousHeading = stripInline(block.text);
    } else if (block.type === "paragraph") {
      body.push(`<p>${inlineMarkdown(block.text)}</p>`);
    } else if (block.type === "quote") {
      const className = classifyCallout(block.text);
      body.push(`<blockquote class="callout ${className}" data-label="${calloutLabel(className)}">${inlineMarkdown(block.text)}</blockquote>`);
    } else if (block.type === "list") {
      const tag = block.ordered ? "ol" : "ul";
      const className = listClasses(block, previousHeading);
      const renderedItems = block.items.map((item) => `<li>${renderListItem(item)}</li>`).join("");
      body.push(`<${tag}${className ? ` class="${className}"` : ""}>${renderedItems}</${tag}>`);
    } else if (block.type === "code") {
      const codeClass = block.language === "text" ? " class=\"prompt-block\"" : "";
      const label = block.language === "text" ? "PROMPT" : "CODE";
      body.push(`<pre${codeClass} data-label="${label}"><code>${escapeHtml(block.text)}</code></pre>`);
    } else if (block.type === "table") {
      const [header = [], ...rows] = block.rows;
      const tableClass = header.length >= 5 ? " class=\"table-wide\"" : "";
      const head = header.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join("");
      const tableRows = rows
        .map((row) => `<tr>${row.map((cell) => `<td${isNumericLike(cell) ? ' class="numeric-cell"' : ""}>${inlineMarkdown(cell)}</td>`).join("")}</tr>`)
        .join("");
      body.push(`<table${tableClass}><thead><tr>${head}</tr></thead><tbody>${tableRows}</tbody></table>`);
    } else if (block.type === "image") {
      body.push(`<figure><img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}">${block.alt ? `<figcaption>${inlineMarkdown(block.alt)}</figcaption>` : ""}</figure>`);
    } else if (block.type === "hr") {
      body.push("<hr>");
    }
  });

  body.push(`<footer class="doc-footer"><span>${inlineMarkdown(title)}</span><span>Markdown to PDF</span></footer>`);

  elements.title.textContent = title;
  elements.preview.innerHTML = body.join("\n");
}

function nearestHeadingText(element) {
  let sibling = element.previousElementSibling;
  while (sibling) {
    if (/^H[1-4]$/.test(sibling.tagName)) {
      return sibling.textContent.trim();
    }
    sibling = sibling.previousElementSibling;
  }
  return "";
}

function decorateCitrusHeadings(root) {
  root.querySelectorAll("h2").forEach((heading) => {
    heading.classList.add("citrus-section-heading");
  });
}

function decorateCitrusKpiTables(root) {
  const headingPattern = /(KPI|主要指標|主要数値|主要実績)/i;
  root.querySelectorAll("table").forEach((table) => {
    if (!headingPattern.test(nearestHeadingText(table))) return;

    const headers = [...table.querySelectorAll("thead th")].map((cell) => cell.textContent.trim());
    const rows = [...table.querySelectorAll("tbody tr")];
    if (headers.length < 2 || headers.length > 4 || rows.length < 2 || rows.length > 6) return;

    const metricIndex = headers.findIndex((header) => /(指標|項目|KPI|名称)/i.test(header));
    const valueIndex = headers.findIndex((header) => /(実績|数値|値|結果)/i.test(header));
    if (metricIndex < 0 || valueIndex < 0) return;

    const deltaIndex = headers.findIndex((header) => /(前年比|前期比|増減|比較)/i.test(header));
    const noteIndex = headers.findIndex((header) => /(注記|補足|内容|ポイント)/i.test(header));
    table.classList.add("citrus-kpi-grid");

    rows.forEach((row, rowIndex) => {
      row.classList.add("citrus-kpi-card", `citrus-tone-${(rowIndex % 4) + 1}`);
      [...row.cells].forEach((cell, cellIndex) => {
        cell.dataset.label = headers[cellIndex] || "";
        if (cellIndex === metricIndex) cell.classList.add("citrus-kpi-label");
        if (cellIndex === valueIndex) cell.classList.add("citrus-kpi-value");
        if (cellIndex === deltaIndex) cell.classList.add("citrus-kpi-delta");
        if (cellIndex === noteIndex) cell.classList.add("citrus-kpi-note");
      });
    });
  });
}

function decorateCitrusProcessLists(root) {
  const headingPattern = /(業務フロー|事業フロー|提供フロー|サービスフロー|処理フロー)/;
  root.querySelectorAll("h2, h3, h4").forEach((heading) => {
    if (!headingPattern.test(heading.textContent.trim())) return;
    const list = heading.nextElementSibling;
    if (!list || list.tagName !== "OL") return;
    const items = [...list.children];
    if (items.length < 3 || items.length > 6) return;
    if (items.some((item) => item.querySelector("ul, ol") || item.textContent.trim().length > 80)) return;
    list.classList.add("citrus-process-flow");
  });
}

function decorateCitrusCardLists(root) {
  const configurations = [
    {
      headingPattern: /(商品カテゴリ|サービスカテゴリ|取扱商品|商品構成|サービス構成)/,
      className: "citrus-category-grid",
      itemClassName: "citrus-category-card",
      minItems: 2,
      maxItems: 6,
      maxLength: 110,
    },
    {
      headingPattern: /(強み|特徴|選ばれる理由|競争力)/,
      className: "citrus-feature-grid",
      itemClassName: "citrus-feature-card",
      minItems: 2,
      maxItems: 4,
      maxLength: 130,
    },
  ];

  root.querySelectorAll("h2, h3, h4").forEach((heading) => {
    const configuration = configurations.find(({ headingPattern }) => headingPattern.test(heading.textContent.trim()));
    if (!configuration) return;

    const list = heading.nextElementSibling;
    if (!list || !["UL", "OL"].includes(list.tagName)) return;
    const items = [...list.children];
    if (items.length < configuration.minItems || items.length > configuration.maxItems) return;
    if (items.some((item) => item.querySelector("ul, ol") || item.textContent.trim().length > configuration.maxLength)) return;
    if (items.some((item) => item.firstElementChild?.tagName !== "STRONG")) return;
    if (items.some((item) => item.textContent.trim().length <= item.firstElementChild.textContent.trim().length + 1)) return;

    list.classList.add(configuration.className);
    items.forEach((item, itemIndex) => {
      item.classList.add(configuration.itemClassName, `citrus-tone-${(itemIndex % 4) + 1}`);
      const title = item.firstElementChild;
      title.classList.add("citrus-card-title");
      const description = document.createElement("span");
      description.className = "citrus-card-description";
      while (title.nextSibling) {
        description.append(title.nextSibling);
      }
      if (description.firstChild?.nodeType === Node.TEXT_NODE) {
        description.firstChild.nodeValue = description.firstChild.nodeValue.replace(/^\s*[：:]\s*/, "");
      }
      item.append(description);
    });
  });
}

function decorateCitrusInitiativeTables(root) {
  const headingPattern = /(最近の取り組み|取り組み|施策|プロジェクト|実施事項)/;
  root.querySelectorAll("table").forEach((table) => {
    if (!headingPattern.test(nearestHeadingText(table))) return;

    const headers = [...table.querySelectorAll("thead th")].map((cell) => cell.textContent.trim());
    const rows = [...table.querySelectorAll("tbody tr")];
    if (headers.length < 2 || headers.length > 4 || rows.length < 2 || rows.length > 6) return;

    const nameIndex = headers.findIndex((header) => /(取り組み|施策|プロジェクト|名称|項目)/.test(header));
    const contentIndex = headers.findIndex((header) => /(内容|概要|目的)/.test(header));
    const statusIndex = headers.findIndex((header) => /(状況|ステータス|進捗)/.test(header));
    if (nameIndex < 0 || contentIndex < 0 || statusIndex < 0) return;

    table.classList.add("citrus-initiative-list");
    rows.forEach((row) => {
      row.classList.add("citrus-initiative-card");
      [...row.cells].forEach((cell, cellIndex) => {
        cell.dataset.label = headers[cellIndex] || "";
        if (cellIndex === nameIndex) cell.classList.add("citrus-initiative-name");
        if (cellIndex === contentIndex) cell.classList.add("citrus-initiative-content");
        if (cellIndex !== statusIndex) return;

        const status = cell.textContent.trim();
        const statusClass = [
          ["citrus-status-progress", /進行中/],
          ["citrus-status-active", /実施中/],
          ["citrus-status-strengthen", /強化中/],
          ["citrus-status-preparing", /準備中/],
        ].find(([, pattern]) => pattern.test(status))?.[0] || "citrus-status-default";
        cell.classList.add("citrus-initiative-status", statusClass);
      });
    });
  });
}

function decorateCitrusHeroImage(root) {
  const cover = root.querySelector(":scope > .doc-cover");
  if (!cover) return;
  const content = [...root.children].filter((element) => element !== cover);
  const firstSectionIndex = content.findIndex((element) => element.tagName === "H2");
  const candidates = content.slice(0, firstSectionIndex < 0 ? 4 : Math.min(firstSectionIndex, 4));
  const figure = candidates.find((element) => element.tagName === "FIGURE");
  if (!figure) return;

  cover.classList.add("citrus-has-hero");
  figure.classList.add("citrus-hero-figure");
  cover.append(figure);
}

function enhanceCitrusPunchContent(root) {
  decorateCitrusHeadings(root);
  decorateCitrusKpiTables(root);
  decorateCitrusProcessLists(root);
  decorateCitrusCardLists(root);
  decorateCitrusInitiativeTables(root);
  decorateCitrusHeroImage(root);
}

function updatePrintPageMargins() {
  let style = document.querySelector("#printPageMargins");

  if (!style) {
    style = document.createElement("style");
    style.id = "printPageMargins";
    document.head.appendChild(style);
  }

  style.textContent = `
:root {
  --print-margin-top: ${printMargins.top};
  --print-margin-right: ${printMargins.right};
  --print-margin-bottom: ${printMargins.bottom};
  --print-margin-left: ${printMargins.left};
}

@page {
  size: A4;
  margin: 0;
}
`;
}

function updatePreview() {
  const isEmpty = !elements.input.value.trim();
  const theme = resolveTheme(elements.theme.value);
  if (elements.theme.value !== theme.id) {
    elements.theme.value = theme.id;
  }
  saveThemePreference(theme);
  applyUiTheme(theme);
  elements.preview.className = `paper ${theme.pdfClassName}${isEmpty ? " is-empty" : ""}`;
  updatePrintPageMargins();

  if (isEmpty) {
    state.meta = {};
    state.blocks = [];
    elements.title.textContent = "Preview";
    elements.preview.innerHTML = `<div class="empty-preview">${emptyPreviewMessage}</div>`;
    return;
  }

  const parsed = parseMarkdown(elements.input.value);
  state.meta = parsed.meta;
  state.blocks = parsed.blocks;
  renderBlocks(state.meta, state.blocks);
  if (theme.id === "citrus-punch") {
    enhanceCitrusPunchContent(elements.preview);
  }
}

function sanitizePdfTitle(rawTitle) {
  return String(rawTitle || "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[<>:"/\\|?*]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[.\s]+$/g, "")
    .replace(/\.pdf$/i, "")
    .trim()
    .slice(0, 100)
    .replace(/[.\s]+$/g, "");
}

function getPdfFileName() {
  const rawTitle = elements.title?.textContent?.trim() || "";
  const safeTitle = sanitizePdfTitle(rawTitle);
  return `${safeTitle || "document"}.pdf`;
}

function printWithDocumentTitle() {
  const originalTitle = document.title;
  const filename = getPdfFileName();
  document.title = filename.replace(/\.pdf$/i, "") || "document";

  const restoreTitle = () => {
    document.title = originalTitle;
    window.removeEventListener("afterprint", restoreTitle);
  };

  window.addEventListener("afterprint", restoreTitle, { once: true });
  window.print();
  window.setTimeout(restoreTitle, 1200);
}

function readFile(file) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    elements.input.value = String(reader.result || "");
    updatePreview();
  });
  reader.readAsText(file, "utf-8");
}

renderThemeOptions();
elements.input.value = "";
const initialTheme = resolveTheme(readInitialThemeId());
elements.theme.value = initialTheme.id;
applyUiTheme(initialTheme, { immediate: true });
elements.input.addEventListener("input", updatePreview);
elements.theme.addEventListener("change", updatePreview);
elements.print.addEventListener("click", printWithDocumentTitle);
elements.file.addEventListener("change", (event) => {
  const [file] = event.target.files || [];
  if (file) readFile(file);
});

updatePreview();
