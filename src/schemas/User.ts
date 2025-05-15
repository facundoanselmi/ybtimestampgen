import mongoose, {Schema} from 'mongoose';

export enum UserRole {
    ADMIN = 'A',
    USER = 'U'
}

export interface IUser {
    _id: mongoose.Types.ObjectId;

    email: string;

    firstName?: string;
    lastName?: string;

    password: string;

    videos: mongoose.Types.ObjectId[];

    role: UserRole;
    verified: boolean;
    disabled: boolean;

    createdAt?: Date;
    updatedAt?: Date;
}

const UserSchema = new mongoose.Schema<IUser>({
    email: { type: String, unique: true, required: true },

    firstName: String,
    lastName: String,

    password: { type: String, required: true, select: false },

    videos: [{ type: Schema.Types.ObjectId, ref: "Video" }],

    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    verified: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
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

UserSchema.index({ email: 1 });

export default mongoose.model<IUser>('User', UserSchema);
