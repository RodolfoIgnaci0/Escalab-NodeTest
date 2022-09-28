const { nanoid } = require('nanoid')
const { mongo: { queries } } = require('../database')
const UserService = require('./user')

const { 
  article: { 
    saveArticle, 
    getOneArticle, 
    deleteOneArticle, 
    updateAnArticle,
    updateAnArticleOwner }
  } = queries
  

class ArticleService {
  #id
  #name
  #price
  #userId

  /**
   * @param {Object} args
   * @param {String|undefined} args.id
   * @param {Number|undefined} args.price
   * @param {String|undefined} args.userId
   */
  constructor(args) {
    const { id = '', name = '',price = '', userId = ''} = args

    this.#id = id
    this.#name = name
    this.#price = price
    this.#userId = userId
  }

  async saveArticle() {
    if (!this.#userId)
      throw new Error('Missing required field: userId')

    console.log(`article.services: ${this.#userId}`)
    //const userservice2 = new UserService();
    const userService = new UserService({userId: this.#userId})
    const foundUser = await userService.verifyUserExists()


    const newArticle = await saveArticle({
      id: nanoid(6),
      name: this.#name,
      price: this.#price,
      userId: foundUser._id // Mongo user id
    })

    return newArticle.toObject()
  }

  async getArticle() {
    if (!this.#id)
      throw new Error('Missing required field: id')

    const foundArticle = await getOneArticle(this.#id)

    if (!foundArticle)
      throw new Error('Articles not found')

    return foundArticle
  }

  async deleteArticle() {
    if (!this.#id)
      throw new Error('Missing required field: id')

    const deletedArticle = await deleteOneArticle(this.#id)

    if (!deletedArticle)
      throw new Error('Articles not found')

    return deletedArticle
  }

  async updateArticle(name, price){
    const updatedArticle = await updateAnArticle(this.#id, { name, price })

    if (!updatedArticle)
      throw new Error('Article not found')

    return updatedArticle
  }

  async updateArticleOwner(purchaseArticle, user){
    const updatedArticle = await updateAnArticleOwner(purchaseArticle[0].id,  user )

    if (!updatedArticle)
      throw new Error('Article not found')

    return updatedArticle
  }
}

module.exports = ArticleService
