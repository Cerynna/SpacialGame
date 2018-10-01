module.exports = function (app, games) {
  /* !!!! ROUTE PUBLIC !!!! */
  app.get('/', (req, res) => {
    let locals = {
      title: 'Page Title',
      description: 'Page Description',
      header: 'Page Header'
    };
    res.render('index', {
      games: games
    });

  });
  app.get('/game', (req, res) => {
    let locals = {
      title: 'Page Title',
      description: 'Page Description',
      header: 'Page Header'
    };
    res.render('game');

  });
};