import 'reflect-metadata';
import express, {NextFunction, Request, Response} from "express";
import registerRoutes from "./controllers";
import {Container} from "typedi";
import {MongoConnection} from "./config/mongo";
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import { cors } from '@/config/auth/cors';
import helmet from 'helmet';
import {createSession} from "@/config/auth/session";
import passport from "passport";
import useragent from 'express-useragent';
import {handle} from "i18next-http-middleware";
import bodyParser from 'body-parser';
import mongoSanitize from 'express-mongo-sanitize';
import path from "path";
import mongoose from "mongoose";
import expressOasGenerator, { SPEC_OUTPUT_FILE_BEHAVIOR } from '@fabiansharp/express-oas-generator';
import { i18next } from '@/config/i18next';

const isDev = process.env.MODE === 'dev';

const app = express();
const mongo = Container.get(MongoConnection);

mongo.connect().then(() => {
    console.log('Connected to MongoDB');

    app.set('trust proxy', 1);

    app.use(cookieParser());

    app.use(cors);

    app.use(helmet(
        {
            contentSecurityPolicy: false,
        },
    ));

    app.use(createSession());
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(useragent.express());
    app.use(handle(i18next));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    app.use(
        mongoSanitize({
            allowDots: true,
            onSanitize: ({req, key}) => {
                console.log(`This request[${key}] is sanitized:`);
                console.log(req);
            },
        }),
    );

    if (isDev) {
        expressOasGenerator.handleResponses(app, {
            swaggerDocumentOptions: {},
            predefinedSpec: require(path.join(__dirname, '../spec.json')),
            mongooseModels: mongoose.modelNames(),
            specOutputFileBehavior: SPEC_OUTPUT_FILE_BEHAVIOR.PRESERVE,
            tags:['Auth', 'User', 'Video']
        });
    }

    registerRoutes(app);

    if (isDev) {
        expressOasGenerator.handleRequests();

        app.use('/api-docs', (req: Request, res: Response, next: NextFunction) => {
            res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.set('Pragma', 'no-cache');
            res.set('Expires', '0');
            res.set('Surrogate-Control', 'no-store');
            next();
        });
    }

    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
})
