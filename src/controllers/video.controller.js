import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js"; 
import { Video } from "../models/video.model.js";
import { uploadCloudinary, deleteCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { extractPublicIdFromUrl } from "../utils/extractPublicIdFromUrl.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const getAllVideos = asynchandler( async(req,res) => {
    const { page=1, limit=10, query, sortBy, sortType, UserId} = req.query;
    // get all videos based on query, sort, pagination

    const filter = {};
    // search query on title or description
    if (query){
        filter=[
            {title: {$regex:query, $options:'i'}},
            {description: {$regex:query, $options:'i'}},
        ];
    }

    // Filter by UserId
    if (UserId && mongoose.Types.ObjectId.isValid(UserId)){
        filter.owner = UserId;
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortType === 'asc' ? 1 : -1;

    const totalVideos = await Video.countDocuments(filter);

    const videos = await Video.find(filter)
    .sort(sortOptions)
    .skip((parseInt(page)-1)*parseInt(limit))     // Basically used for pagination and skipping n docs in skip(n)
    .limit(parseInt(limit))                     // parseInt converts string to int 
    .lean();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                videos,
                pagination: {
                    totalItems:totalVideos,
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalVideos/parseInt(limit))
                }
            },
            "All videos fetched successfully"
        )
    )

})

const publishVideo = asynchandler( async(req,res) => {
    const { title,description,duration } = req.body;
    if (!title || !description){
        throw new ApiError(404 , "Title or description not found")
    }
    // get video, upload to Cloudinary, create video
    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
    if (!videoLocalPath || !thumbnailLocalPath){
        throw new ApiError(400,"Video or thumbnail not found")
    }

    const uploadvideo = await uploadCloudinary(videoLocalPath);
    const uploadthumbnail = await uploadCloudinary(thumbnailLocalPath);
    if (!uploadvideo || !uploadthumbnail){
        throw new ApiError(500,"Error in uploading")
    }

    const video = await Video.create({
        videoFile: uploadvideo.url,
        thumbnail: uploadthumbnail.url,
        title,
        description,    
        duration:0,
        owner:req.user._id
    })

    return res
    .status(201)
    .json(
        new ApiResponse(201,video,"Video Published Successfully")
    )
})

const getVideoById = asynchandler( async(req,res) => {
    const { videoId } = req.params;
    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Video Id not found or is invalid")
    }

    const video = await Video.findById(videoId);
    if (!video){
        throw new ApiError(404,"Video not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"Video fetched successfully")
    )
})

const updateVideo = asynchandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body;
    // console.log(title);

    const video = await Video.findById(videoId);
    if (!video){
        throw new ApiError(404,"Video not found")
    }
    if (title) video.title = title;
    if (description) video.description = description;

    if (req.file){
        const newThumbnail = await uploadCloudinary(req.file.path);
        video.thumbnail = newThumbnail.url;
    }
    
    const updatedVideo = await video.save();

    return res
    .status(200)
    .json(
        new ApiResponse (200,updatedVideo,"video updated successfully")
    )

})

const deleteVideo = asynchandler( async(req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if (!video){
        throw new ApiError (404, "Video not found")
    }

    if (video.videoFile){
        const videoPublicId = extractPublicIdFromUrl(video.videoFile);
        if (!videoPublicId){
            throw new ApiError(500, "Error in getting publicId of videoFile")
        }
        const isVideoDeleted = await deleteCloudinary(videoPublicId);
        if (!isVideoDeleted){
            throw new ApiError(500, "Error in deleting the video");
        }
    }
    if (video.thumbnail){
        const thumbnailPublicId = extractPublicIdFromUrl(video.thumbnail);
        if (!thumbnailPublicId){
            throw new ApiError(500, "Error in getting publicId of thumbhail")
        }
        const isthumbnailDeleted = await deleteCloudinary(thumbnailPublicId);
        if (!isthumbnailDeleted){
            throw new ApiError(500, "Error in deleting the thumbnail");
        }
    }
    await video.deleteOne();
    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Video deleted sucessfully")
    )

})

const togglePublishStatus = asynchandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId);
    if (!video){
        throw new ApiError(404,"Video not found")
    }
    video.isPublished = !video.isPublished;

    await video.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200,video,`Video is now ${video.isPublished ? "Published" : "Unpublished"}`)
    )
})

export { getAllVideos, publishVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus }