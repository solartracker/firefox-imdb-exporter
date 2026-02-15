// about:debugging#/runtime/this-firefox

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

  // Inject script to get JSON-LD from IMDb page
  const [movie] = await browser.tabs.executeScript(tab.id, {
    code: `
      (() => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const s of scripts) {
          try {
            const data = JSON.parse(s.textContent);
            if (data['@type'] === 'Movie') {
              return {
                url: data.url || null,
                title: data.name || null,
                description: data.description || null,
                image: data.image || null,
                datePublished : data.datePublished || null
              };
            }
          } catch (e) {}
        }
        return null;
      })();
    `
  });

  if (!movie || !movie.url || !movie.title) {
    console.warn("IMDb movie JSON not found on this page");
    return;
  }

  // Extract IMDb ID safely
  const idMatch = movie.url.match(/\/title\/(tt\d+)/);
  if (!idMatch) {
    console.warn("IMDb ID not found in URL:", movie.url);
    return;
  }
  const imdbId = idMatch[1];

  // Sanitize movie title for Windows filenames (safe for folder and NFO)
  let safeTitle = movie.title;
  ['<','>','"',':','/','\\','|','?','*'].forEach(c => {
    safeTitle = safeTitle.split(c).join('_');
  });

  // Subdirectory in the Downloads directory
  const year = movie.datePublished
    ? movie.datePublished.slice(0, 4)
    : null;
  const folderName = "_IMDB/" + imdbId + "-" + safeTitle + "-" + year;

  // Build NFO content (MiniDLNA compatible)
  const nfoContent = `<?xml version="1.0" encoding="utf-8"?>
<movie>
  <title>${xmlEscape(movie.title)}</title>
  <plot>${xmlEscape(movie.description || "")}</plot>
</movie>
`;

  // Create NFO Blob and download
  const nfoBlob = new Blob([nfoContent], { type: "text/xml" });
  const nfoUrl = URL.createObjectURL(nfoBlob);

  await browser.downloads.download({
    url: nfoUrl,
    filename: `${folderName}/${safeTitle}.nfo`,
    saveAs: false
  });

  // Download poster image as folder.jpg
  if (movie.image) {
    await browser.downloads.download({
      url: movie.image,
      filename: `${folderName}/folder.jpg`,
      saveAs: false
    });
  }

  console.log("Download triggered for IMDb ID:", imdbId);
});

