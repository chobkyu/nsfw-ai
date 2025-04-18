import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import {encode,decode} from 'gpt-3-encoder';

dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // .env에 키 저장 추천
});

const explicitKeywords = [
  'ㅂㅈ', '뷰지', '좆', '씨발', '보지', '자지', '섹스', '69',
  'ㅃㅈ', 'ㅈㅈ', 'sex', 'fuck', 'pussy', 'dick', 'cum', 'asshole'
];

function containsExplicitKeyword(text) {
  return explicitKeywords.some(word => text.toLowerCase().includes(word));
}
  
  // 토큰 수 계산
function countTokens(text) {
    const tokens = encode(text);
    return tokens.length;
}

// 청킹 함수: 텍스트를 GPT의 최대 토큰 수를 넘지 않도록 나눈다.
// 단 gpt-4o의 경우 max token이 128k이므로 의미가 없음
function chunkText(text, maxTokens) {
    const chunks = [];
    const tokens = encode(text);
    let currentChunk = [];
    let currentTokenCount = 0;
  
    for (let i = 0; i < tokens.length; i++) {
      currentTokenCount += 1;
      currentChunk.push(tokens[i]);
  
      if (currentTokenCount >= maxTokens) {
        chunks.push(decode(currentChunk));
        currentChunk = [];
        currentTokenCount = 0;
      }
    }
  
    if (currentChunk.length > 0) {
      chunks.push(decode(currentChunk));
    }
  
    return chunks;
  }

export const getAnswer = async (text) => {
    const input = text;
    
    if (containsExplicitKeyword(input)) {
        console.log('text 검열')
        return "1";
    }
    
    const countToken = countTokens(input)

    /**왠만한 긴 포스트의 길이가 10000을 못 넘기에 거의 발생할 일이 없을거로 판단. */
    if(countToken>128000) {
        console.log('max token 검열');
        return "1";
    }
    

    const prompt = `
        # Task
        You are a content moderation system that classifies whether a given text contains adult or inappropriate content.

        Evaluate the following text and determine if it violates the platform's content policy.

        # Rules for violation (return 1 if any of the following applies, otherwise return 0):
        - Contains adult/sexually explicit content that is not age-restricted.
        - Contains suggestive or implicitly sexual content (e.g., flirty or provocative remarks) that may exceed acceptable standards, even if not explicit.
        - Implies or hints at revealing the body or drawing sexual attention, even if using indirect, trendy, or slang expressions (e.g., “신박하게 오오티디 보여주기”, “my ootd❤️” with revealing context).
        - Uses language that may be offensive, hateful, or cause discomfort to others.
        - Attacks, insults, or degrades individuals or groups; promotes violence, discrimination, or inhumane treatment.
        - References to minors or criminal activity that require stricter moderation.
        - Attempts to evade moderation using spacing, misspellings, abbreviations, or coded language but is still interpretable in context.
        - Shares contact info, bank accounts, or external platform usernames or links for transactional purposes.
        - Slang or abbreviated words that represent inappropriate content (e.g., "뷰지", "ㅂㅈ", etc.).
        - Includes language that may indirectly suggest or provoke sexual imagination or inappropriate thoughts, even in a subtle, sarcastic, or humorous way (e.g., “이거 보고 코피 날 수도 있어”, “그냥 흔드는 건데 무슨 상상해?”).

        # Output Format
        Respond only with:
        - 1 (if the text violates any of the rules)
        - 0 (if the text does not violate any of the rules)

        # Text to Moderate
        "${input}"
    `;

    
    const res = await openai.chat.completions.create({
        model: 'gpt-4o', // 또는 'gpt-3.5-turbo'
        messages: [
          { role: 'system', content: 'You are a content moderation system that classifies whether a given text contains adult or inappropriate content.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      });
    
      console.log(res.choices[0].message.content);
      return res.choices[0].message.content;
}


