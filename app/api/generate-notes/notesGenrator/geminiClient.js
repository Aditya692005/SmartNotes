import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Choose your model here
export const MODEL = "models/gemini-2.5-flash";
