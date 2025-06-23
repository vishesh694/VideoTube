import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
// console.log('Cloudinary API Key:', process.env.CLOUDINARY_API_KEY);

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

// SETTINGS
app.use(express.json({limit:"16kb"}));  ///accept json
app.use(express.urlencoded({extended: true, limit: "16kb"}))   /// accept urlencoded // extended can give object inside object
app.use(express.static('public'));
app.use(cookieParser());

// ROUTES IMPORT
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.route.js";
import subscriptionRouter from "./routes/subscription.routes.js"
import commentRouter from "./routes/comment.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import likeRouter from "./routes/like.routes.js"
import healthcheckRouter from "./routes/healthcheck.routes.js"

//Routes Declaration (middlewares used)
app.use("/api/v1/users", userRouter);      // https://localhost:8000/api/v1/users/register
app.use("/api/v1/videos",videoRouter)
app.use("/api/v1/subscriptions",subscriptionRouter)
app.use("/api/v1/comments",commentRouter)
app.use("/api/v1/tweets",tweetRouter)
app.use("/api/v1/playlists",playlistRouter)
app.use("/api/v1/likes",likeRouter)
app.use("/api/v1/healthcheck",healthcheckRouter)

export { app };