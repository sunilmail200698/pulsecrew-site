# Endeavour Technologies website

Static site (plain HTML/CSS/JS, no build step), rebuilt from the live endeavour-technology.com.

- Pages: `index.html`, `about.html`, `services.html`, `career.html`, `contact.html`
- Styles: `styles.css` · Script: `main.js` · Images: `logos/`, `icons/`
- The contact form is an embedded Google Form (see `contact.html`).

## Edit
Change text directly in the HTML files. The header and footer are repeated in each page, so update all five when you change them.

## Preview
`npx serve .`

## Deploy (Netlify)
Connect this repo in Netlify with base directory `endeavour-site`, no build command, publish directory `.` — or drag-and-drop this folder onto the Netlify site.
