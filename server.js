const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const port = 3000;

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Handle API routes
  if (pathname.startsWith('/api/')) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    // Handle API route
    const apiPath = pathname.replace('/api/', '');
    const apiFilePath = path.join(__dirname, 'api', apiPath + '.js');
    
    try {
      if (fs.existsSync(apiFilePath)) {
        // Collect request body for POST requests
        let body = '';
        if (req.method === 'POST') {
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', async () => {
            try {
              req.body = JSON.parse(body);
              
              // Load and execute the API handler
              delete require.cache[require.resolve(apiFilePath)];
              const handler = require(apiFilePath).default || require(apiFilePath);
              
              // Mock response object
              const mockRes = {
                status: (code) => {
                  res.statusCode = code;
                  return mockRes;
                },
                json: (data) => {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                },
                end: (data) => res.end(data)
              };
              
              await handler(req, mockRes);
            } catch (error) {
              console.error('API Error:', error);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Internal server error' }));
            }
          });
        } else {
          // For non-POST requests
          delete require.cache[require.resolve(apiFilePath)];
          const handler = require(apiFilePath).default || require(apiFilePath);
          
          const mockRes = {
            status: (code) => {
              res.statusCode = code;
              return mockRes;
            },
            json: (data) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            },
            end: (data) => res.end(data)
          };
          
          await handler(req, mockRes);
        }
      } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'API endpoint not found' }));
      }
    } catch (error) {
      console.error('Server error:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  } else {
    // Serve static files
    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join(__dirname, filePath);
    
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      const contentType = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif'
      }[ext] || 'text/plain';
      
      res.setHeader('Content-Type', contentType);
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.statusCode = 404;
      res.end('File not found');
    }
  }
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});