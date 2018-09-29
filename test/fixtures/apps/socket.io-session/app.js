module.exports = app => {
    app.messenger.on('egg-ready', info => {
      console.error('info.portinfo.portinfo.port:', info.port);
    });
  };