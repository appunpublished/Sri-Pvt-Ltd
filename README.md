# SRI PVT LTD — Professional Construction Website + CMS

## Architecture

- Static frontend: HTML/CSS/JavaScript
- Hosting: GitHub Pages
- Authentication: Firebase Authentication
- CMS database: Cloud Firestore
- Image uploads: Cloudinary unsigned upload preset
- Enquiries: WhatsApp click-to-chat
- Maps: Google Maps embed
- No custom server required for V1

## Admin URL

`https://YOUR-DOMAIN/admin/`

## Firebase setup

1. Enable Authentication → Email/Password.
2. Create the administrator user.
3. Copy the Firebase Authentication UID.
4. In Firestore create:

```text
admins
  └── ADMIN_UID
       active: true
       role: "admin"
```

5. Deploy `firestore.rules`.
6. Sign in at `/admin/`.

The public website reads only documents where `published == true`.

## Cloudinary

Already configured in `config.js` with the supplied Cloudinary Cloud Name and unsigned upload preset.

Recommended preset restrictions:
- Unsigned
- JPG/JPEG/PNG/WebP
- Maximum 8 MB
- Restricted upload preset
- Folder: `sri-pvt-ltd/website`

The API Secret must never be placed in this repository.

## Content collections

```text
admins
siteSettings/main
siteSettings/seo
services
projectCosts
cities
testimonials
media
```

## SEO

The site includes:
- Semantic HTML
- One primary H1
- Descriptive title/meta description
- Canonical URL
- Open Graph metadata
- Schema.org GeneralContractor data
- Robots file
- XML sitemap
- Mobile responsive layout
- Accessible navigation and form labels

Replace all placeholder business/location data before launch. Do not keyword-stuff the site.

## GitHub Pages

Push the repository to GitHub and enable Pages from the main branch/root.

Then update:
- `config.js` → `site.url`
- `index.html` → canonical/OG URL
- `robots.txt`
- `sitemap.xml`

## Out of scope

- Payment gateway
- E-commerce
- Customer accounts
- Online booking
- CRM
- WhatsApp Business API automation
- AI chatbot
- Secure Cloudinary deletion/management API
- Custom backend
- Advanced analytics dashboards
- Paid advertising
- Monthly SEO campaign
