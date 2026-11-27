# Turnstile: Event Booking Platform (Task 3)

A ticketing website for 14 events across South Africa (concerts, festivals, comedy, tech conferences, hikes, markets and workshops). Visitors search and filter events, read full details, choose ticket types, book with a validated form and a payment UI, and get an e-ticket with an entry code.

**Tech:** HTML5, CSS3 (custom properties, grid, CSS masks for the ticket notches), vanilla JavaScript, LocalStorage. No frameworks and no build step.

## Brief checklist

| Requirement | Where |
|---|---|
| Homepage: hero, featured/upcoming events, categories, call-to-action buttons | `index.html` |
| Event listing: poster, name, date and time, venue, price, short description | `events.html` (data in `js/data.js`) |
| Event details: full information, schedule, organiser, venue, ticket information | `event.html?id=1` |
| Booking form: name, contact details, number of tickets, choose event, submit | `book.html` |
| Form validation | Full name, email, SA mobile number, at least one ticket, no more than the tickets left (maximum 10), terms checkbox |
| Search by name | Search box on the homepage and listing page |
| Filter by category, date and type | Category chips, city, date range (this weekend, next 7 days, next 30 days, later), price, sort, hide sold-out |
| Responsive design | Tested at 360px, 768px and 1366px |
| Navigation bar and footer with social/contact links | Shared, rendered by `js/common.js` |

## Bonus features included

- **Event countdown timer** on the homepage featured ticket and on every event page
- **Ticket confirmation page** with an e-ticket, an entry code, **Add to calendar** (`.ics` download) and print styles
- **Payment UI**: card (with number formatting, a Luhn check, expiry and CVC validation), Instant EFT and SnapScan. It's a demo, so no payment is taken; test card `4242 4242 4242 4242`
- **Event categories** with counts on the homepage
- **My tickets** page with upcoming and past bookings
- **Live availability**: tickets left go down after you book, and sold-out events can't be booked
- **Free events** skip the payment step
- **Dark mode**, remembered between visits
- **Shareable filter URLs** (e.g. `events.html?city=Durban&when=month`)

Event dates are counted from today, so the demo always has upcoming events. To use fixed dates, give an event `date: "2027-02-14"` in `js/data.js`.

## Folder structure

```
events/
├── index.html          Homepage
├── events.html         Listing with search and filters
├── event.html          Event details (?id=)
├── book.html           Booking and payment (?id=&t=)
├── confirmation.html   E-ticket (?ref=)
├── my-tickets.html     All bookings
├── 404.html            Not-found page
├── css/styles.css
├── js/
│   ├── data.js         Events and categories
│   ├── common.js       Header, footer, theme, storage, ticket cards
│   ├── home.js, events.js, event.js, book.js, tickets.js
└── assets/posters/     Event posters (SVG) and favicon
```

## Design

Everything is shaped like a ticket: event cards have a perforated stub showing the date, with notches cut out of the edges. Ink navy, poster red, sunflower and mint, with Archivo in its extra-wide cut for headings.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to AWS

### Option A: AWS Amplify Hosting (easiest)

1. Sign in to the AWS Console and open **AWS Amplify**.
2. Choose **Create new app**, then **Deploy without Git**, then **Next**.
3. App name: `turnstile-events`. Branch name: `main`.
4. For **Method**, choose **Drag and drop**, then drop **`turnstile-events.zip`** (this zip, as it is: `index.html` is already at the top level).
5. Choose **Save and deploy**, then open the domain shown on the app's overview page.

Optional custom 404 page: **Hosting → Rewrites and redirects → Manage redirects**, then add source `/<*>`, target `/404.html`, type `404 (Rewrite)`.

To update the site later, zip the files again and drag the zip onto the app's deployment page.

### Option B: Amazon S3 static website (+ CloudFront for HTTPS)

1. Create an S3 bucket, e.g. `turnstile-events-<yourname>`, in a nearby region such as `af-south-1` (Cape Town).
2. Upload the files so `index.html` sits at the top of the bucket. With the AWS CLI, run this from inside the unzipped folder:
   ```bash
   aws s3 sync . s3://turnstile-events-<yourname> --delete --exclude "README.md" --exclude "screenshots/*"
   ```
3. Bucket → **Properties** → **Static website hosting** → Enable. Index document: `index.html`. Error document: `404.html`.
4. Bucket → **Permissions** → turn off **Block all public access**, and add this bucket policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Sid": "PublicReadGetObject",
       "Effect": "Allow",
       "Principal": "*",
       "Action": "s3:GetObject",
       "Resource": "arn:aws:s3:::turnstile-events-<yourname>/*"
     }]
   }
   ```
5. Open the bucket website endpoint shown under Static website hosting (HTTP only). For HTTPS, put a **CloudFront** distribution in front of the bucket, with `index.html` as the default root object.

## Notes

- **No backend:** bookings, orders and results are saved in the visitor's browser with `localStorage`, so they stay on that device only. Sign-in and payment screens are UI only, with no real passwords stored and no payment taken.
- **Images** are original SVG illustrations made for this project. To use real photos, replace the files in `assets/` or change the image paths in `js/data.js`.
- **Screenshots** in `screenshots/` were taken without the Google Fonts loaded, so the lettering on the live site looks a little different.
