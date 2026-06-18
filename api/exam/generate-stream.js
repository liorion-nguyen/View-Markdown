import '../../server/config/loadEnv.js';
import { examController } from '../../server/controllers/ExamController.js';

export const config = { maxDuration: 120 };

function getBody(req) {
  const body = req.body;
  console.log('[DEBUG] req.body type:', typeof body);
  console.log('[DEBUG] req.body:', body);
  
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (e) {
      console.error('[DEBUG] Parse body error:', e);
      return {};
    }
  }
  return body;
}

function writeSse(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
  if (res.flush) res.flush();
}

export default async function handler(req, res) {
  console.log('=== STREAM HANDLER CALLED ===', new Date().toISOString());
  
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Chỉ hỗ trợ POST' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  try {
    const body = getBody(req);
    console.log('[DEBUG] Parsed examRequest:', body);

    let count = 0;
    for await (const event of examController.generateStream(body)) {
      count++;
      console.log(`[DEBUG] Yield event #${count}:`, event.type);
      
      if (event.type === 'chunk') {
        writeSse(res, 'chunk', { text: event.text });
      } else if (event.type === 'done') {
        writeSse(res, 'done', { markdown: event.markdown });
      }
    }
    console.log('=== STREAM COMPLETED SUCCESSFULLY ===');
    res.end();
  } catch (err) {
    console.error('=== STREAM ERROR ===');
    console.error(err);
    console.error('Stack:', err.stack);
    
    writeSse(res, 'error', { 
      message: err?.message || 'Tạo đề thất bại' 
    });
    res.end();
  }
}