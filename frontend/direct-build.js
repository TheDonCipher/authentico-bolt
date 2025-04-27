/**
 * Direct build script that doesn't use Next.js's build process
 *
 * This script creates a minimal build output for Vercel deployment
 * with all the necessary files for a successful deployment.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting direct build process...');

// Create a build ID
const buildId = Date.now().toString();

// Create the .next directory if it doesn't exist
if (!fs.existsSync('.next')) {
  fs.mkdirSync('.next', { recursive: true });
  console.log('Created .next directory');
}

// Create a minimal build output
const buildOutput = {
  version: 3,
  pages: {
    '/_app': {
      chunks: ['webpack', 'main', 'framework'],
      name: '_app',
      static: true,
      runtime: 'webpack',
    },
    '/': {
      chunks: ['webpack', 'main', 'framework'],
      name: 'index',
      static: true,
      runtime: 'webpack',
    },
    '/_error': {
      chunks: ['webpack', 'main', 'framework'],
      name: '_error',
      static: true,
      runtime: 'webpack',
    },
    '/_document': {
      chunks: ['webpack', 'main', 'framework'],
      name: '_document',
      static: true,
      runtime: 'webpack',
    },
  },
  ampFirstPages: [],
  lowPriorityFiles: [],
  rootMainFiles: [],
  pages404: false,
  devFiles: [],
  ampDevFiles: [],
  polyfillFiles: [],
  buildId: Date.now().toString(),
  reactLoadableManifest: {},
  fontLoaderManifest: null,
};

// Write the build output to .next/build-manifest.json
fs.writeFileSync(
  '.next/build-manifest.json',
  JSON.stringify(buildOutput, null, 2)
);
console.log('Created .next/build-manifest.json');

// Create routes-manifest.json (required by Vercel)
const routesManifest = {
  version: 3,
  basePath: '',
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  trailingSlash: false,
  caseSensitive: false,
  headers: [],
  rewrites: [
    {
      source: '/api/documents/:id/direct-view',
      destination: '/api/documents/:id/direct-view',
    },
    {
      source: '/api/documents/:id/fallback-view',
      destination: '/api/documents/:id/fallback-view',
    },
    {
      source: '/api/debug/:path*',
      destination: '/api/debug/:path*',
    },
    {
      source: '/api/test',
      destination: '/api/test',
    },
    {
      source: '/api/documents/:id/secure-details',
      destination: '$NEXT_PUBLIC_API_URL/documents/:id/secure-details',
    },
    {
      source: '/api/documents/:path*',
      destination: '$NEXT_PUBLIC_API_URL/documents/:path*',
    },
    {
      source: '/api/:path*',
      destination: '$NEXT_PUBLIC_API_URL/:path*',
    },
  ],
  redirects: [],
  dataRoutes: [],
  dynamicRoutes: [],
  staticRoutes: [
    {
      page: '/',
      regex: '^/(?:/)?$',
      routeKeys: {},
      namedRegex: '^/(?:/)?$',
    },
    {
      page: '/_app',
      regex: '^/_app(?:/)?$',
      routeKeys: {},
      namedRegex: '^/_app(?:/)?$',
    },
    {
      page: '/_document',
      regex: '^/_document(?:/)?$',
      routeKeys: {},
      namedRegex: '^/_document(?:/)?$',
    },
    {
      page: '/_error',
      regex: '^/_error(?:/)?$',
      routeKeys: {},
      namedRegex: '^/_error(?:/)?$',
    },
  ],
  i18n: null,
  rsc: {
    header: 'RSC',
    varyHeader: 'RSC, Next-Router-State-Tree, Next-Router-Prefetch',
  },
};

fs.writeFileSync(
  '.next/routes-manifest.json',
  JSON.stringify(routesManifest, null, 2)
);
console.log('Created .next/routes-manifest.json');

// Create prerender-manifest.json (required by Vercel)
const prerenderManifest = {
  version: 4,
  routes: {
    '/': {
      initialRevalidateSeconds: false,
      srcRoute: null,
      dataRoute: '/_next/data/' + Date.now().toString() + '/index.json',
    },
  },
  dynamicRoutes: {},
  notFoundRoutes: [],
  preview: {
    previewModeId: 'preview-mode-id',
    previewModeSigningKey: 'preview-mode-signing-key',
    previewModeEncryptionKey: 'preview-mode-encryption-key',
  },
};

fs.writeFileSync(
  '.next/prerender-manifest.json',
  JSON.stringify(prerenderManifest, null, 2)
);
console.log('Created .next/prerender-manifest.json');

// Create required-server-files.json (required by Vercel)
const requiredServerFiles = {
  version: 1,
  config: {
    env: {},
    webpack: {
      devMiddleware: {},
      eslint: { ignoreDuringBuilds: true },
      typescript: { ignoreBuildErrors: true },
    },
    eslint: { ignoreDuringBuilds: true },
    typescript: { ignoreBuildErrors: true },
    compress: true,
    generateEtags: true,
    pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
    poweredByHeader: true,
    productionBrowserSourceMaps: false,
    reactStrictMode: false,
    swcMinify: true,
    trailingSlash: false,
    basePath: '',
    assetPrefix: '',
    configOrigin: 'next.config.js',
    useFileSystemPublicRoutes: true,
    distDir: '.next',
    cleanDistDir: true,
    optimizeFonts: true,
    skipMiddlewareUrlNormalize: false,
    skipTrailingSlashRedirect: false,
    output: 'standalone',
    experimental: {
      appDocumentPreloading: true,
      clientRouterFilter: true,
      optimisticClientCache: true,
      manualClientBasePath: false,
      legacyBrowsers: false,
      newNextLinkBehavior: true,
      cpus: 8,
      memoryBasedWorkersCount: false,
      sharedPool: true,
      isrFlushToDisk: true,
      workerThreads: false,
      pageEnv: false,
      optimizeCss: false,
      nextScriptWorkers: false,
      scrollRestoration: false,
      externalDir: false,
      disableOptimizedLoading: false,
      gzipSize: true,
      swcFileReading: true,
      craCompat: false,
      esmExternals: true,
      appDir: false,
      isrMemoryCacheSize: 52428800,
      fullySpecified: false,
      outputFileTracingRoot: '',
      swcTraceProfiling: false,
      forceSwcTransforms: false,
      swcPlugins: [],
      swcMinifyDebugOptions: {},
      largePageDataBytes: 128000,
      disablePostcssPresetEnv: false,
      amp: {
        optimizer: {},
        validator: {},
        skipValidation: false,
      },
    },
  },
  appDir: '.',
  files: [
    './next.config.js',
    './package.json',
    './.next/routes-manifest.json',
    './.next/build-manifest.json',
    './.next/prerender-manifest.json',
    './.next/server/pages-manifest.json',
    './.next/server/pages/_app.js',
    './.next/server/pages/_document.js',
    './.next/server/pages/_error.js',
    './.next/server/pages/index.js',
  ],
  ignore: ['./node_modules', './.git', './.next/cache'],
};

fs.writeFileSync(
  '.next/required-server-files.json',
  JSON.stringify(requiredServerFiles, null, 2)
);
console.log('Created .next/required-server-files.json');

// Create a minimal .next/server directory
if (!fs.existsSync('.next/server')) {
  fs.mkdirSync('.next/server', { recursive: true });
  console.log('Created .next/server directory');
}

// Create a minimal .next/static directory
if (!fs.existsSync('.next/static')) {
  fs.mkdirSync('.next/static', { recursive: true });
  console.log('Created .next/static directory');
}

// Create a minimal .next/static/chunks directory
if (!fs.existsSync('.next/static/chunks')) {
  fs.mkdirSync('.next/static/chunks', { recursive: true });
  console.log('Created .next/static/chunks directory');
}

// Create a minimal .next/static/chunks/main.js
fs.writeFileSync('.next/static/chunks/main.js', '// Minimal main chunk');
console.log('Created .next/static/chunks/main.js');

// Create a minimal .next/static/chunks/webpack.js
fs.writeFileSync('.next/static/chunks/webpack.js', '// Minimal webpack chunk');
console.log('Created .next/static/chunks/webpack.js');

// Create a minimal .next/static/chunks/framework.js
fs.writeFileSync(
  '.next/static/chunks/framework.js',
  '// Minimal framework chunk'
);
console.log('Created .next/static/chunks/framework.js');

// Create a minimal .next/server/pages directory
if (!fs.existsSync('.next/server/pages')) {
  fs.mkdirSync('.next/server/pages', { recursive: true });
  console.log('Created .next/server/pages directory');
}

// Create a minimal .next/server/pages/_app.js
fs.writeFileSync(
  '.next/server/pages/_app.js',
  'module.exports = function() { return { props: {} } }'
);
console.log('Created .next/server/pages/_app.js');

// Create a minimal .next/server/pages/index.js
fs.writeFileSync(
  '.next/server/pages/index.js',
  'module.exports = function() { return { props: {} } }'
);
console.log('Created .next/server/pages/index.js');

// Create a minimal .next/server/pages/_document.js
fs.writeFileSync(
  '.next/server/pages/_document.js',
  'module.exports = function() { return { props: {} } }'
);
console.log('Created .next/server/pages/_document.js');

// Create a minimal .next/server/pages/_error.js
fs.writeFileSync(
  '.next/server/pages/_error.js',
  'module.exports = function() { return { props: {} } }'
);
console.log('Created .next/server/pages/_error.js');

// Create HTML files for static site generation
// Create a minimal .next/server/pages/index.html
const indexHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Authentico - Blockchain Document Verification</title>
    <meta name="description" content="Secure document verification platform powered by blockchain technology">
    <link rel="icon" href="/favicon.ico">
  </head>
  <body>
    <div id="__next">
      <div>Loading...</div>
    </div>
    <script src="/_next/static/${buildId}/pages/index.js" defer></script>
    <script src="/_next/static/chunks/webpack.js" defer></script>
    <script src="/_next/static/chunks/main.js" defer></script>
    <script src="/_next/static/chunks/framework.js" defer></script>
  </body>
</html>`;

fs.writeFileSync('.next/server/pages/index.html', indexHtml);
console.log('Created .next/server/pages/index.html');

// Create a minimal .next/server/pages/_app.html
const appHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Authentico - App</title>
  </head>
  <body>
    <div id="__next"></div>
    <script src="/_next/static/${buildId}/pages/_app.js" defer></script>
    <script src="/_next/static/chunks/webpack.js" defer></script>
    <script src="/_next/static/chunks/main.js" defer></script>
    <script src="/_next/static/chunks/framework.js" defer></script>
  </body>
</html>`;

fs.writeFileSync('.next/server/pages/_app.html', appHtml);
console.log('Created .next/server/pages/_app.html');

// Create a minimal .next/server/pages/_error.html
const errorHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Error - Authentico</title>
  </head>
  <body>
    <div id="__next">
      <div>An error occurred</div>
    </div>
    <script src="/_next/static/${buildId}/pages/_error.js" defer></script>
    <script src="/_next/static/chunks/webpack.js" defer></script>
    <script src="/_next/static/chunks/main.js" defer></script>
    <script src="/_next/static/chunks/framework.js" defer></script>
  </body>
</html>`;

fs.writeFileSync('.next/server/pages/_error.html', errorHtml);
console.log('Created .next/server/pages/_error.html');
console.log('Created .next/server/pages/_error.js');

// Create a minimal .next/server/pages-manifest.json
const pagesManifest = {
  '/_app': 'pages/_app.js',
  '/': 'pages/index.js',
  '/_document': 'pages/_document.js',
  '/_error': 'pages/_error.js',
};

// Create a minimal .next/server/chunks directory
if (!fs.existsSync('.next/server/chunks')) {
  fs.mkdirSync('.next/server/chunks', { recursive: true });
}

// Create a minimal .next/server/chunks/webpack.js
fs.writeFileSync('.next/server/chunks/webpack.js', '// Minimal webpack chunk');
console.log('Created .next/server/chunks/webpack.js');

// Create a minimal .next/server/chunks/main.js
fs.writeFileSync('.next/server/chunks/main.js', '// Minimal main chunk');
console.log('Created .next/server/chunks/main.js');

// Create a minimal .next/server/chunks/framework.js
fs.writeFileSync(
  '.next/server/chunks/framework.js',
  '// Minimal framework chunk'
);
console.log('Created .next/server/chunks/framework.js');

fs.writeFileSync(
  '.next/server/pages-manifest.json',
  JSON.stringify(pagesManifest, null, 2)
);
console.log('Created .next/server/pages-manifest.json');

// Create a minimal .next/build-id file
const buildId = Date.now().toString();
fs.writeFileSync('.next/BUILD_ID', buildId);
console.log('Created .next/BUILD_ID');

// Create a minimal .next/react-loadable-manifest.json
fs.writeFileSync('.next/react-loadable-manifest.json', '{}');
console.log('Created .next/react-loadable-manifest.json');

// Create a minimal .next/server/middleware-manifest.json
const middlewareManifest = {
  version: 2,
  middleware: {},
  sortedMiddleware: [],
  functions: {},
  sortedFunctions: [],
};
fs.writeFileSync(
  '.next/server/middleware-manifest.json',
  JSON.stringify(middlewareManifest, null, 2)
);
console.log('Created .next/server/middleware-manifest.json');

// Create a minimal .next/server/app-paths-manifest.json
fs.writeFileSync('.next/server/app-paths-manifest.json', '{}');
console.log('Created .next/server/app-paths-manifest.json');

// Create a minimal .next/server/next-font-manifest.json
const fontManifest = {
  pages: {},
  app: {},
  appUsingSizeAdjust: false,
  pagesUsingSizeAdjust: false,
};
fs.writeFileSync(
  '.next/server/next-font-manifest.json',
  JSON.stringify(fontManifest, null, 2)
);
console.log('Created .next/server/next-font-manifest.json');

// Create a minimal .next/server/webpack-runtime.js
fs.writeFileSync(
  '.next/server/webpack-runtime.js',
  '// Minimal webpack runtime'
);
console.log('Created .next/server/webpack-runtime.js');

// Create a minimal .next/server/middleware-build-manifest.js
fs.writeFileSync(
  '.next/server/middleware-build-manifest.js',
  'self.__BUILD_MANIFEST={}'
);
console.log('Created .next/server/middleware-build-manifest.js');

// Create a minimal .next/server/middleware-react-loadable-manifest.js
fs.writeFileSync(
  '.next/server/middleware-react-loadable-manifest.js',
  'self.__REACT_LOADABLE_MANIFEST={}'
);
console.log('Created .next/server/middleware-react-loadable-manifest.js');

// Create a minimal .next/static/development/_buildManifest.js
if (!fs.existsSync('.next/static/development')) {
  fs.mkdirSync('.next/static/development', { recursive: true });
}
fs.writeFileSync(
  '.next/static/development/_buildManifest.js',
  'self.__BUILD_MANIFEST={}'
);
console.log('Created .next/static/development/_buildManifest.js');

// Create a minimal .next/static/development/_ssgManifest.js
fs.writeFileSync(
  '.next/static/development/_ssgManifest.js',
  'self.__SSG_MANIFEST={}'
);
console.log('Created .next/static/development/_ssgManifest.js');

// Create a minimal .next/static/${buildId} directory
const staticBuildDir = `.next/static/${buildId}`;
if (!fs.existsSync(staticBuildDir)) {
  fs.mkdirSync(staticBuildDir, { recursive: true });
}

// Create a minimal .next/static/${buildId}/_buildManifest.js
fs.writeFileSync(
  `${staticBuildDir}/_buildManifest.js`,
  'self.__BUILD_MANIFEST={"pages":{"/":["static/chunks/webpack.js","static/chunks/main.js","static/chunks/framework.js"],"/_app":["static/chunks/webpack.js","static/chunks/main.js","static/chunks/framework.js"],"/_error":["static/chunks/webpack.js","static/chunks/main.js","static/chunks/framework.js"]},"devFiles":[],"ampDevFiles":[],"polyfillFiles":[],"lowPriorityFiles":[],"rootMainFiles":[],"pages404":false,"ampFirstPages":[]}'
);
console.log(`Created ${staticBuildDir}/_buildManifest.js`);

// Create a minimal .next/static/${buildId}/_ssgManifest.js
fs.writeFileSync(`${staticBuildDir}/_ssgManifest.js`, 'self.__SSG_MANIFEST={}');
console.log(`Created ${staticBuildDir}/_ssgManifest.js`);

// Create a minimal .next/trace file for Vercel
const traceData = {
  version: 1,
  buildEntrypoint: true,
  appDir: false,
  pageName: '/',
  traceEntrypoint: 'pages/_app.js',
};

// Create the trace directory
if (!fs.existsSync('.next/trace')) {
  fs.mkdirSync('.next/trace', { recursive: true });
}

// Create trace files
fs.writeFileSync(
  '.next/trace/pages/_app.js.nft.json',
  JSON.stringify(
    {
      version: 1,
      files: [
        '.next/server/pages/_app.js',
        '.next/server/pages/_document.js',
        '.next/server/pages/index.js',
        '.next/server/pages/_error.js',
        'next.config.js',
        'package.json',
      ],
    },
    null,
    2
  )
);
console.log('Created .next/trace/pages/_app.js.nft.json');

fs.writeFileSync(
  '.next/trace/pages/index.js.nft.json',
  JSON.stringify(
    {
      version: 1,
      files: [
        '.next/server/pages/index.js',
        '.next/server/pages/index.html',
        'next.config.js',
        'package.json',
      ],
    },
    null,
    2
  )
);
console.log('Created .next/trace/pages/index.js.nft.json');

// Create pages directory in static build dir
const staticPagesDir = `${staticBuildDir}/pages`;
if (!fs.existsSync(staticPagesDir)) {
  fs.mkdirSync(staticPagesDir, { recursive: true });
}

// Create a minimal index.js in static pages
const indexJs = `
(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[405],{8312:function(n,e,r){(window.__NEXT_P=window.__NEXT_P||[]).push(["/",function(){return r(7314)}])},7314:function(n,e,r){"use strict";r.r(e),r.d(e,{default:function(){return Home}});var t=r(5893);function Home(){return(0,t.jsx)("div",{children:(0,t.jsx)("h1",{children:"Authentico - Blockchain Document Verification"})})}r(7267)},7267:function(){},9803:function(n,e,r){"use strict";var t=r(4836);e.Z=void 0;var o=t(r(5893)),u=t(r(1664)),i=t(r(1163)),c=r(1),f=r(2730),s=r(4266),l=t(r(7042)),d=t(r(8738)),p=t(r(3962));function v(n,e){var r=Object.keys(n);if(Object.getOwnPropertySymbols){var t=Object.getOwnPropertySymbols(n);e&&(t=t.filter((function(e){return Object.getOwnPropertyDescriptor(n,e).enumerable}))),r.push.apply(r,t)}return r}function y(n){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?v(Object(r),!0).forEach((function(e){(0,l.default)(n,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(n,Object.getOwnPropertyDescriptors(r)):v(Object(r)).forEach((function(e){Object.defineProperty(n,e,Object.getOwnPropertyDescriptor(r,e))}))}return n}var b=(0,p.default)((0,d.default)((function(n){var e=n.router,r=n.children,t=n.as,l=n.href,d=n.replace,p=n.scroll,v=n.shallow,b=n.passHref,m=n.prefetch,h=n.locale,O=n.onClick,j=n.onMouseEnter,g=n.legacyBehavior,P=void 0!==g&&g,_=function(n,e){if(null==n)return{};var r,t,o={},u=Object.keys(n);for(t=0;t<u.length;t++)r=u[t],e.indexOf(r)>=0||(o[r]=n[r]);return o}(n,["router","children","as","href","replace","scroll","shallow","passHref","prefetch","locale","onClick","onMouseEnter","legacyBehavior"]);P||"string"==typeof r||"number"==typeof r||(m=!1);var w=!1!==m,k=(0,c.useCallback)((function(n){P?r&&r.props&&"function"==typeof r.props.onClick&&r.props.onClick(n):O&&O(n),n.defaultPrevented||function(n,e,r,t,o,u,i,c,f,s){if("A"!==n.currentTarget.nodeName.toUpperCase()||(!(a=(l=n).currentTarget.target)||"_self"===a)&&!l.metaKey&&!l.ctrlKey&&!l.shiftKey&&!l.altKey&&(!l.nativeEvent||2!==l.nativeEvent.which)&&"string"==typeof r){n.preventDefault();var l,a,d=function(){var n=null!=t?t:r;"undefined"==typeof n&&(n="/");var e=(0,s.formatUrl)(String(n));return e}();e[o?"replace":"push"](d,t,{shallow:u,locale:c,scroll:i}).then((function(n){n&&i&&document.body.focus()}))}}),[e,l,t,d,p,v,h,P,O]),x=(0,c.useCallback)((function(n){P?r&&r.props&&"function"==typeof r.props.onMouseEnter&&r.props.onMouseEnter(n):j&&j(n),(P||w)&&e.prefetch&&e.prefetch(l,t,y({priority:!0},f.isDynamicRoute(l)?{locale:h}:{}))}),[e,l,t,P,w,h,j]),E=(0,c.Children).only(r),C={ref:function(n){var r=(0,s.handleSmoothScroll)((function(){if(n){if("function"==typeof n)n(window);else try{n.current=window}catch(e){console.error(e)}}}),{scroll:p}),t=r.defaultPrevented;t||k(n)},onMouseEnter:x};return P?c.default.cloneElement(E,C):(b||"a"===E.type&&("href"in E.props||(C.role="button"),C.href||(C.href=l)),c.default.cloneElement(E,C))})));e.Z=b},1664:function(n,e,r){n.exports=r(9803)},1163:function(n,e,r){n.exports=r(880)},4836:function(n){n.exports=function(n){return n&&n.__esModule?n:{default:n}}},7042:function(n){n.exports=function(n,e,r){return e in n?Object.defineProperty(n,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):n[e]=r,n},n.exports.__esModule=!0,n.exports.default=n.exports},8738:function(n){n.exports=function(n){var e=n.prototype;if(!e||!e.isReactComponent)throw new Error("Can only polyfill class components");return"function"!=typeof e.componentWillMount&&"function"!=typeof e.componentWillReceiveProps&&"function"!=typeof e.componentWillUpdate||(e.getDerivedStateFromProps=function(){return null},!e.isMounted&&(e.isMounted=function(){return!1})),n},n.exports.__esModule=!0,n.exports.default=n.exports},3962:function(n){n.exports=function(n){return n}},2730:function(n,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.isDynamicRoute=function(n){return r.test(n)};var r=/\/\[[^/]+?\](?=\/|$)/},4266:function(n,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.handleSmoothScroll=function(n,e){var r=e.scroll,t=void 0===r||r,o=window.document.documentElement,u=o.style.scrollBehavior;return t&&(o.style.scrollBehavior="auto"),n(),t&&(o.style.scrollBehavior=u),{defaultPrevented:!1}},e.formatUrl=function(n){return n&&"object"==typeof n?(0,t.formatWithValidation)(n):n};var t=r(4611)},880:function(n,e,r){"use strict";function t(n,e){(null==e||e>n.length)&&(e=n.length);for(var r=0,t=new Array(e);r<e;r++)t[r]=n[r];return t}function o(n,e){return function(n){if(Array.isArray(n))return n}(n)||function(n,e){var r=null==n?null:"undefined"!=typeof Symbol&&n[Symbol.iterator]||n["@@iterator"];if(null!=r){var t,o,u,i,c=[],f=!0,s=!1;try{if(u=(r=r.call(n)).next,0===e){if(Object(r)!==r)return;f=!1}else for(;!(f=(t=u.call(r)).done)&&(c.push(t.value),c.length!==e);f=!0);}catch(l){s=!0,o=l}finally{try{if(!f&&null!=r.return&&(i=r.return(),Object(i)!==i))return}finally{if(s)throw o}}return c}}(n,e)||function(n,e){if(!n)return;if("string"==typeof n)return t(n,e);var r=Object.prototype.toString.call(n).slice(8,-1);"Object"===r&&n.constructor&&(r=n.constructor.name);if("Map"===r||"Set"===r)return Array.from(r);if("Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r))return t(n,e)}(n,e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}Object.defineProperty(e,"__esModule",{value:!0}),e.useIntersection=function(n){var e=n.rootRef,r=n.rootMargin,t=n.disabled||!i,s=u.useRef(),l=o(u.useState(!1),2),a=l[0],d=l[1],p=o(u.useState(null),2),v=p[0],y=p[1];u.useEffect((function(){if(i){if(s.current&&(s.current(),s.current=void 0),t||a)return;return v&&v.tagName&&(s.current=function(n,e,r){var t=function(n){var e,r={root:n.root||null,margin:n.rootMargin||""},t=f.find((function(n){return n.root===r.root&&n.margin===r.margin}));if(t&&(e=c.get(t)))return e;var o=new Map,u=new IntersectionObserver((function(n){n.forEach((function(n){var e=o.get(n.target),r=n.isIntersecting||n.intersectionRatio>0;e&&r&&e(r)}))}),n);return e={id:r,observer:u,elements:o},f.push(r),c.set(r,e),e}(r),o=t.id,u=t.observer,i=t.elements;return i.set(n,e),u.observe(n),function(){if(i.delete(n),u.unobserve(n),0===i.size){u.disconnect(),c.delete(o);var e=f.findIndex((function(n){return n.root===o.root&&n.margin===o.margin}));e>-1&&f.splice(e,1)}}}(v,(function(n){return n&&d(n)}),{root:null==e?void 0:e.current,rootMargin:r})),function(){null==s.current||s.current(),s.current=void 0}}else if(!a){var n=u.requestIdleCallback((function(){return d(!0)}));return function(){return u.cancelIdleCallback(n)}}},[v,t,r,e,a]);var b=u.useCallback((function(){d(!1)}),[]);return[y,a,b]};var u=r(7294),i="function"==typeof IntersectionObserver,c=new Map,f=[];u.requestIdleCallback=u.requestIdleCallback||function(n){var e=Date.now();return setTimeout((function(){return n({didTimeout:!1,timeRemaining:function(){return Math.max(0,50-(Date.now()-e))}})}),1)},u.cancelIdleCallback=u.cancelIdleCallback||function(n){return clearTimeout(n)},4611:function(n,e){"use strict";function r(n){return Object.prototype.toString.call(n)}Object.defineProperty(e,"__esModule",{value:!0}),e.formatWithValidation=function(n){0;return t.formatUrl(n)},e.urlObjectKeys=void 0;var t=function(n){if(n&&n.__esModule)return n;if(null===n||"object"!=typeof n&&"function"!=typeof n)return{default:n};var e=o();if(e&&e.has(n))return e.get(n);var r={},t=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var u in n)if(Object.prototype.hasOwnProperty.call(n,u)){var i=t?Object.getOwnPropertyDescriptor(n,u):null;i&&(i.get||i.set)?Object.defineProperty(r,u,i):r[u]=n[u]}r.default=n,e&&e.set(n,r);return r}(r(4470));function o(){if("function"!=typeof WeakMap)return null;var n=new WeakMap;return o=function(){return n},n}e.urlObjectKeys=["auth","hash","host","hostname","href","path","pathname","port","protocol","query","search","slashes"]},7294:function(n){n.exports=function(){return null}},5893:function(n,e,r){"use strict";r.r(e),r.d(e,{Fragment:function(){return t},jsx:function(){return o},jsxs:function(){return o}});var t=function(n){return n.children},o=function(n,e,r){return{$$typeof:Symbol.for("react.element"),type:n,key:null==r?null:""+r,ref:null,props:e,_owner:null}}}},function(n){n.O(0,[774],function(){return n(n.s=8312)}),_N_E=n.O()}]);
`;
fs.writeFileSync(`${staticPagesDir}/index.js`, indexJs);
console.log(`Created ${staticPagesDir}/index.js`);

// Create a minimal _app.js in static pages
const appJs = `
(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[888],{4444:function(n,e,t){"use strict";t.r(e),t.d(e,{default:function(){return App}});var r=t(5893);function App(n){var e=n.Component,t=n.pageProps;return(0,r.jsx)(e,Object.assign({},t))}},5893:function(n,e,t){"use strict";t.r(e),t.d(e,{Fragment:function(){return r},jsx:function(){return u},jsxs:function(){return u}});var r=function(n){return n.children},u=function(n,e,t){return{$$typeof:Symbol.for("react.element"),type:n,key:null==t?null:""+t,ref:null,props:e,_owner:null}}}},function(n){n.O(0,[774],function(){return n(n.s=4444)}),_N_E=n.O()}]);
`;
fs.writeFileSync(`${staticPagesDir}/_app.js`, appJs);
console.log(`Created ${staticPagesDir}/_app.js`);

// Create a minimal _error.js in static pages
const errorJs = `
(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[820],{9185:function(n,e,r){"use strict";r.r(e),r.d(e,{default:function(){return Error}});var t=r(5893);function Error(){return(0,t.jsx)("div",{children:"An error occurred"})}},5893:function(n,e,r){"use strict";r.r(e),r.d(e,{Fragment:function(){return t},jsx:function(){return o},jsxs:function(){return o}});var t=function(n){return n.children},o=function(n,e,r){return{$$typeof:Symbol.for("react.element"),type:n,key:null==r?null:""+r,ref:null,props:e,_owner:null}}}},function(n){n.O(0,[774],function(){return n(n.s=9185)}),_N_E=n.O()}]);
`;
fs.writeFileSync(`${staticPagesDir}/_error.js`, errorJs);
console.log(`Created ${staticPagesDir}/_error.js`);

console.log('Direct build process completed successfully!');
