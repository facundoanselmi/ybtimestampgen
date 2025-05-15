import crypto from "crypto";
import {Service} from "typedi";
import Token, {IToken} from '@schemas/auth/Token';

@Service()
export class TokenService {
    public async createToken(entityId: string, type: string): Promise<string> {
        const token = crypto.randomBytes(32).toString('hex');

        await Token.create({
            entity: entityId,
            token,
            type,
        });

        return token;
    }

    public async findOrCreateToken(userId: string, type: string): Promise<string> {
        const token = await Token.findOne({entity: userId, type}).lean();

        if (token) {
            return token.token;
        }

        return this.createToken(userId, type);
    }

    public async verifyToken(token: string): Promise<IToken> {
        const tokenDoc = await Token.findOne({token}).lean();

        if (!tokenDoc) {
            throw new Error('error.invalid_token');
        }

        return tokenDoc;
    }
}
