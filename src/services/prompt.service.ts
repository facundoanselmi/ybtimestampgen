import {Service} from "typedi";
import mongoose from "mongoose";
import Prompt, {IPrompt} from "@schemas/Prompt";

@Service()
export class PromptService {

    public async createPrompt(promptData: Partial<IPrompt>) {
        return Prompt.create(promptData);
    }

    public async getPrompt(promptResponseId: mongoose.Types.ObjectId) : Promise<IPrompt> {
        const prompt = await Prompt.findById(promptResponseId);
        if (!prompt) {
            throw new Error(`Prompt with id ${promptResponseId} not found`);
        }
        return prompt;
    }
}
