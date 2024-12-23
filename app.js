//carregando modulos
    const express = require('express')
    const handlebars = require('express-handlebars')
    const bodyParser = require('body-parser')
    const app = express()
    const admin = require('./routes/admin')
    const path = require ('path')
    const { default: mongoose } = require('mongoose')
    const session = require('express-session');
    const flash = require('connect-flash');
    require("./models/Postagem")
    const Postagem = mongoose.model("postagens")
    require("./models/Categoria")
    const Categoria = mongoose.model("categorias")
    const usuarios = require('./routes/usuario')
    const passport = require('passport')
    require("./config/auth")(passport)
    const swaggerUI= require("swagger-ui-express")
    const swaggerJsDocs = require("swagger-jsdoc")

    
//condiguraçãoes
    // Sessão
        app.use(session({
            secret: 'secrete-key',
            resave: true,
            saveUninitialized: true
        }))
        app.use(passport.initialize())
        app.use(passport.session())

        app.use(flash())
    //Middwlare
        app.use((req, res, next) =>{
            res.locals.success_msg = req.flash("success_msg")
            res.locals.error_msg = req.flash("error_msg")
            res.locals.error = req.flash("error")
            res.locals.user = req.user || null;
            next()
        })
    //Body Parser
        app.use(bodyParser.urlencoded({ extended : true }))
        app.use(bodyParser.json())
    //Handlebars
        app.engine('handlebars',handlebars.engine({ defaultLayout : 'main', runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    } }))
    
        app.set('view engine', 'handlebars');
    //Mongoose MongoDB 
        mongoose.Promise = global.Promise;
        mongoose.connect('mongodb://localhost:27017/blogapp').then(()=>{
            console.log("Conectador com sucesso")
        }).catch((err)=>{
            console.log("falha ao se conectar "+err)
        })
    //Swagger
        var swaggerDefinition = {
            info: {
                title: "Aprendendo node",
                version: "1.0",
                description: "Aplicação simples, desenvolvido em Node.js + Express.js + MongoDB.",

            },
            components: {
                schemas: require("./schemas.json")
            }
        }
        var options = {
            swaggerDefinition : swaggerDefinition,
            apis: ['./routes/*.js']
        }
        var swaggerSpec = swaggerJsDocs(options)

    //Public
        app.use(express.static(path.join(__dirname,"public")))
//Rotas
    app.get("",(req,res) =>{
        Postagem.find().populate("categoria").sort({data:"desc"}).then((postagens)=>{
            res.render("index", {postagens: postagens})
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro intero")
            res.redirect("/404")
        })
        
    })

    app.get("/postagem/:slug",(req,res) => {
        Postagem.findOne({slug: req.params.slug}).then((postagem)=>{
            if(postagem){
                res.render("postagem/index",{postagem:postagem})
            }else{
                req.flash("error_msg", "Esta postagem não existe")
                res.redirect("/")
            }
        }).catch((err)=>{
            req.flash("error_msg", "houve um erro intero")
            res.redirect("/")
        })
    })

    app.get("/categorias", (req,res) =>{
        Categoria.find().then((categorias) => {
            res.render("categorias/index",{categorias: categorias})
        }).catch((err)=>{
            req.flash("error_msg", "houve um erro ao carregar as categorias")
            res.redirect("/")
        })
    })
    
    app.get("/categorias/:slug", (req, res) => {
        Categoria.findOne({slug: req.params.slug}).then((categoria) => {
            if(categoria){
                Postagem.find({categoria: categoria.id}).then((postagens)=>{
                    res.render("categorias/postagens", {postagens: postagens, categoria: categoria})
                }).catch((err)=>{
                    req.flash("error_msg", "Houve um erro ao listar os posts")
                    res.redirect("/")
                })
            }else{
                req.flash("error_msg", "Esta categoria não exite")
                res.redirect("/")
            }
        }).catch((err) =>{
            req.flash("error_msg", "houve um interno ao carregar ao carregar a pagina da categoria")
            res.redirect("/")
        })
        
    })
    app.get("/404", (req, res) => {
        res.send("Erro 404")
    })
    
    app.use('/docs',swaggerUI.serve, swaggerUI.setup(swaggerSpec) )
    app.use('/admin', admin)
    app.use('/usuarios', usuarios)
//Outros
const PORT = 8081
app.listen(PORT, ()=>{
    console.log("Servidor rodando")
})