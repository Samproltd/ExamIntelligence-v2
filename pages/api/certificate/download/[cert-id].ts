// OLD CODE===========================

// import path from 'path';
// import fs from 'fs';
// import { NextApiRequest, NextApiResponse } from 'next';

// export default function handler(req: NextApiRequest, res: NextApiResponse) {
//   const filename = req.query['cert-id'] as string;

//   const filePath = path.join(process.cwd(), 'certificates_gen', filename);

//   if (!fs.existsSync(filePath)) {
//     return res.status(404).json({ message: 'File not found' });
//   }

//   res.setHeader('Content-Type', 'application/pdf');
//   res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

//   const fileStream = fs.createReadStream(filePath);
//   fileStream.pipe(res);
// }

// Updated CODE===========================

// pages/api/certificate/download/[filename].ts

import { BlobServiceClient } from '@azure/storage-blob';
import { NextApiRequest, NextApiResponse } from 'next';

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

// Build connection string
const connectionString = `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`;

const AZURE_STORAGE_CONNECTION_STRING = connectionString!;
const CONTAINER_NAME = containerName;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get the filename from the URL and handle potential .pdf extension
  let filename = req.query['cert-id'] as string;

  // Clean up the filename - remove .pdf extension if present
  if (filename && filename.endsWith('.pdf')) {
    filename = filename.replace('.pdf', '');
  }

  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ error: 'Filename required' });
  }

  console.log(`Attempting to download certificate: ${filename}`);

  try {
    // Verify environment variables are set
    if (!AZURE_STORAGE_CONNECTION_STRING || !CONTAINER_NAME) {
      console.error('Azure storage configuration missing');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      AZURE_STORAGE_CONNECTION_STRING
    );
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    // First check if the file exists with the exact name
    let blobClient = containerClient.getBlobClient(filename);
    let exists = await blobClient.exists();

    // If not found, try with .pdf extension
    if (!exists) {
      blobClient = containerClient.getBlobClient(`${filename}.pdf`);
      exists = await blobClient.exists();
    }

    if (!exists) {
      console.error(`Certificate not found: ${filename}`);
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const downloadBlockBlobResponse = await blobClient.download();

    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');

    downloadBlockBlobResponse.readableStreamBody?.pipe(res);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Failed to download file' });
  }
}
