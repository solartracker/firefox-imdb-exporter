// Simple XML escape function
function xmlEscape(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

browser.browserAction.onClicked.addListener(async (tab) => {
  console.log("Toolbar button clicked! URL:", tab.url);

  // Inject script to get full movie data
  const [movie] = await browser.tabs.executeScript(tab.id, {
    code: `
      (() => {
        try {
          // JSON-LD fallback
          let movie = null;
          const scripts = document.querySelectorAll('script[type="application/ld+json"]');
          for (const s of scripts) {
            try {
              const data = JSON.parse(s.textContent);
              if (data['@type'] === 'Movie') {
                movie = {
                  url: data.url || null,
                  title: data.name || null,
                  description: data.description || null,
                  image: data.image || null,
                  datePublished: data.datePublished || null
                };
              }
            } catch(e) {}
          }

          // Try to get full plot from __NEXT_DATA__
          const nextDataScript = document.querySelector('script#__NEXT_DATA__');
          if (nextDataScript) {
            const json = JSON.parse(nextDataScript.textContent);
            const atf = json.props?.pageProps?.aboveTheFoldData;

            if (atf?.plot?.plotText?.plainText) {
              if (!movie) movie = {};
              movie.description = atf.plot.plotText.plainText;
            }

            if (atf?.primaryImage?.url) {
              movie.image = atf.primaryImage.url;
            }

            if (atf?.releaseYear?.year) {
              movie.datePublished = atf.releaseYear.year.toString();
            }

            if (!movie.url && atf?.id) {
              movie.url = 'https://www.imdb.com/title/' + atf.id + '/';
            }
          }

          return movie || null;
        } catch (e) {
          return null;
        }
      })();
    `
  });

  if (!movie || !movie.url || !movie.title) {
    console.warn("IMDb movie data not found on this page");
    return;
  }

  // Extract IMDb ID safely
  const idMatch = movie.url.match(/\/title\/(tt\d+)/);
  if (!idMatch) {
    console.warn("IMDb ID not found in URL:", movie.url);
    return;
  }
  const imdbId = idMatch[1];

  // Sanitize movie title for Windows filenames
  let safeTitle = movie.title;
  ['<','>','"',':','/','\\','|','?','*'].forEach(c => {
    safeTitle = safeTitle.split(c).join('_');
  });

  // Subdirectory in Downloads
  const year = movie.datePublished ? movie.datePublished.slice(0, 4) : null;
  const folderName = `_IMDB/${imdbId}-${safeTitle}-${year}`;

  // Build NFO content
  const nfoContent = `<?xml version="1.0" encoding="utf-8"?>
<movie>
  <title>${xmlEscape(movie.title)}</title>
  <plot>${xmlEscape(movie.description || "")}</plot>
</movie>
`;

  // Download NFO
  const nfoBlob = new Blob([nfoContent], { type: "text/xml" });
  const nfoUrl = URL.createObjectURL(nfoBlob);
  await browser.downloads.download({
    url: nfoUrl,
    filename: `${folderName}/${safeTitle}.nfo`,
    saveAs: false
  });

  // Download poster image
  if (movie.image) {
    await browser.downloads.download({
      url: movie.image,
      filename: `${folderName}/folder.jpg`,
      saveAs: false
    });
  }

  console.log(`Download triggered for IMDb ID: ${imdbId}`);
});

