import {Request, Response, Router} from "express";
import {Container} from "typedi";
import {VideoService} from "@services/video.service";
import {z} from "zod";
import {validateRequestBody} from "zod-express-middleware";

const router = Router();

const videoService = Container.get(VideoService);

const verifyVideoUrlSchema = z.object({
    url: z.string(),
});

router.post('/identify',
    validateRequestBody(verifyVideoUrlSchema),
    async (req: Request, res: Response) => {
    try {
        const videoUrl = req.body.url;
        const video = await videoService.identifyVideo(videoUrl, req.user!._id.toString());
        res.status(200).send({ success: true, video });
    } catch (error) {
        res.status(500).json({ error: "Internal server error", details: error });
    }
});

const verifyVideoIdSchema = z.object({
    videoId: z.string(),
});

router.post('/analyze',
    validateRequestBody(verifyVideoIdSchema),
    async (req: Request, res: Response) => {
    try {
        const videoId = req.body.videoId;
        const promptResponse = await videoService.analyzeVideo(videoId);
        res.status(200).send({ success: true, promptResponse });
    } catch (error) {
        res.status(500).json({ error: "Internal server error", details: error });
    }
});

export default router;
