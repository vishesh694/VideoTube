import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js"; 
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";

const createPlaylist = asynchandler(async (req, res) => {
    const {name, description} = req.body
    if (!name){
        throw new ApiError(400,"Name is required");
    }

    const playlist = await Playlist.create({
        name,
        description: description || "",
        owner:req.user._id
    })

    return res
    .status(201)
    .json(
        new ApiResponse(201,playlist,"Playlist created successfully")
    )

})

const addVideoToPlaylist = asynchandler( async(req,res) => {
    const {playlistId, videoId} = req.params
    const playlist  = await Playlist.findById(playlistId);
    const video  = await Video.findById(videoId);
    
    if (!playlist){
        throw new ApiError(404,"Playlist not found");
    }
    if (!video){
        throw new ApiError(404,"Video not found");
    }

    // authorization check
    if (playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"You are not authorized to do this")
    }

    // Prevent duplicate additions
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400,"Video already there in playlist")
    }

    playlist.videos.push(videoId);
    await playlist.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"Video added successfully")
    )

})

const getUserPlaylists = asynchandler(async (req, res) => {
    const {userId} = req.params
    const user = await User.findById(userId);
    if (!user){
        throw new ApiError(404,"User not found");
    }

    const playlists = await Playlist.find({owner:userId})
    .populate({
        path:'videos',
        select: "video title thumbnail"
    })
    .sort({createdAt:-1});

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlists,"Got all playlists successfully")
    )

})

const getPlaylistById = asynchandler(async (req, res) => {
    const {playlistId} = req.params
    const playlist = await Playlist.findById(playlistId)
    .populate({
        path:"videos",
        select: "video title thumbnail"
    }).populate({
        path:"owner",
        select:"username avatar"
    });

    if (!playlist){
        throw new ApiError(404,"Playlist not found");
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"Playlist fetched successfully")
    )

})

const removeVideoFromPlaylist = asynchandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    const playlist  = await Playlist.findById(playlistId);
    const video  = await Video.findById(videoId);
    
    if (!playlist){
        throw new ApiError(404,"Playlist not found");
    }
    if (!video){
        throw new ApiError(404,"Video not found");
    }

    // authorization check
    if (playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"You are not authorized to do this")
    }

    playlist.videos = playlist.videos.filter(
        (_id) => _id.toString() !== videoId
    )

    await playlist.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"Video removed successfully")
    )

})

const updatePlaylist = asynchandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    
    const playlist = await Playlist.findById(playlistId);
    if (!playlist){
        throw new ApiError(404,"Playlist not found");
    }

    // authorization check
    if (playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"You are not authorized to do this")
    }

    if (name) playlist.name = name;
    if (description) playlist.description = description;

    playlist.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"Playlist updated successfully")
    )

})

const deletePlaylist = asynchandler(async (req, res) => {
    const {playlistId} = req.params
    const playlist = await Playlist.findById(playlistId);
    if (!playlist){
        throw new ApiError(404,"Playlist not found");
    }

    // authorization check
    if (playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"You are not authorized to do this")
    }

    await playlist.deleteOne();
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Playlist deleted successfully")
    )

})

export {
    getUserPlaylists,
    createPlaylist,
    getPlaylistById,
    removeVideoFromPlaylist,
    addVideoToPlaylist,
    deletePlaylist,
    updatePlaylist
}