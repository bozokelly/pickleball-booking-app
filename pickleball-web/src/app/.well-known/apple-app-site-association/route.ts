import { NextResponse } from 'next/server';

function parseCsv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function GET() {
  const configuredAppIds = parseCsv(process.env.IOS_APP_IDS);
  const legacySingleId = process.env.IOS_APP_ID?.trim();
  const appIDs = configuredAppIds.length > 0
    ? configuredAppIds
    : legacySingleId
      ? [legacySingleId]
      : [];

  const payload = {
    applinks: {
      apps: [],
      details: appIDs.length > 0
        ? [
            {
              appIDs,
              // Keep this broad so shared https links can deep-link into app routes.
              components: [
                { '/': '/game/*' },
                { '/': '/club/*' },
                { '/': '/dashboard/game/*' },
                { '/': '/dashboard/club/*' },
                { '/': '/dashboard/*' },
              ],
            },
          ]
        : [],
    },
  };

  return NextResponse.json(payload, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
