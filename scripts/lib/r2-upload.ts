import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFile } from 'fs/promises';

/**
 * Create an S3Client configured for Cloudflare R2.
 *
 * R2 pitfall: CRC32 checksums are not supported. Must use WHEN_REQUIRED
 * for both requestChecksumCalculation and responseChecksumValidation
 * to avoid checksum-related errors from the AWS SDK.
 */
export function createR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId) {
    throw new Error(
      'Missing R2_ACCOUNT_ID environment variable. ' +
        'Find it in Cloudflare Dashboard -> R2 -> Account ID (right sidebar).',
    );
  }
  if (!accessKeyId) {
    throw new Error(
      'Missing R2_ACCESS_KEY_ID environment variable. ' +
        'Create an API token at Cloudflare Dashboard -> R2 -> Manage R2 API Tokens.',
    );
  }
  if (!secretAccessKey) {
    throw new Error(
      'Missing R2_SECRET_ACCESS_KEY environment variable. ' +
        'Copy the secret from the API token creation page.',
    );
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    // CRITICAL: R2 does not support CRC32 checksums; must use WHEN_REQUIRED
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
}

/**
 * Upload a local file to Cloudflare R2.
 *
 * @param localPath   - Absolute or relative path to the file to upload
 * @param key         - R2 object key (e.g. "books/my-book/my-book.pdf")
 * @param contentType - MIME type (e.g. "application/pdf")
 * @returns           - The storage key on success
 */
export async function uploadToR2(
  localPath: string,
  key: string,
  contentType: string,
): Promise<string> {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error(
      'Missing R2_BUCKET_NAME environment variable. ' +
        'Create a bucket at Cloudflare Dashboard -> R2 -> Create bucket.',
    );
  }

  const client = createR2Client();

  let body: Buffer;
  try {
    body = await readFile(localPath);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to read file for R2 upload: ${localPath} — ${msg}`);
  }

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`R2 upload failed for key "${key}": ${msg}`);
  }

  return key;
}
