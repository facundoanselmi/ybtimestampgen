import passport from 'passport';
import {Strategy as LocalStrategy} from 'passport-local';
import User, {IUser} from "@schemas/User";
import crypto from 'crypto';
import i18n from 'i18next';

// Local Strategy
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
}, async function(email, password, done) {
    try {
        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({email: normalizedEmail}).select('+password');
        const hashedPassword = crypto
            .createHash('sha256')
            .update(password)
            .digest('hex');

        if (!user) {
            return done(null, false, {message: i18n.t('error.user_not_found')});
        }

        if (user.password !== hashedPassword) {
            return done(null, false, {message: i18n.t('error.wrong_password')});
        }

        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done: (err: Error | null, id?: string) => void) => {
    let iUser = user as IUser;
    done(null, iUser._id.toString());
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await User.findById(id);
        done(null, user as IUser);
    } catch (err) {
        done(err);
    }
});

export {passport};
