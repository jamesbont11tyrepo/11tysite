const POST_FILE_NAME_RE = /^(?:\/posts)?(\/.+)/;

module.exports = () => ({
  eleventyComputed: {
   permalink: (data) => {
      if (data.permalink !== undefined && data.permalink !== "") {
        return data.permalink;
      }

      const { filePathStem } = data.page;

      const matches = POST_FILE_NAME_RE.exec(filePathStem);
      if (matches === null) {
        return data.permalink;
      }

      return matches[1] + "/";
    }, // take the stem (no extension), lop off the `posts/` at the start, and add a `/`
  },
});