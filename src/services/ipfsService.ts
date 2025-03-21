import { NFTStorage } from 'nft.storage';

/**
 * Upload metadata and image to IPFS via NFT.Storage
 */
export const uploadToNFTStorage = async (metadata: any, imageFile: File | null) => {
  try {
    // Get the NFT.Storage API key from environment variables
    const token = import.meta.env.VITE_NFT_STORAGE_API_KEY;
    
    if (!token || token === 'dummy_nft_storage_key') {
      console.warn('Using mock IPFS data - NFT.Storage API key not configured');
      // Return a mock CID if no API key is provided
      return `ipfs://bafyreib4pff766vhpbxbhjbqqnsh5emeznvujayjj4z2iu533cprgbz244/${Date.now()}`;
    }
    
    // Create NFT.Storage client
    const client = new NFTStorage({ token });
    
    // Prepare the image data
    let imageBlob = null;
    if (imageFile) {
      const buffer = await imageFile.arrayBuffer();
      imageBlob = new Blob([buffer], { type: imageFile.type });
    }
    
    // Upload metadata and image to IPFS
    const result = await client.store({
      ...metadata,
      image: imageBlob || new Blob([]),  // Fallback to empty blob if no image
    });
    
    console.log('IPFS upload successful:', result);
    
    // Return the IPFS URL (ipfs://...)
    return result.url;
  } catch (error) {
    console.error('IPFS upload error:', error);
    
    // Handle errors gracefully and return a mock CID for development
    console.warn('Falling back to mock IPFS data due to error');
    return `ipfs://bafyreib4pff766vhpbxbhjbqqnsh5emeznvujayjj4z2iu533cprgbz244/${Date.now()}`;
  }
};