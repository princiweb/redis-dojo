var express       = require('express');
var passport      = require('passport');

var router = express.Router();

var client = require('redis').createClient();

function auth(req, res, next) {
  if (!req.isAuthenticated()) {
    res.sendStatus(401);
  } else {
    next();
  }
}

router.get('/', auth, function(req, res){
  var filmes = [];
  client.keys("filme:*", function(err, keys) {
    if (err)
      return res.send(err);

    if (keys.length) {
      keys.forEach(function(key, index) {
        client.hgetall(key, function (err, obj) {
          if (err)
            return res.send(err);

          if (obj != null) {
            var filme = {
              id: key.split(':')[1],
              titulo: obj.titulo,
              tituloOriginal: obj.tituloOriginal,
              ano: obj.ano
            }

            filmes.push(filme);
          }

          if (index == keys.length-1) return res.json(filmes);
        });  
      });
    }
    else
      return res.json(filmes);
  });
});

router.get('/:id', function(req, res){
  client.hgetall("filme:" + req.params.id, function (err, obj) {
    if (err)
      return res.send(err);

    if (obj == null)
      return res.status(404).send("");

    var filme = {
      id: req.params.id,
      titulo: obj.titulo,
      tituloOriginal: obj.tituloOriginal,
      ano: obj.ano
    }

    return res.json(filme);
  });  
});

router.post('/', function(req, res){
  var filme = {
    titulo: req.body.titulo,
    tituloOriginal: req.body.tituloOriginal,
    ano: req.body.ano
  };

  client.hmset("filme:" + req.body.id, 
    'titulo', filme.titulo, 
    'tituloOriginal', filme.tituloOriginal,
    'ano', filme.ano,
    function(err, result) {
      if (err)
        return res.send(err);

      return res.json(filme);
    });

});

router.put('/:id', function(req, res){
  var filme = {
    titulo: req.body.titulo,
    tituloOriginal: req.body.tituloOriginal,
    ano: req.body.ano
  };

  client.hmset("filme:" + req.body.id, 
    'titulo', filme.titulo, 
    'tituloOriginal', filme.tituloOriginal,
    'ano', filme.ano,
    function(err, result) {
      if (err)
        return res.send(err);

      return res.json(filme);
    });
});

router.delete('/:id', function(req, res) {
  client.del("filme:" + req.params.id, function(err, numRemoved) {
    if (err) 
      return res.send(err);

    return res.json(numRemoved);
  });
});

module.exports = router;