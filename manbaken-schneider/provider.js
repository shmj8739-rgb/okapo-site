/* Replace load() with an authorized JSON endpoint later; keep the same schema.
   Do not insert API secrets in browser code. No automatic JRA scraping. */
globalThis.RaceProvider={async load(){return JSON.parse(JSON.stringify(globalThis.RACE_DATA));}};
