var express       = require('express');
var passport      = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var router = express.Router();

var client = require('redis').createClient();

router.post('/autenticar', passport.authenticate('local'), function(req, res){

  return res.json('');

});

router.post('/', function(req, res) {
  var usuario = {
    nome: req.body.nome,
    senha: req.body.senha
  };

  client.hmset("usuario:" + req.body.id, 
    'nome', usuario.nome, 
    'senha', usuario.senha,
    function(err, result) {
      if (err)
        return res.send(err);

      return res.json(usuario);
    });
});

router.get('/', function(req, res){
  var usuarios = [];
  client.keys("usuario:*", function(err, keys) {
    if (err)
      return res.send(err);

    if (keys.length) {
      keys.forEach(function(key, index) {
        client.hgetall(key, function(err, obj) {
          if (err)
            return res.send(err);

          if (obj != null) {
            var usuario = {
              id: key.split(':')[1],
              nome: obj.nome,
              senha: obj.senha
            };

            usuarios.push(usuario);
          }

          if (index == keys.length-1) return res.json(usuarios);
        });
      });
    }
    else
      return res.json(usuarios);
  });
});

module.exports = router;