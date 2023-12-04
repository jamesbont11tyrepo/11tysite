const { join } = require('node:path');
const { DateTime } = require("luxon");
const { imageSize } = require('image-size');
const escape = require('lodash.escape');
const EleventyImage = require('@11ty/eleventy-img');
const pluginRss = require("@11ty/eleventy-plugin-rss");

function stringifyAttributes(attributeMap) {
    return Object.entries(attributeMap)
        .map(([attribute, value]) => {
            if (value === undefined || value === '') return '';
            return `${attribute}="${value}"`;
        })
        .join(' ');
}

const insertImage = async function (source, alt, enableLink) {
    source = join('src/images', source);

    const { width } = imageSize(source);

    const data = await EleventyImage(source, {
        widths: [400, 600, 1000]
                    .filter((a) => a <= width)
                    .sort((a, b) => a - b),
        formats: ['webp', 'png'],
        sharpWebpOptions: {
        	lossless: true,
        	quality: 100,
        },
        
        sharpPngOptions: {
        	quality: 93,
        },
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
        
  	const getImageOfWidth= (format, width) => {
				// Make sure the image format is in the data.
				if (!(format in data)) return false;
				// Get the images of the format.
				const images = data[format];
				// Get the image with the matching width.
				return images.find((image) => image.width === width) || false;
		};
		getImageOfWidth('webp', 1000);

    return `
${enableLink ? `<a href="${(getImageOfWidth('webp', 1000) || base).url}">` : ''}
<picture>
    ${sources}
    <img ${stringifyAttributes({
        height: base.height,
        width: base.width,
        src: base.url,
        alt: escape(alt),
        decoding: 'async',
        sizes,
    })}>
</picture>
${enableLink ? `</a>` : ''}
`;
};

module.exports = function(eleventyConfig) {
	eleventyConfig.addPassthroughCopy("src/assets/");
	eleventyConfig.addPassthroughCopy("src/css/");
	eleventyConfig.addPassthroughCopy("src/favicon.ico");
	eleventyConfig.addWatchTarget("src/css");
	eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);
	eleventyConfig.addFilter("postDate", (dateObj) => {
  	return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_HUGE);
})
	eleventyConfig.addPassthroughCopy('robots.txt');
	eleventyConfig.addPassthroughCopy('ai.txt');
	eleventyConfig.addNunjucksAsyncShortcode('image', insertImage);
	eleventyConfig.addPlugin(pluginRss);
	eleventyConfig.addCollection("bauwerks", function (collection) {
  return collection.getAll().filter((item) => item.data.category === "bauwerks");
})
	eleventyConfig.addCollection("postsByYear", collection => {
    const grouped = {}
    for (const post of collection.getAll().filter((item) => item.data.category)) {
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
    for (const post of collection.getAll().filter((item) => item.data.category)) {
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