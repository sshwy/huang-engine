const fs = require('fs');

const data = fs.readFileSync('./gameData.yaml')

const buf = Buffer.from(encodeURI(data))

fs.writeFileSync('data.dump', buf.toString('base64'), 'utf8')
