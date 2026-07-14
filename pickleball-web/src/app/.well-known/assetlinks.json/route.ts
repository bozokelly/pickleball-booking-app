import { NextResponse } from 'next/server';

const CURRENT_ANDROID_PACKAGE = 'com.bookadink.app';
const CURRENT_ANDROID_RELEASE_FINGERPRINT =
  'C4:EB:CF:E3:EB:DF:25:CC:A8:C2:5C:33:8C:21:54:5A:E7:37:0F:EE:C1:7A:61:CD:C0:3B:7E:75:01:1A:81:26';

function parseCsv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function GET() {
  const packageName = process.env.ANDROID_APP_PACKAGE?.trim() || CURRENT_ANDROID_PACKAGE;
  const fingerprints = [...new Set([
    CURRENT_ANDROID_RELEASE_FINGERPRINT,
    ...parseCsv(process.env.ANDROID_SHA256_CERT_FINGERPRINTS),
  ])];

  const payload = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: packageName,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ];

  return NextResponse.json(payload, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
