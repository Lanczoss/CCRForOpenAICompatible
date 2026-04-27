import http from 'http';

const data = JSON.stringify({
  model: "gpt-3.5-turbo",
  messages: [{ role: "user", content: "Hello" }],
  stream: true
});

const req = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
  res.on('end', () => {
    console.log('No more data in response.');
  });
});

req.write(data);
req.end();
