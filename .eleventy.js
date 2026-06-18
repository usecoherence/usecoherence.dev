import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const cssHash = createHash("md5")
  .update(readFileSync("src/assets/style.css"))
  .digest("hex")
  .slice(0, 8);

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addGlobalData("cssHash", cssHash);
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
