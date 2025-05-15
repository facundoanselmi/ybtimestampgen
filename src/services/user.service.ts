import mongoose from "mongoose";
import {Service} from "typedi";
import User, {IUser, UserRole} from "@schemas/User";
import i18n from "i18next";
import {flatten} from 'mongo-dot-notation';

export interface GetUserOptions {
    includeFields?: string[];
}

@Service()
export class UserService {

    constructor() {}

    public async countUsers(): Promise<number> {
        return User.countDocuments();
    }

    public async getUsers(page: number, limit: number, search: string | undefined, role: UserRole | undefined): Promise<{ users: IUser[]; count: number }> {
        const query: mongoose.FilterQuery<IUser> = {};

        if (search) {
            const regex = new RegExp(search, 'i');
            query.$or = [
                { email: regex },
                { username: regex },
                { fullName: regex },
                { phone: regex },
            ];

            if (mongoose.isValidObjectId(search)) {
                query.$or.push({ _id: new mongoose.Types.ObjectId(search) });
            }
        }

        if (role) {
            query.role = role;
        }

        const users = await User.find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const count = await User.countDocuments(query);

        return { users, count };
    }

    public async getUser(userId: string | mongoose.Types.ObjectId, options?: GetUserOptions): Promise<IUser> {
        let query = User.findById(userId);

        if (options?.includeFields) {
            const fieldsToInclude = options.includeFields.join(' ');
            query = query.select(fieldsToInclude);
        }

        const user = await query.lean();

        if (!user) {
            throw new Error(i18n.t('error.user_not_found'));
        }

        return user;
    }

    public async findOrCreate(data: Partial<IUser>): Promise<IUser> {
        let user = await User.findOne({email: data.email}) as IUser;

        if (!user) {
            user = await this.initializeUser(data);
        }

        return user;
    }

    public async initializeUser(data: Partial<IUser>): Promise<IUser> {
        // Start a session for the transaction
        const session = await mongoose.startSession();

        try {
            // Start the transaction
            session.startTransaction();

            // Create the user with the transaction session
            const users = await User.create([{
                ...data,
            }], {session: session});

            // Get the user's ID

            const user = users[0];

            // Attempt to commit the transaction
            await session.commitTransaction();

            // Return the created user
            return user;
        } catch (error) {
            // If any error occurs, abort the transaction
            await session.abortTransaction();
            throw error; // Rethrow the error to be handled by the caller
        } finally {
            // End the session
            await session.endSession();
        }
    }

    public async update(userId: string | mongoose.Types.ObjectId, data: Partial<IUser>): Promise<IUser> {
        const user = await User.findByIdAndUpdate(userId, flatten(data), {new: true}).lean();

        if (!user) {
            throw new Error(i18n.t('error.user_not_found'));
        }

        return user;
    }

    public async addVideo(userId: string | mongoose.Types.ObjectId, videoId: string | mongoose.Types.ObjectId): Promise<void> {
        await User.findByIdAndUpdate(userId, {$addToSet: {videos: videoId}});
    }
}
