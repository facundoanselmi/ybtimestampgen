import {Request, Response, Express, NextFunction} from "express";
import auth from "@controllers/public/auth";
import {ensureAuthenticated} from "@/config/auth/middleware";
import video from "@controllers/secure/video";
import user from "@controllers/secure/user";

const registerRoutes = (app: Express): void => {
    app.get('/', (req: Request, res: Response) => {
        res.set('Date', new Date().toISOString());
        res.send(`YouTube Timestamp Generator is operating normally.`);
    });

    app.use('/auth', auth);

    app.use('/secure', ensureAuthenticated, (req: Request, res: Response, next: NextFunction) => { next(); });

    app.use('/secure/user', user);
    app.use('/secure/video', video);
}

export default registerRoutes;
