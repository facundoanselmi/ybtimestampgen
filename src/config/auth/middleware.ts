import {LoginType} from "@schemas/auth/Login";
import {IUser} from "@schemas/User";
import {NextFunction, Request, Response} from 'express';
import {Container} from "typedi";
import {AuthService} from "@services/auth.service";

declare module 'http' {
    interface IncomingMessage {
        isAuthenticated(): boolean;
        user?: IUser;
    }
}

const authService = Container.get(AuthService);

const saveLogin = (type: LoginType, user: IUser, req: Request<unknown>) => {
    authService.createLogin({
        user: user._id,
        type,
        ip: req.headers['cf-connecting-ip'] as string,
        ua: req.headers['user-agent'] as string,
        country: req.headers['cf-ipcountry'] as string,
        city: req.headers['cf-ipcity'] as string,
        region: req.headers['cf-ipregion'] as string,
        timezone: req.headers['cf-iptimezone'] as string,
    });
};

const ensureAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && req.user) {
        const user = req.user;

        if (user.disabled) {
            return res.status(401).json({
                success: false,
                message: req.t('error.suspended'),
            });
        }

        return next();
    }

    return res.status(401).json({
        success: false,
        message: req.t('error.not_authenticated'),
    });
};
export {saveLogin, ensureAuthenticated};
