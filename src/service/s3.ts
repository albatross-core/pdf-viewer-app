import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';

export interface S3File {
  key: string;
  lastModified: Date;
  size: number;
  etag: string;
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-central-1'
});

function parseS3ListResponse(xmlText: string): S3File[] {
  const files: S3File[] = [];
  
  // Simple XML parsing for S3 ListObjectsV2 response
  const contentRegex = /<Contents>(.*?)<\/Contents>/gs;
  const keyRegex = /<Key>(.*?)<\/Key>/;
  const lastModifiedRegex = /<LastModified>(.*?)<\/LastModified>/;
  const sizeRegex = /<Size>(\d+)<\/Size>/;
  const etagRegex = /<ETag>"(.*?)"<\/ETag>/;

  let match;
  while ((match = contentRegex.exec(xmlText)) !== null) {
    const content = match[1];
    
    const keyMatch = keyRegex.exec(content);
    const lastModifiedMatch = lastModifiedRegex.exec(content);
    const sizeMatch = sizeRegex.exec(content);
    const etagMatch = etagRegex.exec(content);

    if (keyMatch?.[1] && lastModifiedMatch?.[1] && sizeMatch?.[1] && etagMatch?.[1]) {
      files.push({
        key: keyMatch[1],
        lastModified: new Date(lastModifiedMatch[1]),
        size: parseInt(sizeMatch[1], 10),
        etag: etagMatch[1]
      });
    }
  }

  return files;
}

export async function listPDFFiles(bucketName: string, prefix: string = ""): Promise<S3File[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix || undefined,
    });

    const response = await s3Client.send(command);
    
    if (!response.Contents) {
      return [];
    }

    const files: S3File[] = response.Contents
      .filter(obj => obj.Key && obj.Key.toLowerCase().endsWith('.pdf'))
      .map(obj => ({
        key: obj.Key!,
        lastModified: obj.LastModified || new Date(),
        size: obj.Size || 0,
        etag: obj.ETag?.replace(/"/g, '') || '',
      }));
    
    return files.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  } catch (error) {
    console.error("Error listing S3 files:", error);
    throw new Error("Failed to list files from S3");
  }
}

export async function getS3FileStream(bucketName: string, key: string): Promise<Response> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error("No file content received from S3");
    }

    // Convert the AWS SDK stream to a web stream
    const stream = response.Body.transformToWebStream();

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${key.split('/').pop()}"`,
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': response.ContentLength?.toString() || '',
      },
    });
  } catch (error) {
    console.error("Error streaming S3 file:", error);
    throw new Error("Failed to stream file from S3");
  }
}

// Simplified version without authentication for public buckets
export async function listPDFFilesSimple(bucketName: string, prefix: string = ""): Promise<S3File[]> {
  try {
    // Use global S3 endpoint which handles region redirects automatically
    const url = `https://${bucketName}.s3.amazonaws.com/?list-type=2${prefix ? `&prefix=${encodeURIComponent(prefix)}` : ''}`;
    
    const response = await fetch(url, {
      redirect: 'follow' // Follow redirects automatically
    });
    
    if (!response.ok) {
      throw new Error(`S3 API error: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    const files = parseS3ListResponse(xmlText);
    
    return files
      .filter(file => file.key.toLowerCase().endsWith('.pdf'))
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  } catch (error) {
    console.error("Error listing S3 files:", error);
    throw new Error("Failed to list files from S3");
  }
}

export async function getS3FileStreamSimple(bucketName: string, key: string): Promise<Response> {
  try {
    // Use global S3 endpoint which handles region redirects automatically
    const url = `https://${bucketName}.s3.amazonaws.com/${encodeURIComponent(key)}`;
    
    const response = await fetch(url, {
      redirect: 'follow' // Follow redirects automatically
    });
    
    if (!response.ok) {
      throw new Error(`S3 API error: ${response.status} ${response.statusText}`);
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${key.split('/').pop()}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error("Error streaming S3 file:", error);
    throw new Error("Failed to stream file from S3");
  }
}