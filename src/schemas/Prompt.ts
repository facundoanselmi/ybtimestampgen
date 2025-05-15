import mongoose, {Schema} from "mongoose";

export interface IPromptResponse {
    titles: string[];
    description: string;
    hashtags: string[];
    timestamps: string;
}

const PromptResponseSchema = new Schema<IPromptResponse>(
    {
        titles: [{ type: String }],
        description: { type: String, default: "" },
        hashtags: [{ type: String }],
        timestamps: { type: String, default: "" },
    },
    { _id: false }
);

export interface IPrompt extends mongoose.Document {
    _id: mongoose.Types.ObjectId;

    videoId: mongoose.Types.ObjectId;

    text: string;
    tokens: number;
    cost: number;

    modelName: string;
    temperature: number;
    maxTokens: number;

    response: IPromptResponse

    videoChanged: boolean;

    createdAt?: Date;
    updatedAt?: Date;
}

const PromptSchema = new Schema<IPrompt>({
    videoId: { type: Schema.Types.ObjectId, ref: "Video" },

    text: { type: String, required: true },
    tokens: { type: Number },
    cost: { type: Number },

    modelName: { type: String},
    temperature: { type: Number },
    maxTokens: { type: Number },

    response: { type: PromptResponseSchema },

    videoChanged: { type: Boolean, default: false },
},{
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.__v;
            return ret;
        }
    },
    toObject: {
        transform: function (doc, ret) {
            delete ret.__v;
            return ret;
        }
    }
});

PromptSchema.index({ videoId: 1 });

export default mongoose.model<IPrompt>("Prompt", PromptSchema);
