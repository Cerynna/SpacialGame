module.exports = function (app, games) {

  const fs = require("fs");


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
  app.get('/game-*', (req, res) => {
    let locals = {
      title: 'Page Title',
      description: 'Page Description',
      header: 'Page Header'
    };
    res.render('game');

  });

  // app.get('/test-*', (req, res) => {
  //   res.set('Content-Type', 'image/jpeg');

  //   var img = fs.readFileSync('public/img/attack.png');
  //   res.writeHead(200, {
  //     'Content-Type': 'image/png'
  //   });
  //   res.end(img, 'binary');


  // });


  app.get('/test', (req, res)=>{
    res.render('test');
  })

};