---
layout: layout.njk
title: Style Lab
permalink: /style-lab/
description: Visual test page for Coherence colors and code highlighting.
---

# Style Lab

Use this page to check whether the site palette is readable. Toggle theme and palette, then inspect tokens and code samples below.

<script>
  const themeTokens = ["--bg", "--ink", "--muted", "--line", "--accent", "--panel", "--code-bg", "--pre-bg", "--pre-ink"];
  const codeTokens = ["--code-keyword", "--code-symbol", "--code-path", "--code-status", "--code-string", "--code-comment", "--semantic-success", "--semantic-warning", "--semantic-danger", "--semantic-info"];

  function renderTokens(selector, tokens) {
    const el = document.querySelector(selector);
    if (!el) return;
    const styles = getComputedStyle(document.documentElement);
    el.innerHTML = tokens.map(name => {
      const value = styles.getPropertyValue(name).trim();
      if (!value) return "";
      return `<div class="token-card">
        <div class="token-swatch" style="background:${value}"></div>
        <code>${name}</code>
        <small>${value}</small>
        <p style="color:${value}">Readable text sample</p>
      </div>`;
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderTokens("[data-theme-tokens]", themeTokens);
    renderTokens("[data-code-tokens]", codeTokens);
  });
</script>

<style>
  .token-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin: 2rem 0;
  }

  .token-card {
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 1rem;
    background: var(--panel);
  }

  .token-card code {
    display: block;
    margin-bottom: 0.25rem;
  }

  .token-card small {
    display: block;
    color: var(--muted);
    font-size: 0.78rem;
    margin-bottom: 0.75rem;
  }

  .token-card p {
    margin: 0;
    max-width: none;
  }

  .token-swatch {
    height: 3.5rem;
    border-radius: 10px;
    border: 1px solid var(--line);
    margin-bottom: 0.75rem;
  }

  .style-lab h2 {
    margin-top: 3rem;
  }

  .sample-card {
    max-width: 380px;
    padding: 1rem 1.25rem;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--panel);
    margin: 2rem 0;
  }

  .sample-card strong {
    display: block;
    margin-bottom: 0.35rem;
    color: var(--accent);
  }

  .sample-card p {
    margin: 0.15rem 0;
    max-width: none;
    color: var(--ink);
  }
</style>

<section class="style-lab">
  <h2>Theme tokens</h2>
  <div class="token-grid" data-theme-tokens></div>

  <h2>Code tokens</h2>
  <div class="token-grid" data-code-tokens></div>

  <h2>Coherence DSL</h2>

```coh
SPEC product/url-shortener/create-short-url

AC accepts-valid-http-url
AC rejects-invalid-url
AC generates-unique-short-code

EVIDENCE bundle exec rspec spec/requests/short_urls_spec.rb:12

FAIL RSpec failed
```

  <h2>Real UI sample</h2>

  <div class="sample-card">
    <strong>Broken claim</strong>
    <p>SPEC product/url-shortener/create-short-url</p>
    <p>AC rejects-invalid-url</p>
  </div>
</section>
