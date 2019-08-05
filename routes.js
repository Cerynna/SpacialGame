module.exports = function (app, games) {

  const fs = require("fs");


  /* !!!! ROUTE PUBLIC !!!! */
  app.get('/', (req, res) => {

    res.render('index', {
      games: games
    });

  });
  app.get('/game', (req, res) => {

    res.render('newGame');

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