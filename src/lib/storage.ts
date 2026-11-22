import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";

/**
 * Neon Object Storage (S3-compatible), wired from the branch-scoped AWS_* env
 * vars. Neon requires path-style addressing — see the neon-object-storage skill.
 */
const BUCKET = process.env.NEON_STORAGE_BUCKET || "aerovel-tickets";

export const isStorageConfigured = () =>
  Boolean(process.env.AWS_ENDPOINT_URL_S3 && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

const config = () => {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || "us-east-2";
  if (!endpoint || !accessKeyId || !secretAccessKey)
    throw new Error("Neon Object Storage credentials are missing.");
  return { endpoint, accessKeyId, secretAccessKey, region };
};

let cached: S3Client | null = null;
const client = () => {
  if (cached) return cached;
  const c = config();
  cached = new S3Client({
    endpoint: c.endpoint,
    region: c.region,
    forcePathStyle: true,
    credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey },
  });
  return cached;
};

const ticketKey = (pnr: string) => `tickets/${pnr.toUpperCase()}.pdf`;

/** Archive a generated e-ticket on the branch that owns the booking. */
export async function putTicket(pnr: string, bytes: Uint8Array) {
  await client().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: ticketKey(pnr),
      Body: bytes,
      ContentType: "application/pdf",
      CacheControl: "private, max-age=0",
    })
  );
  return { bucket: BUCKET, key: ticketKey(pnr) };
}

/** Read an archived ticket, or null when it has not been archived yet. */
export async function getTicket(pnr: string): Promise<Uint8Array | null> {
  try {
    const result = await client().send(new GetObjectCommand({ Bucket: BUCKET, Key: ticketKey(pnr) }));
    if (!result.Body) return null;
    return new Uint8Array(await result.Body.transformToByteArray());
  } catch (err) {
    const status = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404) return null;
    throw err;
  }
}

/** Real write → read → verify → delete round trip for service diagnostics. */
export async function storageRoundTrip() {
  const s3 = client();
  const head = await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
  const key = `health/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
  const payload = JSON.stringify({ service: "aerovel", checkedAt: new Date().toISOString() });
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: payload, ContentType: "application/json",
  }));
  try {
    const result = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const readBack = result.Body ? await result.Body.transformToString() : "";
    if (readBack !== payload) throw new Error("Object Storage read-back mismatch.");
    return {
      bucket: BUCKET,
      key,
      bytes: Buffer.byteLength(payload),
      etag: result.ETag ?? null,
      requestId: head.$metadata.requestId ?? null,
      verified: true,
    };
  } finally {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key })).catch(() => undefined);
  }
}
