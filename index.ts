import * as http from "http";
import {IncomingMessage, ServerResponse} from "http";
import * as fs from "fs";
import * as p from "path"
import * as url from "url";

const server = http.createServer();
const publicDir = p.resolve(__dirname, 'public')
let cacheAge = 3600 * 24 * 365

server.on('request', (request: IncomingMessage, response: ServerResponse) => {
  const {method, url: path, headers} = request
  const {pathname, search} = url.parse(path, true)
  const filename = pathname.substring(1) || 'index.html'
  const suffix = filename.substring(filename.lastIndexOf('.'))
  const fileTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.png': 'text/png',
    '.jpg': 'text/jpeg',
  }

  if (method !== 'GET') {
    response.statusCode = 405;
    response.end()
    return
  }
  response.setHeader('Content-Type', `${fileTypes[suffix] || 'text/html'}; charset=utf-8`)

  new Promise((resolve, reject) => {
    fs.readFile(p.resolve(publicDir, filename), (error, data) => {
      if (error) {
        if (error.errno === -4058) {
          response.statusCode = 404
          response.setHeader('Content-Type', `text/html; charset=utf-8`)
          new Promise((resolve, reject) => {
            fs.readFile(p.resolve(publicDir, '404.html'), (error, data) => {
              return resolve(data)
            })
          }).then((data) => {
            return reject(data)
          })
        } else if (error.errno == -4068) {
          response.statusCode = 403
          return reject("No permission to view directory contents.")
        } else {
          response.statusCode = 500
          return reject("The server is busy, please try again later.")
        }
      } else {
        return resolve(data)
      }
    })
  }).then((data) => {
    response.setHeader('Cache-Control', `public, max-age=${cacheAge}`)
    response.end(data)
  }, (data) => {
    response.end(data)
  })

})

server.listen(8888)

