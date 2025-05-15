import {Router, NextFunction, Request, Response} from "express";
import {z} from 'zod';
import {TypedRequestBody, validateRequestBody, validateRequestParams} from "zod-express-middleware";
import {passport} from '@/config/passport';
import {IUser} from "@schemas/User";
import {IVerifyOptions} from "passport-local";
import {LoginType} from "@schemas/auth/Login";
import {ensureAuthenticated, saveLogin} from "@/config/auth/middleware";
import {Container} from "typedi";
import {AuthService} from "@services/auth.service";

const authService = Container.get(AuthService);
const router = Router();

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

router.post(
    '/login',
    validateRequestBody(loginSchema),
    (req: Request, res: Response, next: NextFunction) => {
        passport.authenticate('local', (err: Error, user: IUser | undefined, info: IVerifyOptions | undefined) => {
            if (err) {
                return res.status(500).send({success: false, message: 'Internal server error'});
            }

            if (!user && info && info.message) {
                return res.status(400).send({success: false, message: info.message});
            }

            req.login(user as Express.User, (loginError) => {
                if (loginError) {
                    return res.status(500).send({success: false, message: 'Internal server error'});
                }
                saveLogin(LoginType.LOCAL, user as IUser, req);
                return res.status(200).send({success: true, message: 'Logged in'});
            });
        })(req, res, next);
    },
);

const registrationSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(32),
    firstName: z.string(),
    lastName: z.string(),
});

router.post(
    '/register',
    validateRequestBody(registrationSchema),
    async (req: TypedRequestBody<typeof registrationSchema>, res: Response, next: NextFunction) => {
        const {email, password} = req.body;

        try {
            await authService.register(email, password);

            passport.authenticate('local', (err: Error, user: IUser | undefined, info: IVerifyOptions | undefined) => {
                if (err) {
                    return res.status(500).send({success: false, message: 'Internal server error'});
                }

                if (!user && info && info.message) {
                    return res.status(400).send({success: false, message: info.message});
                }

                req.login(user as Express.User, (loginError) => {
                    if (loginError) {
                        return res.status(500).send({success: false, message: 'Internal server error'});
                    }
                    saveLogin(LoginType.LOCAL, user as IUser, req);
                    return res.json({
                        success: true,
                        message: req.t('success.account_created'),
                    });
                });
            })(req, res, next);
        } catch (err: unknown) {
            return res.json({
                success: false,
                message: (err as Error).message,
            });
        }
    },
);

router.get('/logout', ensureAuthenticated, (req: Request, res: Response, next: NextFunction) => {
    req.logout((err: unknown) => {
        if (err) {
            return next(err as Error);
        }
        return res.json({
            success: true,
            message: req.t('success.logged_out'),
        });
    });
});

const verifyEmailSchema = z.object({
    token: z.string(),
});

router.get(
    '/verify-email/:token',
    validateRequestParams(verifyEmailSchema),
    async (req: TypedRequestBody<typeof verifyEmailSchema>, res: Response) => {
        const {token} = req.params;

        try {
            await authService.verifyEmail(token);

            return res.redirect(process.env.WEB_URL as string);
        } catch (err: unknown) {
            return res.json({
                success: false,
                message: (err as Error).message,
            });
        }
    },
);

router.get('/resend-email',
    ensureAuthenticated,
    async (req: Request, res: Response) => {
        try {
            await authService.resendEmail(req.user!._id.toString());

            return res.json({
                success: true,
                message: req.t('success.email_sent'),
            });
        } catch (err: unknown) {
            return res.json({
                success: false,
                message: (err as Error).message,
            });
        }
    }
);

const forgotPasswordSchema = z.object({
    email: z.string().email(),
});

router.post(
    '/forgot-password',
    validateRequestBody(forgotPasswordSchema),
    async (req: TypedRequestBody<typeof forgotPasswordSchema>, res: Response) => {
        const {email} = req.body;

        try {
            await authService.forgotPassword(email);
            return res.json({
                success: true,
                message: req.t('success.password_reset_sent'),
            });
        } catch (err: unknown) {
            return res.json({
                success: false,
                message: (err as Error).message,
            });
        }
    },
);

const resetPasswordSchema = z.object({
    token: z.string(),
    password: z.string().min(8).max(32),
});

router.post(
    '/reset-password',
    validateRequestBody(resetPasswordSchema),
    async (req: TypedRequestBody<typeof resetPasswordSchema>, res: Response) => {
        const {token, password} = req.body;

        try {
            await authService.resetPassword(token, password);
            return res.json({
                success: true,
                message: req.t('success.password_reset'),
            });
        } catch (err: unknown) {
            return res.json({
                success: false,
                message: (err as Error).message,
            });
        }
    },
);

export default router;
