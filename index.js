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
const PORT = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// 정적 파일
app.use(express.static(join(__dirname, 'public')));

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


// 업로드 및 NSFW 판단
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send('파일이 없습니다.');

  const filePath = req.file.path;
  console.log(process.env['hugging-key']);
  try {
    const result = await checkNSFW(filePath);
  
    res.send(`<pre>${JSON.stringify(result, null, 2)}</pre>`);
  } catch (err) {
    console.error('NSFW 판단 오류:', err.message);
    res.status(500).send('NSFW 판단 실패');
  } finally {
    unlinkSync(filePath); // 임시 업로드 파일 삭제
  }
});

app.get('/test',async (req,res) => {
    const resposne = await getAnswer('안녕 GPT! 오늘 날씨 어때?');

    res.send(`<pre>${JSON.stringify(resposne)}</pre>`);
})

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
