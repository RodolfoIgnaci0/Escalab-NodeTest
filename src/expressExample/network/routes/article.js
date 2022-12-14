const { Router } = require('express')

const { ArticleService, UserService } = require('../../services')

const { mongo: { queries } } = require('../../database')
const { article: { getArticles } } = queries

const { auth, validatorCompiler } = require('./utils')

const ArticleRouter = Router()
const response = require('./response')


// todos los articulos guardados
ArticleRouter.route('/article')
    .get(
      auth.verifyUser(),
      async (req,res) => {
      
      try {
        const articles = await getArticles()
        response({ error: false, message: articles, res, status: 200 })
      } catch (error) {
        console.error(error)
        response({ message: 'Internal server error', res })
      }
    })

// un articulo especifico
ArticleRouter.route('/article/:id')
    .get(
      auth.verifyUser(), 
      async (req,res) => {
      const { params: { id } } = req

      try {  
        const articleService = new ArticleService({ id })
        const article = await articleService.getArticle()

        response({ error: false, message: article, res, status: 200 })
      } catch (error) {
        console.error(error)
        response({ message: 'Internal server error', res })
      }
    })
    .post(
      auth.verifyUser(), 
      async (req, res) => {
        const { 
          body: { name, price },
          params: { id: userId } 
        } = req

        const newArticle = new ArticleService({ name, price, userId })
        
        try {
          const result = await newArticle.saveArticle()
          response({
            error: false,
            message: result,
            res,
            status: 201
          })
        } catch (error) {
          console.error(error)
        }
      })
      .delete(
        auth.verifyUser(), 
        async (req,res) => {
        const {params: {id} } = req

        try {
          const articleService = new ArticleService({ id })
          const article = await articleService.deleteArticle()
          response({ error: false, message: article, res, status: 200 })
        } catch (error) {
          console.log(error)
        }
      })
      .patch(
        auth.verifyUser(), 
        async (req,res) => {
        const {
          body: { name, price },
          params: { id }
        } = req

        const updateArticle = new ArticleService({ id, name, price })

        try {
          const article = await updateArticle.updateArticle(name, price)
          response({ error: false, message: article, res, status: 200 })
        } catch (error) {
          console.error(error)
        }
      })

      // purchase an article
      ArticleRouter.route('/article/:id/user/:userId')
      .patch(
        auth.verifyUser(), 
        async (req,res, next) =>  {
        try {
          const {
            params: { id, userId}
          } = req
          
          const articleService = await new ArticleService({ id })
          const userService = await new UserService({ userId })

          const { user, purchaseArticle } = await userService.checkPurchaserBalanceArticle(articleService)

          const users = await userService.changeMoney(user, purchaseArticle)
          const article = await articleService.updateArticleOwner(purchaseArticle, user)

          response({ error: false, message: { users, article }, res, status: 200})
        } catch(error){
          console.log(error)
          next(error)
        }
      })


module.exports = ArticleRouter