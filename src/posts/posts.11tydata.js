module.exports = () => ({
  eleventyComputed: {
    permalink: (data) => data.page.filePathStem.slice(6) + "/", // take the stem (no extension), lop off the `posts/` at the start, and add a `/`
  }
});