export const LINKEDIN_TO_POST_HTML_PROMPT = `Convert the LinkedIn post text below into clean HTML for a portfolio blog post body.

Rules:
1) Output only HTML (no Markdown, no code fences, no explanations).
2) Keep the original language. If the source is Arabic, keep Arabic text exactly and keep writing natural for RTL readers.
3) Use semantic tags only from this set when possible: <p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>, <a>, <blockquote>, <pre>, <code>, <hr>, <br>.
4) Do not include <html>, <head>, <body>, <script>, <style>, <iframe>, or <img>.
5) Convert hashtags into plain text unless they are meaningful section labels.
6) Preserve links as <a href="...">text</a>. Use absolute URLs when available.
7) For inline code, use <code>...</code>.
8) For code blocks, use:
   <pre><code class="language-...">...</code></pre>
   If language is unknown, use class="language-text".
9) Escape HTML-sensitive characters inside code blocks.
10) Keep paragraph spacing readable. Use short paragraphs and lists where needed.
11) If the source has emojis, keep them.
12) Return a polished final HTML fragment ready for direct rendering.

Input LinkedIn text:
{{LINKEDIN_TEXT}}
`;
