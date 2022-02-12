import tap from 'tap'
import { PostLexingTransformer, findAttrs, findChildren } from '../src/index.js'
import concat from 'concat-stream'
import { Readable } from 'stream'

const input = JSON.stringify({"source":"/Users/aakoch/projects/new-foo/workspaces/pug-lexing-transformer/test/pug/attrs_copy.pug","name":"foo","type":"tag","attrs_start":[{"name":"abc"}],"lineNumber": 1, "children":[
  {"source":"/Users/aakoch/projects/new-foo/workspaces/pug-lexing-transformer/test/pug/attrs_copy.pug","type":"attrs_end","val":[{"name":"def"}],"lineNumber": 2}]
});

tap.test('findAttrs', childTest => {
  tap.same(JSON.parse(findAttrs(input)), [{"name":"abc"}])
  childTest.end()
})

tap.test('findChildren', childTest => {
  tap.same(JSON.parse(findChildren(input)), [{"source":"/Users/aakoch/projects/new-foo/workspaces/pug-lexing-transformer/test/pug/attrs_copy.pug","type":"attrs_end","val":[{"name":"def"}],"lineNumber": 2}])
  childTest.end()
})

tap.test('test found', childTest => {
  const expected = {"source":"/Users/aakoch/projects/new-foo/workspaces/pug-lexing-transformer/test/pug/attrs_copy.pug","name":"foo","type":"tag","attrs":[{"name":"abc"},{"name":"def"}],"lineNumber": 1};

  const transformer = new PostLexingTransformer()
  Readable.from(input).pipe(transformer).pipe(concat({}, (body) => {
      tap.same(JSON.parse(body), expected)
      childTest.end()
  }));
})