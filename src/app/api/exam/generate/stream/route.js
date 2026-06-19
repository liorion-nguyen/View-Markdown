import '../../../../../../server/config/loadEnv.js';
import { examController } from '../../../../../../server/controllers/ExamController.js';
import {
  isUserGeminiKeyRequest,
  resolveAiError,
} from '../../../../../../server/utils/aiErrors.js';

export const maxDuration = 120;

export async function POST(request) {
  const body = await request.json();
  const useUserKey = isUserGeminiKeyRequest(body);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of examController.generateStream(body)) {
          if (event.type === 'chunk') {
            controller.enqueue(
              encoder.encode(`event: chunk\ndata: ${JSON.stringify({ text: event.text })}\n\n`),
            );
          } else if (event.type === 'done') {
            controller.enqueue(
              encoder.encode(
                `event: done\ndata: ${JSON.stringify({ markdown: event.markdown })}\n\n`,
              ),
            );
          }
        }
        controller.close();
      } catch (err) {
        const { code, message } = resolveAiError(err, { useUserKey });
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({ code, message })}\n\n`,
          ),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
