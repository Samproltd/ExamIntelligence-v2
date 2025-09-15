import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlobSASPermissions,
} from '@azure/storage-blob';

// Azure Storage account credentials
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || '';
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || '';
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'resumedrivecontainer';

// Debug Azure config
console.log('Azure Storage config:', {
  accountName: accountName ? `${accountName.substring(0, 3)}...` : 'Not set',
  accountKeyExists: !!accountKey,
  containerName,
});

let blobServiceClient: BlobServiceClient;

try {
  // Create the BlobServiceClient object with connection string
  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
  blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    sharedKeyCredential
  );
  console.log('Azure Blob Storage client initialized successfully');
} catch (error) {
  console.error('Error initializing Azure Blob Storage client:', error);
  console.error('This might be due to missing or invalid Azure Storage credentials');
  // Don't throw here to allow the application to start even if Azure is not configured
  // Instead, we'll handle errors when the upload function is called
}

/**
 * Upload a file to Azure Blob Storage
 * @param file The file buffer to upload
 * @param fileName The name to give the file in Azure
 * @returns URL of the uploaded file
 */
export async function uploadFile(file: Buffer, fileName: string): Promise<string> {
  console.log(`Starting file upload: ${fileName}, size: ${file.length} bytes`);

  // Check if Azure Storage is properly configured
  if (!accountName || !accountKey) {
    console.error('Azure Storage credentials are missing. Check your environment variables.');
    throw new Error('Azure Storage configuration is missing');
  }

  if (!blobServiceClient) {
    console.error('BlobServiceClient is not initialized. Attempting to reinitialize...');
    // Try to initialize again
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      sharedKeyCredential
    );
  }

  try {
    // Get a container client
    console.log(`Getting container client for ${containerName}`);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Check if container exists and create if it doesn't
    console.log('Checking if container exists');
    const containerExists = await containerClient.exists();
    if (!containerExists) {
      console.log(`Creating container ${containerName}...`);
      try {
        await containerClient.create();
        // Set container access policy to allow public access to blobs
        await containerClient.setAccessPolicy('blob');
        console.log(`Container ${containerName} created successfully`);
      } catch (containerError) {
        console.error(`Failed to create container ${containerName}:`, containerError);
        throw new Error(
          `Failed to create container: ${
            containerError instanceof Error ? containerError.message : String(containerError)
          }`
        );
      }
    } else {
      console.log(`Container ${containerName} already exists`);
    }

    // Get a block blob client
    console.log(`Getting block blob client for ${fileName}`);
    const blobClient = containerClient.getBlockBlobClient(fileName);

    console.log(`Uploading file "${fileName}" to Azure Blob Storage...`);
    // Upload file
    try {
      const uploadResponse = await blobClient.upload(file, file.length);
      console.log(`File "${fileName}" uploaded successfully, ETag: ${uploadResponse.etag}`);
    } catch (uploadError) {
      console.error(`Failed to upload blob ${fileName}:`, uploadError);
      throw new Error(
        `Failed to upload blob: ${
          uploadError instanceof Error ? uploadError.message : String(uploadError)
        }`
      );
    }

    // Return the URL
    const blobUrl = blobClient.url;
    console.log(`Generated URL for uploaded blob: ${blobUrl}`);
    return blobUrl;
  } catch (error) {
    console.error('Error uploading file to Azure Blob Storage:', error);

    // More detailed error information for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    throw error;
  }
}

/**
 * Delete a file from Azure Blob Storage
 * @param fileName The name of the file to delete
 */
export async function deleteFile(fileName: string): Promise<void> {
  try {
    console.log(`Deleting file "${fileName}" from Azure Blob Storage...`);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(fileName);
    await blobClient.delete();
    console.log(`File "${fileName}" deleted successfully`);
  } catch (error) {
    console.error('Error deleting file from Azure Blob Storage:', error);
    throw error;
  }
}

/**
 * Get a signed URL for a file in Azure Blob Storage
 * @param fileName The name of the file
 * @param expiryMinutes How long the URL should be valid for (in minutes)
 * @returns A signed URL for the file
 */
export async function getSignedUrl(fileName: string, expiryMinutes: number = 60): Promise<string> {
  try {
    console.log(`Generating signed URL for file "${fileName}"...`);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlockBlobClient(fileName);

    const startsOn = new Date();
    const expiresOn = new Date(startsOn);
    expiresOn.setMinutes(startsOn.getMinutes() + expiryMinutes);

    // Create BlobSASPermissions object with read permission
    const permissions = new BlobSASPermissions();
    permissions.read = true;

    const sasOptions = {
      permissions: permissions,
      startsOn,
      expiresOn,
    };

    const sasToken = await blobClient.generateSasUrl(sasOptions);
    console.log(`Signed URL generated successfully for "${fileName}"`);
    return sasToken;
  } catch (error) {
    console.error('Error generating signed URL from Azure Blob Storage:', error);
    throw error;
  }
}
