var express           = require('express');
var bodyParser        = require('body-parser');
var redis             = require('redis');
var passport          = require('passport');
var LocalStrategy     = require('passport-local').Strategy;
var session           = require('express-session');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var app = express();

// Conexão com o DB
var client = redis.createClient();

client.on('connect', function() {
    console.log('connected');
});

// Setando o body parser
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());

// Autenticacao
passport.use(new LocalStrategy(
  function(username, password, done) {
    // Com redis: Criar chaves para nome e senha e buscar pelas chaves

    /* Com moongose: 
    Usuario.findOne({ nome: username, senha: password }, function (err, usuario) {
      if (err)
        return done(err);

      if (!usuario) {
        return done(null, false, { message: 'Usuário ou senha inválidos.' });
      }

      return done(null, usuario);
    });*/
  }
));

passport.use(new GoogleStrategy({
    clientID: '407642825806-0ljb7eb5qlfimaaqmm1q7u415lcvqbeq.apps.googleusercontent.com',
    clientSecret: 'Ql0W6djg6bL5Wx4R_u120So2',
    callbackURL: "http://localhost:3535/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    
    client.smembers("nome:jessica", function (err, ids) {
      if (err)
        return done(err);
      
      if (!ids.length)
        return done(null, false, { message: 'Usuário ou senha inválidos.' });

      ids.forEach(function(id, index) {
        client.hgetall("usuario:" + id, function (err, obj) { 
          if (err)
            return done(err);

          var usuario = {
            id: id, 
            nome: obj.nome
          }
          
          return done(null, usuario);
        });
      });
    });    
  }
));

app.get('/auth/google',
  passport.authenticate('google', { scope: 'https://www.googleapis.com/auth/plus.login' }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

passport.serializeUser(function(usuario, done) {
  done(null, usuario.id);
});

passport.deserializeUser(function(id, done) {
  client.hgetall("usuario:" + id, function (err, obj) { 
    if (err)
      return done(err);

    var usuario = {
      id: id, 
      nome: obj.nome
    }

    return done(null, usuario);
  });
});

var api = {};

api.filmes = require('./api/filmes');
api.usuarios = require('./api/usuarios');

app.use('/api/filmes', api.filmes);
app.use('/api/usuarios', api.usuarios);

// Configurações do servidor
var port = process.env.PORT || 3535;
app.listen(port);
console.log('Rodando na porta ' + port);