import mongoose from "mongoose";

export enum TokenType {
    verify_email = 'verify_email',
    reset_password = 'reset_password',
}

export interface IToken {
    _id: mongoose.Types.ObjectId;
    entity: mongoose.Types.ObjectId;
    type: TokenType;
    token: string;
    expires: Date;
}

const TokenSchema = new mongoose.Schema<IToken>({
    entity: {type: mongoose.Schema.ObjectId, required: true},

    type: {type: String, enum: Object.values(TokenType)}, // ban, mute, block
    token: {type: String},

    expires: {type: Date, expires: 60 * 60 * 24, default: Date.now}, // 24 hours
}, {
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

TokenSchema.index({user: 1});

export default mongoose.model<IToken>('Token', TokenSchema);
