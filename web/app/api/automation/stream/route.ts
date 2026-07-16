import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Send an active pipeline event message package right away
  writer.write(encoder.encode('data: ' + JSON.stringify({ 
    message: 'Crucible Automation Engine broker synchronized successfully.' 
  }) + '\n\n'));

  request.signal.addEventListener('abort', () => {
    writer.close();
  });

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}