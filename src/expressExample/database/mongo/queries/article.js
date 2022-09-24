const { ArticleModel } = require('../models')

/**
 * @param {Object} article
 * @param {String} article.id
 * @param {String} article.name
 * @param {Integer} article.price
 * @returns saved article
 */ 
 const saveArticle = async article => {
  const savedArticle = new ArticleModel(article)
  await savedArticle.save()
  return savedArticle
}

/**
 * @param {String} id
 * @returns found url
 */
const getOneArticle = async id => {
  const articles = await ArticleModel.find({ id }).populate('userId')

  return articles
}

const getArticles = async () => {
  const articles = await ArticleModel.find()
  return articles
}

const deleteOneArticle = async id => {
  const deletedArticle = await ArticleModel.findOneAndRemove({ id }).populate('userId')
  return deletedArticle
}

const updateAnArticle = async (id, article) => {
  const { name, price } = article
  const articleUpdated = await ArticleModel.findOneAndUpdate(
    { id },
    { name, price },
    { new: true }
  )

  return articleUpdated
}

const updateAnArticleOwner = async (id, article) => {
  const { _id: userId } = article

  console.log(`queries - userId: ${article}`)
  const articleUpdated = await ArticleModel.findOneAndUpdate(
    { id },
    { userId },
    { new: true }
  )

  return articleUpdated
}

module.exports = {
  saveArticle,
  getArticles,
  getOneArticle,
  deleteOneArticle,
  updateAnArticle,
  updateAnArticleOwner
}
