# Kaaya: fine jewellery website and CMS

A premium jewellery storefront with an interactive 3D hero and scroll animations, plus an admin panel that controls every page, product, colour, font and integration on the site.

## Tech stack

- **Next.js 15 (App Router) + React 19 + TypeScript**
- **Tailwind CSS v4**, with theme colours and fonts driven by CSS variables set from the admin panel
- **Framer Motion + Lenis** for text reveals, parallax, the pinned horizontal scroll, the scroll-lit manifesto, the magnetic buttons and smooth scrolling
- **Three.js / React Three Fiber / drei** for the procedurally modelled 3D ring (hero and configurator). No model files are needed, and it falls back to an image when WebGL is unavailable.
- **Prisma + SQLite** (you can switch to Postgres or MySQL by changing `provider` in `prisma/schema.prisma`)
- Admin sessions use JWT (jose) and bcrypt

## Quick start

```bash
cp .env.example .env      # then edit AUTH_SECRET and the admin credentials
npm install
npm run setup             # creates the database and seeds demo content
npm run dev
```

- Website: http://localhost:3000
- Admin: http://localhost:3000/admin. Log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` (defaults: `admin@kaaya.in` / `admin12345`). **Change the password after your first login** (Site settings → Your password).

For production, run `npm run build` and then `npm start`.

## Website pages

| Route | What it is |
| --- | --- |
| `/` | Home page, built from sections in the admin panel |
| `/shop`, `/shop/[slug]` | Catalogue with collection, metal and sort filters and search, plus product detail pages |
| `/collections`, `/collections/[slug]` | Collection index and individual collection pages |
| `/journal`, `/journal/[slug]` | Blog / stories |
| `/checkout`, `/order/[number]` | Bag → checkout (coupons, gift wrap, saved addresses, PIN-code check, COD or Razorpay) → order page with tracking timeline, GST invoice PDF and return/exchange requests |
| `/account` | OTP sign-in (email or mobile) → orders, wishlist, saved addresses, appointments, profile |
| `/wishlist`, `/track` | Wishlist (works for guests too, merges on sign-in) and guest order tracking by order number + email/phone |
| `/stores`, `/book` | Boutique locator (city filter, nearest-to-me, map) and appointment booking: store visit, try at home, video call |
| `/[slug]` | Any CMS page you create (Atelier, Contact and Client care are seeded) |

## Admin panel

| Area | What you can do |
| --- | --- |
| **Pages** | Visual page builder: add, reorder (drag), hide, duplicate and edit 20 section types, with a live desktop/mobile preview and SEO fields |
| **Products / Collections** | Full catalogue management: images, stock, specs, featured and published flags, bulk actions. **Pricing & variants**: fixed price with metal/quality surcharges, or live pricing (weight × today's metal rate + stones + making charges + GST), plus ring/bangle sizes. **Certification**: IGI/GIA report no. + file, BIS HUID |
| **Reviews** | Moderate customer reviews (verified-buyer badge is automatic) |
| **Returns / Customers / Coupons** | Return & exchange requests with customer notifications; customer list with spend; percentage / flat coupons with limits and dates |
| **Appointments / Boutiques** | Confirm visits, add video-call links, notify customers; manage store locator entries |
| **Store settings** | GST %, GSTIN, invoice prefix, HSN, EMI display, gift wrap fee, delivery rules (PIN prefixes, express days, COD limit), return window, appointment slots, review moderation, ring sizes |
| **Journal** | Markdown editor with preview |
| **Media library** | Drag-and-drop uploads, alt text, reuse anywhere |
| **Navigation** | Header menu and footer columns |
| **Theme** | 5 presets, every colour, heading/body fonts, corner radius, button style, width, and toggles for animations, smooth scroll, cursor, grain, preloader and 3D |
| **Site settings** | Brand, logo, contact, currency, shipping, announcement bar, SEO, backup export |
| **Orders / Inquiries** | Order fulfilment and payment status, contact and appointment inbox, newsletter subscribers (CSV export) |
| **Integrations** | Razorpay, WhatsApp, per-gram metal rates (manual or any JSON API — they drive product prices), SMS (Fast2SMS / Twilio), Shiprocket (serviceability, shipments + AWB, live tracking), GA4 / GTM / Meta Pixel, SMTP email, webhooks (Zapier/Make/n8n), custom head/body code |
| **API keys** | Generate read or read+write keys for the REST API |
| **Users** | Admin and editor roles |

### Section types

Hero (3D jewel / full image / editorial split), Marquee, Manifesto (scroll-lit text), Collections (pinned horizontal scroll / grid), Product grid, Image + text, 3D configurator, Process steps, Stats (count-up), Testimonials, Gallery, Journal posts, Image banner, Call to action, Newsletter, FAQ, Page header, Rich text, Contact form, Custom HTML.

In any heading, wrap words in `*asterisks*` to render them in the italic accent colour.

## Customer notifications & sign-in

- Customers receive email (SMTP) and SMS (if configured) for order confirmation, status changes (with courier/AWB), returns and appointments.
- **OTP sign-in needs SMTP (email) or an SMS provider (mobile) in production.** In development without them, the code is shown on screen so you can test.
- Order pages and invoices are private: visible to the signed-in owner, admins, or via the secret link in the confirmation email.

## REST API

Create a key in **Admin → API keys**, then send it in the `x-api-key` header:

```bash
curl https://yoursite.com/api/v1/products -H "x-api-key: kya_…"
```

`GET /api/v1/{products|collections|posts|pages}[/:idOrSlug]`, `GET /api/v1/settings`, and with a write-scoped key `POST/PATCH /api/v1/products`, `GET/PATCH /api/v1/orders`, `POST /api/v1/inquiries`.

## Deployment notes

- SQLite and local uploads (`UPLOAD_DIR`) need a server with a persistent disk, such as a VPS, Railway, Render or Fly.io with a volume.
- For serverless hosting (e.g. Vercel), switch Prisma to Postgres and use external storage for uploads.
- Always set a long random `AUTH_SECRET` in production.
- The demo product photos load from Unsplash. Replace them with your own photography from the admin panel. Any image that fails to load shows an elegant placeholder instead of a broken image.
