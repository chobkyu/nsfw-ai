import express from 'express';
import multer from 'multer';
import { join,dirname } from 'path';
import { readFileSync, createReadStream, unlinkSync } from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import { getAnswer } from './util/llm.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();
const app = express();
const PORT = 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// 정적 파일
app.use(express.static(join(__dirname, 'public')));
app.use(express.json()); 

// 파일 업로드 설정
const upload = multer({ dest: 'uploads/' });

async function checkNSFW(filePath) {
    const imageBuffer = readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    const res = await axios.post(
      'https://api-inference.huggingface.co/models/Falconsai/nsfw_image_detection',
      { inputs: base64Image },
      {
        headers: {
            'Authorization': `Bearer ${process.env['hugging-key']}`,
            'Content-Type': 'application/json',
        },
      }
    );
    console.log(res)
    return res.data;
  }

  

  const models = [
    "Falconsai/nsfw_image_detection",
    "Marqo/nsfw-image-detection-384",
    "LukeJacob2023/nsfw-image-detector",
    "TostAI/nsfw-image-detection-large"
  ];
  
  async function callNSFWModel(modelName, imagePath) {
    const form = new FormData();
    form.append("file", createReadStream(imagePath));
  
    try {
      const res = await post(
        `https://api-inference.huggingface.co/models/${modelName}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'Authorization': `Bearer ${process.env['hugging-key']}`,
          }
        }
      );
      return { model: modelName, result: res.data };
    } catch (error) {
      return { model: modelName, error: error.response?.data || error.message };
    }
  }


  async function validateToken(token) {
    try {
      const response = await axios.get('https://huggingface.co/api/whoami-v2', {
        headers: {
          Authorization: `Bearer ${process.env['hugging-key']}`,
        },
      });
      console.log('✅ 유효한 토큰입니다.');
      console.log('사용자 정보:', response.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error('❌ 유효하지 않은 토큰입니다.');
      } else {
        console.error('⚠️ 오류 발생:', error.message);
      }
    }
  }


  async function callHuggingFaceModel() {
    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/openai-community/gpt2', // 모델 호출
        { inputs: 'Hello, how are you?' }, // 입력 프롬프트
        {
          headers: {
            Authorization: `Bearer ${process.env['hugging-key']}`,
          },
        }
      );
  
      console.log('✅ 호출 성공');
      console.log('결과:', response.data);
    } catch (error) {
      if (error.response) {
        console.error(`❌ 호출 실패: ${error.response.status} ${error.response.statusText}`);
        console.error('에러 내용:', error.response.data);
      } else {
        console.error('⚠️ 요청 실패:', error.message);
      }
    }
  }

app.get('/token',async(req,res) => {
  const result = await callHuggingFaceModel();
  res.send(JSON.stringify(result))
})
// 업로드 및 NSFW 판단
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('파일이 없습니다.');

  const filePath = req.file.path;
  console.log(process.env['hugging-key']);
  try {
    const result = await checkNSFW(filePath);
  
    res.send(`<pre>${JSON.stringify(result, null, 2)}</pre>`);
  } catch (err) {
    //console.log(err);
    console.error('NSFW 판단 오류:', err.message);
    res.status(500).send('NSFW 판단 실패');
  } finally {
    unlinkSync(filePath); // 임시 업로드 파일 삭제
  }
});

app.post('/test',async (req,res) => {
    const {text} = req.body
    const resposne = await getAnswer(text);

    res.send(`<pre>${JSON.stringify(resposne)}</pre>`);
})

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
