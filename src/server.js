require("dotenv").config();
const portfinder = require("portfinder");
const {startDatabase} = require('./database/databaseConn')

portfinder.basePort = 4250;
portfinder.highestPort = 9000;

const http = require("http");
const app = require("./app.js");

const server = http.createServer(app);

startDatabase() 

async function startServer() {
  portfinder.getPort((err, port) => {
      if (err) throw err;
      server.listen(port, () => {
        console.log(`Server is Listening on port: ${port}`);
      });
    });
}



startServer();
