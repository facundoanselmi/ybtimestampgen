import mongoose from "mongoose";

export enum LoginType {
    GOOGLE = 'google',
    FACEBOOK = 'facebook',
    LOCAL = 'local',
}

export interface ILogin {
    _id?: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;

    type: LoginType;

    ip: string;
    ua: string;
    country: string;
    city: string;
    region: string;
    timezone: string;
}

const LoginSchema = new mongoose.Schema<ILogin>({
    user: {type: mongoose.Schema.ObjectId, ref: 'User', required: true},

    type: {type: String, enum: Object.values(LoginType), required: true},

    ip: String,
    ua: String,
    country: String,
    city: String,
    region: String,
    timezone: String,
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

LoginSchema.index({user: 1});

export default mongoose.model<ILogin>('Login', LoginSchema);
