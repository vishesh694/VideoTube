function extractPublicIdFromUrl(url) {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname; // e.g. /demo/image/upload/v1717220000/video_thumbnails/my-image.jpg

        // Split the path and remove version & extension
        const parts = pathname.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1) return null;

        // Slice after "upload" and remove version number
        const publicIdParts = parts.slice(uploadIndex + 1);
        if (publicIdParts[0].startsWith('v')) {
            publicIdParts.shift();
        }

        // Remove file extension (e.g., .jpg, .png)
        const fileName = publicIdParts.pop();
        const fileNameWithoutExt = fileName.split('.').slice(0, -1).join('.');
        publicIdParts.push(fileNameWithoutExt);

        return publicIdParts.join('/');
    } catch (error) {
        console.error("Failed to extract public ID:", error);
        return null;
    }
}

export {extractPublicIdFromUrl};