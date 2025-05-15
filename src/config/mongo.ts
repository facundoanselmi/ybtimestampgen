import {Service} from 'typedi';
import mongoose from "mongoose";
import 'dotenv/config';

@Service()
export class MongoConnection {
    private readonly url: string;

    constructor() {
        this.url = process.env.MONGO_URL || '';
        this.registerEvents();
    }

    private registerEvents(): void {
        mongoose.connection.on('error', this.onError.bind(this));
        mongoose.connection.on('disconnected', this.onDisconnected.bind(this));
        mongoose.connection.on('connected', this.onConnected.bind(this));
        mongoose.connection.on('reconnected', this.onReconnected.bind(this));
        process.on('SIGINT', this.onSigint.bind(this));
    }

    async connect(): Promise<void> {
        console.log(`[MONGODB] Connecting to: ${this.url}`);
        try {
            await mongoose.connect(this.url);
        } catch (error) {
            console.error(`[MONGODB] Connection error:`, error);
            process.exit(1);
        }
    }

    private onError(): void {
        console.log('[MongoDB] Could not connect to MongoDB');
    }

    private onDisconnected(): void {
        console.log('[MongoDB] Lost MongoDB connection...');
    }

    private onConnected(): void {
        console.log('[MongoDB] Connection established to MongoDB');
    }

    private onReconnected(): void {
        console.log('[MongoDB] Reconnected to MongoDB');
    }

    private async onSigint(): Promise<void> {
        await mongoose.connection.close();
        console.log('[MongoDB] Forced to close the MongoDB connection');
        process.exit(0);
    }
}
