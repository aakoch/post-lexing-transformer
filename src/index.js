import stream from 'stream'
import debugFunc from 'debug'
const debug = debugFunc('post-lexing-transformer')

class PostLexingTransformer extends stream.Transform {  constructor(options) {
    super({ decodeStrings: true, encoding: 'utf8', objectMode: true })
    debug('entering constuctor')
  }
  _transform(str, enc, callback) {
    const startIdx = str.indexOf('attrs_start')
    if (startIdx > -1) {
      // This is the object-based approach
      const jsonObject = JSON.parse(str)
      debug('jsonObject in=', jsonObject)
      jsonObject.attrs = []
      jsonObject.attrs.push(...jsonObject.attrs_start)
      jsonObject.attrs.push(...jsonObject.children[0].val)
      delete jsonObject.attrs_start
      delete jsonObject.children
      debug('jsonObject out=', jsonObject)

      this.push(JSON.stringify(jsonObject))
    }
    else {
      this.push(str)
    }
    callback();
  }
}

function findAttrs(str, startIdx) {
  return findValue(str, 'attrs_start', startIdx)
}

function findChildren(str, startIdx) {
  return findValue(str, 'children', startIdx)
}

function findValue(str, key, startIdx) {
  debug('key=' + key)
  const keyIdx = str.indexOf(key, startIdx)
  debug('keyIdx=' + keyIdx)
  const colonIdx = str.indexOf(':', keyIdx + key.length)
  debug('colonIdx=' + colonIdx)
  return findString(str, colonIdx)
}

function findString(str, idx) {
  const leftBracketIdx = str.indexOf('[', idx + 1)
  debug('leftBracketIdx=' + leftBracketIdx)
  let endBracketFound = false
  let leftBracketCount = 0
  let charIndex = 1
  while (!endBracketFound) {
    const char = str.charAt(leftBracketIdx + charIndex)
    if (char === '[') {
      leftBracketCount++
    }
    else if (char === ']') {
      if (leftBracketCount == 0) {
        endBracketFound = true
      }
      else {
        leftBracketCount--
      }
    }
    charIndex++
  }
  return str.substring(leftBracketIdx, leftBracketIdx + charIndex)
}

export { PostLexingTransformer, findAttrs, findChildren }