import dotenv from 'dotenv';
dotenv.config();

import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
// console.log('Cloudinary ENV:', {
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadCloudinary = async  (localFilePath) => {
    try {
        if (!localFilePath) return null;
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        // file uploaded on cloudinary
        // console.log('File uploaded on cloudinary',response.url);
        fs.unlinkSync(localFilePath); // delete the file from local storage
        return {
          url: response.secure_url,
          public_id: response.public_id,
        };
    } catch (error) {
        console.error("Cloudinary upload error:", error);

        if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
        }

        return null;
    }   
}

const deleteCloudinary = async (publicId) => {
    if (!publicId) return null;
    try {
        // delete the file from cloudinary
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: "video"
        })
        // console.log('File deleted from cloudinary', response);
        return response.result === "ok";
        
    } catch (error) {
        console.error("Cloudinary delete error:", error);
        return false;
    }
}

export { uploadCloudinary, deleteCloudinary };