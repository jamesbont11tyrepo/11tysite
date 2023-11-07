module.exports = function(eleventyConfig) {
	eleventyConfig.addPassthroughCopy("src/assets/");
	eleventyConfig.addPassthroughCopy("src/css/");
	eleventyConfig.addWatchTarget("src/css");
	eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);
	eleventyConfig.addPassthroughCopy('robots.txt');
	eleventyConfig.addCollection("posts", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/posts/**/*.md")
})
	eleventyConfig.addCollection("postsByYear", collection => {
    const grouped = {}
    for (const post of collection.getFilteredByGlob("src/posts/**/*.md")) {
        const year = post.date.getFullYear()

        if (!grouped.hasOwnProperty(year)) {
            grouped[year] = []
        }

        grouped[year].push(post)
    }

    const pairs = Object.entries(grouped)
    return pairs.reverse()
	})
	eleventyConfig.addCollection("postsByMonth", collection => {
    const grouped = {}
    for (const post of collection.getFilteredByGlob("src/posts/**/*.md")) {
        const year = post.date.getFullYear()
        const month = post.date.getMonth()

        const index = `${year}/${(month + 1).toString(10).padStart(2, "0")}`

        if (!grouped.hasOwnProperty(index)) {
            grouped[index] = []
        }

        grouped[index].push(post)
    }

    const pairs = Object.entries(grouped)
    return pairs.reverse()
})
	eleventyConfig.addFilter("getAllTags", collection => {
    let tagSet = new Set();
    for(let item of collection) {
        (item.data.tags || []).forEach(tag => tagSet.add(tag));
    }
    return Array.from(tagSet);
});
	
	return {
		dir: {
			input: 'src',
			includes: '_includes',
			output: '_site',
		},
		templateFormats: ['md', 'njk', 'html'],
		markdownTemplateEngine: 'njk',
		htmlTemplateEngine: 'njk',
		dataTemplateEngine: 'njk',
	};
}