import fs from 'node:fs'

function patchPath(filePath) {
  if (typeof filePath === 'string' && filePath.includes('?module')) {
    return filePath.replace(/\?module/g, '_module')
  }
  return filePath
}

for (const method of ['openSync', 'writeFileSync', 'readFileSync', 'copyFileSync', 'mkdirSync']) {
  const original = fs[method]
  if (!original) continue
  fs[method] = function patched(patchedPath, ...args) {
    return original.call(this, patchPath(patchedPath), ...args)
  }
}

for (const method of ['open', 'writeFile', 'readFile', 'copyFile', 'mkdir']) {
  const original = fs[method]
  if (!original) continue
  fs[method] = function patched(patchedPath, ...args) {
    const callback = typeof args[args.length - 1] === 'function' ? args.pop() : undefined
    if (callback) {
      return original.call(this, patchPath(patchedPath), ...args, (err, ...cbArgs) => callback(err, ...cbArgs))
    }
    return original.call(this, patchPath(patchedPath), ...args)
  }
}

const createWriteStream = fs.createWriteStream.bind(fs)
fs.createWriteStream = (streamPath, ...args) => createWriteStream(patchPath(streamPath), ...args)
