import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js"; 
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { uploadCloudinary, deleteCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { extractPublicIdFromUrl } from "../utils/extractPublicIdFromUrl.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const toggleSubscription = asynchandler( async(req,res) => {
    const { channelId } = req.params;
    const userId = req.user._id;


    const channel = await User.findById(channelId);
    // Check if channel exists
    if (!channel){
        throw new ApiError(404,"Channel not found. Provide valid channel Id")
    }

    const existingSubscription = await Subscription.findOne({
        channel: channelId,
        subscriber: userId
    })

    // Check if subscription exists
    if (existingSubscription) {
        // Unsubscribe
        await Subscription.deleteOne({_id: existingSubscription._id})
        return res
        .status(200)
        .json(
            new ApiResponse(200,{},"Successfully unsubscribed")
        )
    }
    else {
        // Subscribe
        const newSubscription = await Subscription.create({
            channel: channelId,
            subscriber: userId
        })
        return res
        .status(200)
        .json(
            new ApiResponse(200,newSubscription,"Successfully subscribed")
        )
    }
})

const getUserChannelSubscribers = asynchandler( async(req,res) => {
    const { channelId } = req.params;

    const channel = await User.findById(channelId);
    if (!channel){
        throw new ApiError(404, "Channel not found");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {channel: new mongoose.Types.ObjectId(channelId)}
        },
        {
            $lookup: {
                from: 'users',
                localField: 'subscriber',
                foreignField: '_id',
                as: 'SubscriberDetails'
            }
        },
        {
            $unwind: '$SubscriberDetails'
        },
        {
            $project: {
                _id: 0,
                username: '$SubscriberDetails.username',
                email: '$SubscriberDetails.email',
                avatar: '$SubscriberDetails.avatar'
            }
        }
    ]);

    return res
    .status(200)
    .json(
        new ApiResponse(200,subscribers,"List of Subscribers")
    )
})

const getSubscribedChannels = asynchandler( async(req,res) => {
    const { subscriberId } = req.params;
    const subscriber = await User.findById(subscriberId);
    if (!subscriber){
        throw new ApiError(404,"User not found")
    }

    // const channels = await Subscription.aggregate([
    //     {
    //         $match: { subscriber: new mongoose.Types.ObjectId(subscriberId)}
    //     },
    //     {
    //         $lookup: {
    //             from: 'users',
    //             localField: 'channel',
    //             foreignField: '_id',
    //             as: 'SubscriptionDetails'
    //         }
    //     },
    //     {
    //         $unwind: '$SubscriptionDetails'
    //     },
    //     {
    //         $project: {
    //              _id: 0,
    //             username: '$SubscriptionDetails.username',
    //             email: '$SubscriptionDetails.email',
    //             avatar: '$SubscriptionDetails.avatar'
    //         }
    //     }
    // ]);

    // another method
    const channels = await Subscription
    .find({subscriber: subscriberId})
    .populate('channel')
    .exec();
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,channels,"List of Subscriptions")
    )
})

export { toggleSubscription, getUserChannelSubscribers,getSubscribedChannels }