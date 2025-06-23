import { Router } from 'express';
import { addComment, deleteComment, getVideoComments, updateComment } from '../controllers/comment.controller.js';
import { verifyJwt } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJwt);

router.route("/:videoId").get(getVideoComments).post(addComment);
router.route("/:commentId").delete(deleteComment).patch(updateComment);

export default router;