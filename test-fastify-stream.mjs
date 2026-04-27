import Fastify from 'fastify';
const fastify = Fastify({ logger: false });

fastify.get('/stream', async (request, reply) => {
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 5; i++) {
        controller.enqueue(new TextEncoder().encode(`data: ${i}\n\n`));
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      controller.close();
    }
  });

  reply.header('Content-Type', 'text/event-stream');
  return reply.send(stream);
});

fastify.listen({ port: 3000 });
