const Fastify = require('fastify');
const fastify = Fastify({ logger: true });

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
  return stream;
});

fastify.listen({ port: 3000 }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
