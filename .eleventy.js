import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const cssFiles = ["base.css", "layout.css", "content.css", "prism.css"];
const cssHash = createHash("md5");
for (const f of cssFiles) {
  cssHash.update(readFileSync("src/assets/" + f));
}
const hash = cssHash.digest("hex").slice(0, 8);

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(syntaxHighlight, {
    init: function ({ Prism }) {
      Prism.languages.coh = {
        status: {
          pattern: /\b(PASS|FAIL|WARN|BROKEN|UNMAPPED)\b/,
          alias: "important",
        },
        entity: {
          pattern: /\b(SPEC|AC|EVIDENCE|INTENT|LINKS)\b/,
          alias: "keyword",
        },
        path: {
          pattern: /\b(?:app|spec|test|src|lib|crates|packages)\/[\w./-]+\b/,
          alias: "url",
        },
        slug: {
          pattern: /\b[a-z][a-z0-9]*(?:[-/][a-z0-9]+)+\b/,
          alias: "symbol",
        },
      };
    },
  });
  eleventyConfig.addGlobalData("cssHash", hash);
  eleventyConfig.addGlobalData("cssFiles", cssFiles);

  eleventyConfig.addCollection("ideas", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/ideas/*.md")
      .filter(p => p.page.url !== "/ideas/")
      .sort((a, b) => a.page.url.localeCompare(b.page.url));
  });

  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/_headers");

  eleventyConfig.addFilter("split", function(str, sep) {
    return str.split(sep);
  });

  return {
    dir: {
      input: "src",
      output: "public",
      includes: "_includes",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
