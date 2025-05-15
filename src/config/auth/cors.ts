import {NextFunction, Request, Response} from "express";
import 'dotenv/config';

const isDev = process.env.MODE === 'dev';

export const cors = (req: Request, res: Response, next: NextFunction) => {
    const allowedOrigins = [
        process.env.WEB_URL as string,
    ];

    if (isDev) {
        allowedOrigins.push('http://localhost');
        allowedOrigins.push('https://localhost');
        allowedOrigins.push('https://dev.yt-timestamp-gen.com');
    }

    const origin = req.headers.origin as string;

    // Specify which origins can access the resource
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    if (isDev && origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    // Specify the allowed credentials, methods, headers, and exposed headers
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
    res.header(
        'Access-Control-Expose-Headers',
        'Date, Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization',
    );
    res.header(
        'Access-Control-Allow-Headers',
        'Date, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization, X-Organization-Id',
    );

    // Handle OPTIONS Method (Preflight requests)
    if (req.method === 'OPTIONS') {
        res.status(200).send();
        return;
    }

    return next();
};
