const http = require('http');

function createServer () {
    const requestListener = function (req, res) {
        setTimeout(function () {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'text/html')
            res.writeHead(200);
            res.write(`
                <head><title>test page</title>
                <script src="https://raw.githubusercontent.com/AlexKamaev/issues/master/test.js"></script>
                </head>
                <body><style>body{background-color: blue;width:100%;height:100%;}</style><h1>example</h1></body>
                <script>
                    const DATE_NOW     = Date.now();
                    const LOCK_TIMEOUT = 8000;
            
                    while (Date.now() < DATE_NOW + LOCK_TIMEOUT) {
                    }
                </script>
                `);
            res.end();
        }, 8000);
    };

    const server = http.createServer(requestListener);

    server.listen(1340);

    return server;
}

return createServer();
