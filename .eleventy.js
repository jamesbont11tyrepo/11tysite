const { join } = require('node:path');
const { imageSize } = require('image-size');
const escape = require('lodash.escape');

const EleventyImage = require('@11ty/eleventy-img');

function stringifyAttributes(attributeMap) {
    return Object.entries(attributeMap)
        .map(([attribute, value]) => {
            if (value === undefined || value === '') return '';
            return `${attribute}="${value}"`;
        })
        .join(' ');
}

const insertImage = async function (source, alt, classes) {
    source = join('src/images', source);

    const { width } = imageSize(source);

    const data = await EleventyImage(source, {
        widths: [640, 750, 828, 1080, 1200, width]
                    .filter((a) => a <= width)
                    .sort((a, b) => a - b),
        formats: ['avif', 'webp', 'png'],
        outputDir: '_site/assets/images/',
        urlPath: '/assets/images/',
    });

    const getLargestImage = (format) => {
				// Make sure the image format is in the data.
				if (!(format in data)) return false;
				// Get the images of the format.
				const images = data[format];
				// Get the very last image in the array, which is the largest one.
				return images.at(-1);
		};

		// Set a `base` variable to the largest png image.
		const base = getLargestImage('png');
    const sizes = '(min-width: 80ch) 80ch, 100vw';

    const sources = Object.values(data)
        .map((formatEntries) => {
            const { sourceType } = formatEntries[0];
            const srcset = formatEntries
                .map((image) => image.srcset)
                .join(', ');

            return `<source ${stringifyAttributes({
                type: sourceType,
                srcset,
                sizes,
            })}>`;
        })
        .join('\n');

    return `
<picture>
    ${sources}
    <img ${stringifyAttributes({
        height: base.height,
        width: base.width,
        src: base.url,
        class: classes,
        alt: escape(alt),
        decoding: 'async',
        sizes,
    })}>
</picture>
`;
};

module.exports = function(eleventyConfig) {
	eleventyConfig.addPassthroughCopy("src/assets/");
	eleventyConfig.addPassthroughCopy("src/css/");
	eleventyConfig.addWatchTarget("src/css");
	eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);
	eleventyConfig.addPassthroughCopy('robots.txt');
	eleventyConfig.addPassthroughCopy('ai.txt');
	eleventyConfig.addNunjucksAsyncShortcode('image', insertImage);
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