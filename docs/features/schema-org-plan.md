# Schema.org Structured Data Plan

## Overview
Add JSON-LD structured data to improve SEO clarity for the portfolio without changing visual output.

## Goals
- Provide clear Person/ProfilePage data for the home page.
- Provide WebSite data globally.
- Add CreativeWork for works pages and Article for writing pages.
- Keep changes localized and easy to remove.

## Scope
In-scope:
- JSON-LD in head via a single partial.
- Mapping from front matter to schema fields.

Out-of-scope:
- SearchAction (no site search).
- Organization (solo portfolio).

## Proposed Schemas
1) **WebSite** (global)
2) **ProfilePage + Person** (home only)
3) **CreativeWork** (works pages)
4) **Article** (writing pages)
5) **BreadcrumbList** (optional, only if we can map cleanly from templates)

## Data Mapping
### WebSite
- `name`: `.Site.Params.title` or `.Site.Title`
- `url`: `.Site.BaseURL`
- `description`: `.Site.Params.description`

### ProfilePage + Person (home)
- `name`: "Torbjörn Hedberg"
- `url`: `.Site.BaseURL`
- `jobTitle`: list of hero roles
- `description`: hero summary
- `sameAs`: add social URLs from config if available
- `address`: Gothenburg, Västra Götaland, SE
- `workLocation`: Gothenburg + Remote

### CreativeWork (works)
- `name`: `.Title`
- `description`: `.Description`
- `dateCreated`: `.Date`
- `creator`: Person
- `keywords`: `.Params.tags`
- `image`: header image if present (absolute URL)

### Article (writing)
- `headline`: `.Title`
- `author`: Person
- `datePublished`: `.Date`
- `dateModified`: `.Lastmod`
- `image`: header image if present (absolute URL)

## Example Payloads
### Person (home)
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Torbjörn Hedberg",
  "url": "https://www.tor-bjorn.com/",
  "jobTitle": ["DesignOps", "Product Designer", "Art Director"],
  "description": "For over 10 years I've moved between strategy and craft...",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Gothenburg",
    "addressRegion": "Västra Götaland",
    "addressCountry": "SE"
  },
  "workLocation": [
    {
      "@type": "Place",
      "name": "Remote"
    },
    {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Gothenburg",
        "addressRegion": "Västra Götaland",
        "addressCountry": "SE"
      }
    }
  ]
}
```

### CreativeWork (work page)
```json
{
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "name": "Utblick no.4",
  "dateCreated": "2015-11-20",
  "keywords": ["design", "editorial design", "illustrations"],
  "image": "https://www.tor-bjorn.com/utblick_africa-0005.jpg",
  "creator": {
    "@type": "Person",
    "name": "Torbjörn Hedberg"
  }
}
```

### Article (writing page)
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Design Systems in Practice",
  "datePublished": "2025-01-15",
  "dateModified": "2025-01-15",
  "author": {
    "@type": "Person",
    "name": "Torbjörn Hedberg"
  }
}
```

## Implementation Steps
1) Create `layouts/partials/schema.html`.
2) Add conditional JSON-LD blocks per page type.
3) Include the partial in `layouts/partials/head.html`.
4) Add config for `sameAs` links if missing (optional).
5) Validate with Rich Results Test.

## Validation
- Google Rich Results Test (home + a work + a writing post).
- Lighthouse SEO audit for home page.

## Rollback
- Remove the `schema.html` partial include from head.
