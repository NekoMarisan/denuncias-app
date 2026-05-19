module.exports = {
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      // eslint-disable-next-line global-require
      const evalSourceMapMiddleware = require('react-dev-utils/evalSourceMapMiddleware');
      // eslint-disable-next-line global-require
      const redirectServedPath = require('react-dev-utils/redirectServedPathMiddleware');
      // eslint-disable-next-line global-require
      const noopServiceWorkerMiddleware = require('react-dev-utils/noopServiceWorkerMiddleware');
      // eslint-disable-next-line global-require
      const paths = require('react-scripts/config/paths');

      middlewares.push(
        evalSourceMapMiddleware(devServer),
        redirectServedPath(paths.publicUrlOrPath),
        noopServiceWorkerMiddleware(paths.publicUrlOrPath),
      );

      return middlewares;
    },
  },
};
