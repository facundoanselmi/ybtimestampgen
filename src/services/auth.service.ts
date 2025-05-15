import {Service} from "typedi";
import Login, {ILogin} from "@schemas/auth/Login";
import crypto from "crypto";
import User, {IUser} from "@schemas/User";
import i18n from "i18next";
import {UserService} from "@services/user.service";
import {TokenService} from "@services/token.service";
import {MailService} from "@services/mail.service";

@Service()
export class AuthService {
    private userService: UserService;
    private tokenService: TokenService;
    private mailService: MailService;

    constructor(userService: UserService, tokenService: TokenService, mailService: MailService) {
        this.userService = userService;
        this.tokenService = tokenService;
        this.mailService = mailService;
    }

    async createLogin(data: ILogin): Promise<void> {
        await Login.create(data);
    }

    async register(email: string, password: string): Promise<IUser> {
        const normalizedEmail = email.toLowerCase().trim();

        const exists = await User.findOne({
            email: normalizedEmail,
        });

        if (exists) {
            throw new Error(i18n.t('error.user_already_exists'));
        }

        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

        const newUser = await this.userService.initializeUser({
            email: normalizedEmail,
            password: hashedPassword,
        });

        const token = await this.tokenService.createToken(newUser._id.toString(), 'verify_email');
        await this.mailService.sendEmailVerification(email, token);

        return newUser;
    }

    async verifyEmail(token: string): Promise<void> {
        const tokenDoc = await this.tokenService.verifyToken(token);

        await User.findByIdAndUpdate(tokenDoc.entity, {
            verified: true,
        });
    }

    async resendEmail(userId: string): Promise<void> {
        const user = await User.findById(userId);

        if (!user) {
            throw new Error(i18n.t('error.user_not_found'));
        }

        if (user.verified) {
            throw new Error(i18n.t('error.user_already_verified'));
        }

        const token = await this.tokenService.findOrCreateToken(userId, 'verify_email');
        await this.mailService.sendEmailVerification(user.email, token);
    }

    async forgotPassword(email: string): Promise<void> {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({email: normalizedEmail});
        if (!user) {
            throw new Error(i18n.t('error.user_not_found'));
        }

        const token = await this.tokenService.createToken(user._id.toString(), 'reset_password');
        await this.mailService.sendPasswordReset(email, token);
    }

    async resetPassword(token: string, password: string): Promise<void> {
        const tokenDoc = await this.tokenService.verifyToken(token);
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

        await User.findByIdAndUpdate(tokenDoc.entity, {
            password: hashedPassword,
        });
    }

    async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
        const user = await User.findById(userId).select('+password');

        if (!user) {
            throw new Error(i18n.t('error.user_not_found'));
        }

        const hashedOldPassword = crypto.createHash('sha256').update(oldPassword).digest('hex');

        if (user.password !== hashedOldPassword) {
            throw new Error(i18n.t('error.wrong_password'));
        }

        await User.findByIdAndUpdate(userId, {
            password: crypto.createHash('sha256').update(newPassword).digest('hex'),
        });
    }

    async changeEmail(userId: string, email: string): Promise<void> {
        const normalizedEmail = email.toLowerCase().trim();

        const exists = await User.findOne({email: normalizedEmail});

        if (exists) {
            throw new Error(i18n.t('error.email_taken'));
        }

        await User.findByIdAndUpdate(userId, {
            email: normalizedEmail,
            verified: false,
        });

        const token = await this.tokenService.createToken(userId, 'verify_email');
        await this.mailService.sendEmailVerification(email, token);
    }
}
