import mongoose, { Schema } from "mongoose";

export interface IVideoDetails {
    title: string;
    description: string;
    tags: string[];
    publishedAt: Date;
    channelTitle: string;
    viewCount: number;
    likeCount: number;
    commentCount: number
}

const VideoDetailsSchema = new Schema<IVideoDetails>(
    {
        title: { type: String, required: true },
        description: { type: String, default: "" },
        tags: [{ type: String }],
        publishedAt: { type: Date, required: true },
        channelTitle: { type: String, required: true },
        viewCount: { type: Number, default: 0 },
        likeCount: { type: Number, default: 0 },
        commentCount: { type: Number, default: 0 },
    },
    { _id: false }
);

export interface IVideo extends mongoose.Document{
    _id: mongoose.Types.ObjectId;

    ytVideoId: string;
    url: string;

    details: IVideoDetails
    transcript: string;

    promptId: mongoose.Types.ObjectId;

    createdAt?: Date;
    updatedAt?: Date;
}

// Video Schema
const VideoSchema = new Schema<IVideo>({
    ytVideoId: { type: String, required: true },
    url: { type: String, required: true },

    details: {
        type: VideoDetailsSchema,
        required: true,
    },

    transcript: { type: String, default: "" },

    promptId: { type: Schema.Types.ObjectId, ref: "Prompt" },
},{
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.__v;
            return ret;
        },
    },
    toObject: {
        transform: function (doc, ret) {
            delete ret.__v;
            return ret;
        }
    }
});

VideoSchema.index({ ytVideoId: 1 });

export default mongoose.model<IVideo>("Video", VideoSchema);
