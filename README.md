# Screenroom — genres and ratings

GitHub Pages frontend: https://macciohk.github.io/screenroom/

The previous Pages files are preserved on `v1.0-pages`; the original application source remains on `v1.0` and `main`.

## Features

- One global genre filter, default ALL, shared by every catalogue and saved-list tab.
- All 19 current JustWatch categories: kids/family, animation, horror, mystery/thriller, comedy, action/adventure, science fiction, fantasy, romance, crime, documentary, drama, war/military, western, sport, history, reality TV, music/musical, and made in Europe. Made in Europe is a production-origin category rather than a genre.
- ALL applies no genre restriction and also includes entries without genre metadata. The full source taxonomy was checked on 2026-11-15; the fixture in tests records the checked list.
- Family requires the family genre, excludes horror/thriller and requires a recognized low-age classification. Unknown or higher-age classifications are excluded. PG and other low-age labels still require judging suitability for the child's age.
- IMDb score out of 10 where available, otherwise TMDB. No score is invented for unrated titles. IMDb vote counts and source links appear in the detail view.
- Catalogue filtering takes place at the source before the top-100 pool is selected. The Family age/exclusion rules are then applied to the returned pool. Lucky draws contain up to 60 qualifying unique titles.
- Saved items without genre metadata remain available under ALL. Matching items receive fresh metadata when they are returned by a live catalogue query.

## Run checks

Use Node.js 22 or later from the repository root:

```sh
node tests/genres-ratings.test.mjs
node --check app.js
node backend/build.mjs
```

The frontend is published from the `gh-pages` branch root. It reads `config.js` for the separate public API origin. GitHub Pages cannot execute the backend; `backend/` contains its source and standalone build script. The API uses public JustWatch catalogue data and exposes no account credentials. IP lookup results stay in the browser and are not sent to this API.

## Complete-set coverage

Let U be the returned catalogue pool for the same region, provider and search (or the saved-list pool in a personal tab). ALL imposes no genre restriction. Let C be the union of the actual named category predicates, including the stricter Family predicate. Others is U minus C. It includes unknown/future genre codes, untagged titles, and family-only titles that do not pass Family's classification rule unless they also match another named category. A title with any recognized matching category is excluded from Others even if it also has an unknown tag.

C and Others are disjoint and their union is U. Others may legitimately be empty. Coverage counts are calculated from the same unfiltered source response; no additional upstream genre restriction is applied to Others. Up to 100 movies and 100 series are fetched per search, plus the trend pools: these are not an exhaustive platform inventory.
