browser.browserAction.onClicked.addListener((tab) => {
  console.log("Extension button clicked:", tab.url);

  browser.tabs.executeScript(tab.id, {
    code: `
      (() => {
        const meta = document.querySelector(
          'meta[property="og:image"], meta[property="og:image:secure_url"], meta[name="og:image"]'
        );
        return meta ? meta.content : null;
      })();
    `
  }).then(results => {
    const imageUrl = results[0];
    console.log("Found image URL:", imageUrl);

    if (!imageUrl) {
      console.warn("No og:image meta tag found.");
      return;
    }

    browser.downloads.download({
      url: imageUrl,
      filename: "og-image.jpg",
      saveAs: true
    });
  }).catch(err => {
    console.error("executeScript failed:", err);
  });
});

