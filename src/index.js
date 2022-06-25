import stream from 'stream'
import debugFunc from 'debug'
import { inspect } from 'node:util'
const debug = debugFunc('post-lexing-transformer')

class PostLexingTransformer extends stream.Transform {
  constructor(options) {
    super({ decodeStrings: true, encoding: 'utf8', objectMode: true })
    debug('entering constuctor')
    this.hadError = false
  }
  _flush(callback) {
    debug('entering _flush')
    debug('_flush(): this.hadError: ' + this.hadError)
    debug('Pulling previous string: ' + this.previousStr)
    callback(this.previousStr)
    debug('exiting _flush')
  }
  _transform(str, enc, callback) {
    debug('str=', str)

    let jsonStr
    // This is the object-based approach
    debug('this.hadError: ' + this.hadError)
    if (typeof this.previousStr !== 'undefined') {
      debug('Pulling previous string: ' + this.previousStr)
      jsonStr = this.previousStr + str
      debug('combined string=', jsonStr)
      delete this.previousStr
      this.hadError = false
    } else {
      jsonStr = str
    }

    try {
      const startIdx = jsonStr.indexOf('attrs_start')
      if (startIdx > -1) {
        const jsonObject = JSON.parse(jsonStr)[0]
        debug('jsonObject=', inspect(jsonObject, false, 4))
        jsonObject.attrs = []
        debug('jsonObject.attrs_start=', jsonObject.attrs_start)
        jsonObject.attrs.push(...jsonObject.attrs_start)
        jsonObject.attrs.push(...jsonObject.children[0].val)
        delete jsonObject.attrs_start
        delete jsonObject.children
        debug('jsonObject out=', jsonObject)

        this.push(JSON.stringify(jsonObject))
      } else {
        this.push(jsonStr)
      }
      callback()
    } catch (e) {
      if (e.name === 'SyntaxError') {
        // const newError = new Error('Error parsing JSON input: \n\t' + str + '\nError message was: ' + e.message, { cause: e });
        // callback(newError)
        debug('SyntaxError: ', jsonStr)
        this.hadError = true
        this.previousStr = jsonStr
        // this.unshift(jsonStr)
        // this.push('')
        callback()
      } else {
        callback(e)
      }
    }
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
    } else if (char === ']') {
      if (leftBracketCount == 0) {
        endBracketFound = true
      } else {
        leftBracketCount--
      }
    }
    charIndex++
  }
  return str.substring(leftBracketIdx, leftBracketIdx + charIndex)
}

export { PostLexingTransformer, findAttrs, findChildren }
