require('./polyfill')
var os = require('os')
var express = require('express')

var config = require('../../config')
var controller = require('./controller')
var mid = require('./mid')

var app = express()
GLOBAL.blog = {}

setHeader(app)
mid.useMid(app)

var models = require('./model/models')
controller.setApiRouters(app, models)

if (os.platform() !== 'darwin') {
    renewDbTimer(models)
}

controller.setViews(app)

app.get('*', handleRender)


app.listen(config.serverPort)
console.log('listening:', config.serverPort)

function setHeader(app) {
    app.all('*', function(req, res, next) {
        // for local dev
        // res.header("Access-Control-Allow-Origin", "http://localhost:8080")
        res.header('Access-Control-Allow-Origin', 'http://simplyy.space')
        res.header('Access-Control-Allow-Methods','PUT,POST,GET,DELETE,OPTIONS')
        res.header('Access-Control-Allow-Headers',
            'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
        if (req.method === 'OPTIONS') {
            res.sendStatus(200)
        }
        next()
    })
}

function renewDbTimer(models) {
    models.renewDatabase()
    setInterval(function () {
        models.renewDatabase()
    }, config.renewInterval * 1000)
}

require('babel-core/register')
var React = require('react')
var renderToString = require('react-dom/server').renderToString
var createMemoryHistory = require('history/lib/createMemoryHistory')
var reactRouter = require('react-router')
var match = reactRouter.match
var RouterContext = reactRouter.RouterContext
var Provider = require('react-redux').Provider

var configureStore = require('../../front-end/src/react/store/createConfigureStore.jsx').default

var loadMustDataAction = require('../../front-end/src/react/actions/articles.js').loadMustDataAction

var routes = require('../../front-end/src/routes.jsx').default

function handleRender(req, res) {
    var history = createMemoryHistory()
    var store = configureStore(undefined, history)
    console.log(req.url)
    match({ routes: routes, location: req.url }, function(error, redirectLocation, renderProps) {
        if (error) {
            res.status(500).send(error.message)
        }
        else if (redirectLocation) {
            res.redirect(302, redirectLocation.pathname + redirectLocation.search)
        }
        else if (renderProps) {
            var initialState
            var reactHtml
            models.loadMustData(req.url)
                .then(function(data) {
                    store.dispatch(loadMustDataAction(data))
                    initialState = store.getState()
                    var Router = React.createElement(RouterContext, renderProps)
                    var Root = React.createElement(Provider, {store: store}, Router)
                    reactHtml = renderToString(Root)
                    return GLOBAL.blog.title
                })
                .then(function(title) {
                    console.log(title)
                    // 把渲染后的页面内容发送给客户端
                    res.send(renderFullPage(reactHtml, initialState, GLOBAL.blog.title))

                })
                .catch(function(error) {
                    if (error) {
                        console.log('loadMustData:', error)
                        throw error
                    }
                })

        }
        else {
            res.status(404).send('Not found')
        }
    })
}

function renderFullPage(html, initialState, title) {
    return `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="utf-8">
            <title>${title}</title>
        </head>
        <body>
            <div id="root">${html}</div>
            <script>
                window.__INITIAL_STATE__ = ${JSON.stringify(initialState)}
            </script>
            <script src="http://7xkpdt.com1.z0.glb.clouddn.com/libs.348172ab82b494835d50.0.js"></script>
            <script src="/static/bundle.js"></script>

            <script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
            <!-- 博客 -->
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-client="ca-pub-9240750359266096"
                 data-ad-slot="9883600562"
                 data-ad-format="auto"></ins>
            <script>
            (adsbygoogle = window.adsbygoogle || []).push({});
            </script>
        </body>
        </html>
    `
}
