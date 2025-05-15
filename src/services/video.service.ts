import {Container, Service} from "typedi";
import {google} from "googleapis";
import {YoutubeTranscript} from "youtube-transcript";
import {generatePromptText} from "@/utils/prompt";
import {OpenAI} from "openai";
import Video, {IVideo, IVideoDetails} from "@schemas/Video";
import {UserService} from "@services/user.service";
import {PromptService} from "@services/prompt.service";
import {IPrompt, IPromptResponse} from "@schemas/Prompt";

const userService = Container.get(UserService);
const promptService = Container.get(PromptService);

@Service()
export class VideoService {
    private youtubeApi;
    private openaiApi: OpenAI;
    private tokenPricing: { [key: string]: { input: number; output: number } } = {
        'gpt-4-turbo-preview': {input: 0.01, output: 0.03},
    };

    constructor() {
        this.youtubeApi = google.youtube({version: "v3", auth: process.env.YOUTUBE_API_KEY});
        this.openaiApi = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
    }

    public async createVideo(ytVideoId: string, videoUrl: string): Promise<IVideo> {
        const details = await this.getVideoDetails(ytVideoId);
        if (!details) throw {error: "Video not found"};

        return Video.create({
            ytVideoId,
            url: videoUrl,
            details,
        })
    }

    private async getVideoDetails(ytVideoId: string) {
        try {
            const response = await this.youtubeApi.videos.list({
                part: ["snippet", "statistics"],
                id: [ytVideoId],
            });

            if (!response.data.items || response.data.items.length === 0) return null;

            const videoData = response.data.items[0];
            return {
                title: videoData.snippet?.title,
                description: videoData.snippet?.description || "",
                tags: videoData.snippet?.tags || [],
                publishedAt: videoData.snippet?.publishedAt,
                channelTitle: videoData.snippet?.channelTitle,
                viewCount: videoData.statistics?.viewCount || "0",
                likeCount: videoData.statistics?.likeCount || "0",
                commentCount: videoData.statistics?.commentCount || "0",
            } as unknown as IVideoDetails;
        } catch (error) {
            console.error("Error fetching video details:", error);
            return null;
        }
    }

    public async identifyVideo(videoUrl: string, userId: string) {
        const ytVideoId = this.extractYTVideoId(videoUrl);
        if (!ytVideoId) return {error: "Invalid YouTube URL"};

        let existingVideo: IVideo | null = await this.getVideoByYTid(ytVideoId);
        if (!existingVideo) {
            try {
                existingVideo = await this.createVideo(ytVideoId, videoUrl);
            } catch (error) {
                throw {error: "Error creating video"};
            }
        } else {
            const details = await this.getVideoDetails(ytVideoId);
            const detailsChanged = JSON.stringify(existingVideo.details) !== JSON.stringify(details);
            if (detailsChanged) {
                existingVideo.promptId = null;
                existingVideo.details = details;
                await existingVideo.save();
            }
        }

        try {
            await userService.addVideo(userId, existingVideo!._id);
        } catch (error) {
            throw {error: "Error adding video to user"};
        }

        return existingVideo;
    }

    private extractYTVideoId(videoUrl: string): string | null {
        const patterns = [
            /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/watch\?v=([\w-]+)/,
            /(?:https?:\/\/)?youtu\.be\/([\w-]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([\w-]+)/,
        ];

        for (const pattern of patterns) {
            const match = videoUrl.match(pattern);
            if (match) return match[1];
        }
        return null;
    }

    public async analyzeVideo(videoId: string) {
        const video = await Video.findById(videoId);
        if (!video) return {error: "Invalid videoId"};

        const prompt = await this.getVideoPrompt(video);
        return await this.getPromptResponse(prompt);
    }

    private async getVideoPrompt(video: IVideo): Promise<IPrompt> {
        try {
            if (video.promptId) return await promptService.getPrompt(video.promptId);

            const transcript = await this.getVideoTranscript(video);
            const promptText = generatePromptText(video.details, transcript);

            const inputTokens = this.estimateTokenCount(promptText);
            const estimatedCost = this.estimateCost(inputTokens, parseInt(process.env.OPENAI_MAX_TOKENS!));

            const prompt = await promptService.createPrompt({
                videoId: video._id,
                text: promptText,
                tokens: inputTokens,
                cost: estimatedCost,
                modelName: process.env.OPENAI_MODEL!,
                temperature: parseFloat(process.env.OPENAI_TEMPERATURE!),
                maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS!),
            });

            video.promptId = prompt._id;
            await video.save();

            return prompt;

        } catch (error) {
            throw `Error generating prompt: ${error}`;
        }
    }

    private async getVideoTranscript(video: IVideo): Promise<string> {
        if (video.transcript) return video.transcript;
        try {
            const transcript = (await YoutubeTranscript.fetchTranscript(video.ytVideoId)).map((entry) => `${this.formatTranscriptTag(entry.offset)} - ${entry.text}`)
                .join("\n");
            video.transcript = transcript;
            await video.save();
            return transcript;
        } catch (error) {
            return "Transcript not found";
        }
    }

    private formatTranscriptTag(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
    }

    private async getPromptResponse(prompt: IPrompt): Promise<IPromptResponse> {
        if (prompt.response) return prompt.response;

        const rawResponse = await this.fetchRawResponse(prompt);
        if (!rawResponse || rawResponse === "Error") throw { error: "Error generating response" };

        return this.parseResponse(rawResponse, prompt);
    }

    private async fetchRawResponse(prompt: IPrompt): Promise<string> {
        const response = await this.openaiApi.chat.completions.create({
            model: prompt.modelName,
            messages: [
                { role: "system", content: "You are a YouTube optimization expert." },
                { role: "user", content: prompt.text }
            ],
            temperature: prompt.temperature,
            max_tokens: prompt.maxTokens,
        });

        return response.choices[0].message.content || "Error";
    }

    private async parseResponse(rawResponse: string, prompt: IPrompt): Promise<IPromptResponse> {
        try {
            return this.savePromptResponse(rawResponse, prompt);
        } catch (error) {
            throw "JSON format not found in response.";
        }
    }

    private async savePromptResponse(rawResponse: string, prompt: IPrompt): Promise<IPromptResponse> {
        try {
            const response = JSON.parse(rawResponse) as IPromptResponse;
            prompt.response = response;
            await prompt.save();
            return response;
        } catch (error) {
            throw `Error generating prompt: ${error}`;
        }
    }

    estimateTokenCount(text: string): number {
        return Math.ceil(text.length / 4);
    }

    estimateCost(inputTokens: number, outputTokens: number): number {
        const pricing = this.tokenPricing[process.env.OPENAI_MODEL!];
        return (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
    }

    private getVideoByYTid(ytVideoId: string) {
        return Video.findOne({ytVideoId: ytVideoId});
    }
}
