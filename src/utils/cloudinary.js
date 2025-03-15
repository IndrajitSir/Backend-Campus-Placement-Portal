import { v2 as cloudinary } from 'cloudinary';
import { fs } from 'fs'
import { ApiError } from './ApiError';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const response = cloudinary.uploader.upload(localFilePath, { resource_type: "auto" })
        if (!response) {
            throw new ApiError(500, "Error while uploading static file on clodinary!")
        }
        fs.unlinkSync(localFilePath);
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
}

const deleteFromCloudinary = async (fileLink) => {
    try {
        if (!fileLink) return null;
        const response = cloudinary.uploader.destroy(fileLink, (err, result) => {
            if (result) {
                console.log("Deleted image details: ", result);
            }
            return null;
        })
        return response;
    } catch (error) {
        throw new ApiError(500, "Error while deleting static file from cloudinary!")
    }
}

export { uploadOnCloudinary, deleteFromCloudinary }