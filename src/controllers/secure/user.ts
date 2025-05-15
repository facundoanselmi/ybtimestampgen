import {Request, Response, Router} from "express";
import {z} from "zod";
import {TypedRequestBody, validateRequestBody} from "zod-express-middleware";
import {Container} from "typedi";
import {UserService} from "@services/user.service";
import {AuthService} from "@services/auth.service";

const userService = Container.get(UserService);
const authService = Container.get(AuthService);
const router = Router();

router.get('/profile', async (req: Request, res: Response) => {
    const user = userService.getUser(req.user!._id);
    if (!user) {
        res.status(401).send({success: false, message: "There is not logged in user"});
    }
    res.status(200).send(user);
});

const updateProfileSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
});

router.post('/profile',
    validateRequestBody(updateProfileSchema),
    async (req: TypedRequestBody<typeof updateProfileSchema>, res: Response) => {
        const update = req.body;

        if (!update.firstName && !update.lastName) {
            res.status(400).send({
                success: false,
                message: req.t('error.nothing_to_update'),
            });
            return;
        }

        const firstName = update.firstName ?? req.user!.firstName;
        const lastName = update.lastName ?? req.user!.lastName;

        try {
            const user = await userService.update(req.user!._id.toString(), {
                firstName,
                lastName,
            });
            res.status(200).send(user);
        } catch (err: unknown) {
            res.status(400).send({
                success: false,
                message: (err as Error).message,
            });
        }
    }
);

const changePasswordSchema = z.object({
    oldPassword: z.string(),
    newPassword: z.string().min(8).max(32),
});

router.post('/change-password',
    validateRequestBody(changePasswordSchema),
    async (req: TypedRequestBody<typeof changePasswordSchema>, res: Response) => {
        const {oldPassword, newPassword} = req.body;

        try {
            await authService.changePassword(req.user!._id.toString(), oldPassword, newPassword);
            res.status(200).send({
                success: true,
                message: req.t('success.password_changed'),
            });
        } catch (err: unknown) {
            res.status(400).send({
                success: false,
                message: (err as Error).message,
            });
        }
    }
);

const changeEmailSchema = z.object({
    email: z.string().email(),
});

router.post('/change-email',
    validateRequestBody(changeEmailSchema),
    async (req: TypedRequestBody<typeof changeEmailSchema>, res: Response) => {
        const {email} = req.body;

        try {
            await authService.changeEmail(req.user!._id.toString(), email);
            req.logout(() => {
                res.status(200).send({
                    success: true,
                    message: req.t('success.email_changed'),
                });
            });
        } catch (err: unknown) {
            res.status(400).send({
                success: false,
                message: (err as Error).message,
            });
        }
    }
);

export default router;
