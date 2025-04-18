import { OpenAI } from 'openai';
import dotenv from 'dotenv';
dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // .env에 키 저장 추천
  });
  
export const getAnswer = async () => {
    const prompt = `
        # Task
        You are a content moderation system.

        Evaluate the following text and determine if it violates the platform's content policy.

        # Rules for violation (return 1 if any of the following applies, otherwise return 0):
        - Contains adult/sexually explicit content that is not age-restricted.
        - Contains suggestive content that exceeds the platform’s acceptable level of sexual expression.
        - Uses language that may be offensive, hateful, or cause discomfort to others.
        - Attacks, insults, or degrades individuals or groups; promotes violence, discrimination, or inhumane treatment.
        - References to minors or criminal activity that require stricter moderation.
        - Evades moderation through spacing, misspellings, or abbreviation, but is still interpretable.
        - Shares contact info, bank accounts, or external platform usernames or links for transactional purposes.
        - Slang or abbreviated words that represent inappropriate content (e.g., "뷰지", "ㅂㅈ", etc.).

        # Output Format
        Respond only with:
        - 1 (if the text violates any of the rules)
        - 0 (if the text does not violate any of the rules)

        # Text to Moderate
        "${'진짜로 안 입었다니까...? 월요일이니까 힘내😋❤️‍🔥'}"
    `;
    const res = await openai.chat.completions.create({
        model: 'gpt-4o', // 또는 'gpt-3.5-turbo'
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      });
    
      console.log(res.choices[0].message.content);
      return res.choices[0].message.content;
}