/**
 * Wraps the BGG XML API2 through the local .NET proxy.
 * All thumbnail URLs are rewritten to go through /api/bgg/image
 * so html2canvas can capture them without CORS issues.
 */

const BATCH_SIZE = 20;

/** Rewrite a BGG CDN URL so it goes through our image proxy */
export function proxyImageUrl(url) {
  if (!url) return null;
  return `/api/bgg/image?url=${encodeURIComponent(url)}`;
}

/** Search BGG by name; returns [{id, name, year, thumbnail}] */
export async function searchGames(query) {
  const res = await fetch(`/api/bgg/search?query=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const xml = await res.text();

  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const items = [...doc.querySelectorAll('item')].filter(
    (el) => el.getAttribute('type') === 'boardgame'
  );

  const games = items.slice(0, BATCH_SIZE).map((el) => ({
    id: el.getAttribute('id'),
    name: el.querySelector('name[type="primary"]')?.getAttribute('value') ?? 'Unknown',
    year: el.querySelector('yearpublished')?.getAttribute('value') ?? null,
    thumbnail: null,
  }));

  if (games.length === 0) return [];

  // Batch-fetch thumbnails
  const ids = games.map((g) => g.id).join(',');
  const thingRes = await fetch(`/api/bgg/thing?id=${ids}`);
  if (thingRes.ok) {
    const thingXml = await thingRes.text();
    const thingDoc = new DOMParser().parseFromString(thingXml, 'application/xml');
    const thumbMap = {};
    thingDoc.querySelectorAll('item').forEach((el) => {
      const id = el.getAttribute('id');
      const raw = el.querySelector('thumbnail')?.textContent?.trim();
      thumbMap[id] = raw ? proxyImageUrl(raw) : null;
    });
    games.forEach((g) => {
      g.thumbnail = thumbMap[g.id] ?? null;
    });
  }

  return games;
}

/** Load a user's owned board-game collection; returns [{id, name, year, thumbnail}] */
export async function loadCollection(username) {
  const res = await fetch(`/api/bgg/collection?username=${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error(`Collection request failed: ${res.status}`);
  const xml = await res.text();

  const doc = new DOMParser().parseFromString(xml, 'application/xml');

  // A 202-style message wrapped in XML is returned when BGG queues the request
  const messageEl = doc.querySelector('message');
  if (messageEl) throw new Error(messageEl.textContent?.trim() ?? 'BGG is preparing your collection, please try again.');

  const items = [...doc.querySelectorAll('item')];

  return items.map((el) => {
    const rawThumb = el.querySelector('thumbnail')?.textContent?.trim();
    return {
      id: el.getAttribute('objectid'),
      name: el.querySelector('name')?.textContent?.trim() ?? 'Unknown',
      year: el.querySelector('yearpublished')?.textContent?.trim() ?? null,
      thumbnail: rawThumb ? proxyImageUrl(rawThumb) : null,
    };
  });
}
