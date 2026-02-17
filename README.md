# firefox-imdb-exporter

A lightweight Firefox WebExtension that exports IMDb movie metadata into
a structured local folder containing:

-   `.nfo` XML file (MiniDLNA / Kodi compatible)
-   `folder.jpg` poster image
-   Full plot (non-truncated)
-   IMDb ID (tt number)
-   Release year

Designed for local media server workflows.

------------------------------------------------------------------------

## Features

-   Extracts full movie metadata from IMDb
-   Uses `__NEXT_DATA__` to avoid truncated plots
-   Retrieves:
    -   Title
    -   Full plot
    -   IMDb ID (ttXXXXXXX)
    -   Release year
    -   Primary poster image
-   Creates structured output:

```{=html}
<!-- -->
```
    Downloads/
    └── _IMDB/
        └── tt1234567-Movie Title-1999/
            ├── Movie Title.nfo
            └── folder.jpg

-   Silent operation (no popups required)
-   Compatible with Firefox and Tor Browser

------------------------------------------------------------------------

## Installation (Firefox)

1.  Open Firefox.
2.  Navigate to:

```{=html}
<!-- -->
```
    about:debugging#/runtime/this-firefox

3.  Click **Load Temporary Add-on...**
4.  Select the `manifest.json` file from this repository.

------------------------------------------------------------------------

## Installation (Tor Browser)

1.  Open:

```{=html}
<!-- -->
```
    about:debugging#/runtime/this-firefox

2.  Load `manifest.json`.
3.  Then open:

```{=html}
<!-- -->
```
    about:addons

4.  Enable the extension.

Note: The extension must be reloaded after restarting Tor Browser.

------------------------------------------------------------------------

## Usage

1.  Open any IMDb movie page:

```{=html}
<!-- -->
```
    https://www.imdb.com/title/tt0116213/

2.  Click the extension toolbar icon.
3.  The exporter will:
    -   Extract metadata
    -   Generate an NFO file
    -   Download the poster image
    -   Create a structured folder in your Downloads directory

------------------------------------------------------------------------

## Output Format

Example `.nfo` structure:

``` xml
<?xml version="1.0" encoding="utf-8"?>
<movie>
  <title>Movie Title</title>
  <plot>Full plot text...</plot>
</movie>
```

Poster image is saved as:

    folder.jpg

------------------------------------------------------------------------

## Technical Notes

-   Full plot is extracted from `__NEXT_DATA__`
-   JSON-LD used as fallback
-   Unsafe filename characters are sanitized
-   Year derived from `datePublished` or `releaseYear`
-   IMDb ID parsed from canonical URL

------------------------------------------------------------------------

## License

MIT License
