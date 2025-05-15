import session from 'express-session';
import MongoStore from 'connect-mongo';
import 'dotenv/config';

export function createSession() {
    const cookie: session.CookieOptions = {
        maxAge: 3 * 30 * 24 * 60 * 60 * 1000,
        secure: false, // Set to false if you're running on HTTP
        sameSite: 'lax',
        httpOnly: false,
        domain: 'localhost',
    };

    return session({
        secret: process.env.SESSION_SECRET as string,
        saveUninitialized: true,
        resave: true,
        cookie: cookie,
        store: MongoStore.create({mongoUrl: process.env.MONGO_URL}),
    });
}
