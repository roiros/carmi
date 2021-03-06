const _ = require('lodash')
const React = require('react')
const { Fragment } = React
const { renderToStaticMarkup } = require('react-dom/server')

const css = (([css]) => <style dangerouslySetInnerHTML={{ __html: css}} />)`
  .body {
    margin: 0 auto;
  }
  .wrapper {
    display: block;
    height: 100vh
  }
  .method-link{
    font-size: 15px;
    margin-left: -15px;
    visibility: hidden;
  }
  .card-title:hover > .method-link {
    visibility: visible;
  }
  .method-link:hover {
    text-decoration:none;
  }
  .runkit-embed {
    overflow: hidden;
    cursor: pointer;
  }
`

const Wrapper = (props) =>
  <html lang="en">
    <head>
      {/*<meta httpEquiv="refresh" content="20"/>*/}
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="shortcut icon" href="/img/favicon.ico"/>
      <title>{props.title}</title>
      <link rel="stylesheet" href="https://unpkg.com/bootstrap@4.1.0/dist/css/bootstrap.min.css" crossOrigin="anonymous"/>
      <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.14.2/styles/tomorrow.min.css" />
      <script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.14.2/highlight.min.js"></script>
      {css}

    </head>
    <body>
      {props.children}
      <script src="/runkit.js" />
      <script>hljs.initHighlightingOnLoad()</script>
    </body>
  </html>


const InheritedMethods = ({methods}) =>
  <ul>
    {methods.map(({name, inheritedFrom: {name: parent, id}}) =>
      <li><a href={`#doc-${id}`}>{name}()</a></li>
    )}
  </ul>

const genSignature = (signatures) => _(signatures)
  .get('0.parameters', [])
  .map((param) => _(param)
    //.tap(console.log.bind(console))
    .get('name', '*')
  )
  .join(', ')
const IssueLink = ({name, id}) => <a target="_blank" href={`https://github.com/wix-incubator/carmi/issues/new?assignee=LeonFedotov&body=${encodeURIComponent(`
  Here is my Example for [${name}](https://carmi.js.org/api.html#doc-${id}):
  \`\`\`javascript
    const { root } = require('carmi');
    const instance = fromSource({output: root.get(0)}, [2]);
    instance.output //2
  \`\`\`
`)}&title=${encodeURIComponent(`Example for ${name}`)}`}>Add example/suggest documentation</a>


const Runkit = ({source, name, id}) => source ? <pre><code className="runkit-embed lang-JavaScript">{source.text.trim()}</code></pre> : <IssueLink name={name} id={id}/>
const SelfMethods = ({methods}) => <Fragment>
  {_.chain(methods)
    //.tap((v) => console.dir(v.filter(({id}) => id == 755), {depth: null}))
    .map(({id, name, kindString: type, signatures}) =>
      <div className="card mt-2" id={`doc-${id}`}>
        <div className="card-body">
          <h5 className="card-title">
            <a className="text-secondary method-link" href={`#doc-${id}`}>🔗</a>
            <code>
              {name}({genSignature(signatures)}) {_.chain(signatures).get('0.comment.tags', []).some({ tag: 'sugar' }).value() ? '🍬' : ''}
            </code>
          </h5>
          <p className="card-text">{_.get(signatures, '0.comment.shortText', 'MISSING DESCR')}</p>
          <Runkit id={id} name={name} source={_.chain(signatures).get('0.comment.tags', []).find({tag: 'example'}).value()} />
        </div>
      </div>
    )
    .value()}
</Fragment>

const Section = ({id, comment: {shortText: name}, kindString: type, children}) => {
  const [inherited, methods] = _(children)
    .filter(({kindString}) => kindString == 'Method')
    .sortBy('name')
    .partition('inheritedFrom')
    .value()

  return (
    <div className="card mt-2" id={`doc-${id}`}>
      <div className="card-body">
        <h5 className="card-title">{name}</h5>
        <h6 className="card-subtitle mb-2">Inherited methods</h6>
        <InheritedMethods methods={inherited} />
        <h6 className="card-subtitle mb-2">Methods</h6>
        <SelfMethods methods={methods} />
      </div>
    </div>
  )
}

const Sidebar = ({data}) => <sidebar className="d-none d-md-block col-3 align-items-stretch">
  <ul className="sidebar">
    {data.map(({id, comment: {shortText: name}, children}) => <li>
      <a href={`#doc-${id}`}>{name}</a>

      <ul className="method-list">
        {_(children)
          .filter(({kindString, inheritedFrom}) => kindString == 'Method' && !inheritedFrom)
          .sortBy('name')
          .map(({id, name}) =>
            <li><small><code><a href={`#doc-${id}`}> {name}()</a></code></small></li>
          ).value()}
      </ul>
    </li>)}
  </ul>
</sidebar>

module.exports = {
  Section,
  Sidebar,
  main(props) {
    return `<!DOCTYPE html>
      ${renderToStaticMarkup(Wrapper(props))}
    `
  },
  home({data}) {
    return <wrapper className="container-fluid wrapper">
      <header className="row align-items-center">
        <a href="/" className="col"><img src="/img/carmi.png" alt="carmi"/></a>
        <div className="col">
          <ul className="nav nav-pills justify-content-end">
            <li className="nav-item">
              <a className="nav-link" href="/docs/getting-started.html">Getting started</a>
            </li>
            <li className="nav-item">
              <a className="nav-link active" href="/api.html">API</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/docs/design.html">Design</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/docs/help.html">Help</a>
            </li>
          </ul>
        </div>
      </header>
      <page className="row">
        <Sidebar data={data} />
        <content className="col">
          {data.map((section) => <Section {...section} />)}
        </content>
      </page>
      <footer className="row mt-2"><span className="col offset-5">Copyright © 2018 Wix</span></footer>
    </wrapper>
  }
}
