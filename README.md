# TikTok Stash — link-in-bio product page

Free replacement for Linktree. Every product from @ttgadgetstash videos, numbered,
each button opening the product on TikTok Shop through the affiliate share link.

## Add a product
1. In TikTok: product page → Share → Copy link.
2. Run:

       node tools/add.mjs "https://www.tiktok.com/t/XXXX/" --name "Short name" --blurb "One line from the listing" --tag "Gifts for him" --push

   It grabs the photo, gives the product the next number and publishes.
   Say that number in the video: "It's #7 at the link in my bio."

Other commands: `node tools/add.mjs --list` · `node tools/add.mjs --hide 7 --push`

## Rules
- No prices anywhere on the page (TikTok content strike history; prices also change).
- Blurbs only use claims that are on the product listing.
- Always use the share link copied from your own account, so the commission is credited to you.

## Click counts (optional)
Make a free GoatCounter account, put its code (e.g. `ttgadgetstash`) in `"goatcounter"` in
`products.json`. Each tap is then counted as `shop-<number>`.
