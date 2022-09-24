const httpErrors = require('http-errors')
const { nanoid } = require('nanoid')

const RoleService = require('./role')
const ArticleService = require('./article')

const {
  mongo: { queries }
} = require('../database')
const {
  hash: { hashString }
} = require('../utils')
const {
  user: {
    getUserByID,
    saveUser,
    getAllUsers,
    removeUserByID,
    updateOneUser,
    getOneUser,
    updateOneUserBalance
  }
} = queries

class UserService {
  #userId
  #name
  #lastName
  #email
  #password
  #role
  #type
  #balance

  /**
   * @param {Object} args
   * @param {String} args.userId
   * @param {String} args.name
   * @param {String} args.lastName
   * @param {String} args.email
   * @param {String} args.password
   * @param {String} args.role
   * @param {Integer} args.balance
   */
  constructor(args = {}) {
    const {
      userId = '',
      name = '',
      lastName = '',
      email = '',
      password = '',
      role = '2',
      type = 'comprador',
      balance = 0
    } = args

    this.#userId = userId
    this.#name = name
    this.#lastName = lastName
    this.#email = email
    this.#password = password
    this.#role = role
    this.#type = type
    this.#balance = balance
  }

  async verifyUserExists() {
    console.log(`user.services: ${this.#userId}`)
    if (!this.#userId)
      throw new httpErrors.BadRequest('Missing required field: userId')

    const user = await getUserByID(this.#userId)

    if (!user) throw new httpErrors.NotFound('User not found')

    return user

  }

  async saveUser() {
    if (!this.#name)
      throw new httpErrors.BadRequest('Missing required field: name')

    if (!this.#lastName)
      throw new httpErrors.BadRequest('Missing required field: lastName')

    if (!this.#email)
      throw new httpErrors.BadRequest('Missing required field: email')

    if (!this.#password)
      throw new httpErrors.BadRequest('Missing required field: password')

    if (!this.#role)
      throw new httpErrors.BadRequest('Missing required field: role')

    const { salt, result: hash } = hashString(this.#password)
    const role = await new RoleService({ id: this.#role }).getRoleByID()

    await saveUser({
      id: nanoid(),
      name: this.#name,
      lastName: this.#lastName,
      email: this.#email,
      salt,
      hash,
      role: role._id,
      type: this.#type,
      balance: this.#balance
    })

    return await getAllUsers()
  }

  async getUserByID() {
    if (!this.#userId)
      throw new httpErrors.BadRequest('Missing required field: userId')

    const user = await getUserByID(this.#userId)

    if (!user)
      throw new httpErrors.NotFound('The requested user does not exists')

    return user
  }

  async getAllUsers() {
    return await getAllUsers()
  }

  async removeUserByID() {
    if (!this.#userId)
      throw new httpErrors.BadRequest('Missing required field: userId')

    const user = await removeUserByID(this.#userId)

    if (!user)
      throw new httpErrors.NotFound('The requested user does not exists')

    return user
  }

  async updateOneUser() {
    if (!this.#userId)
      throw new httpErrors.BadRequest('Missing required field: userId')

    const updatePassword = !!this.#password
    const aux = {}

    if (updatePassword) {
      const { salt, result: hash } = hashString(this.#password)

      aux.salt = salt
      aux.hash = hash
    }

    return await updateOneUser({
      id: this.#userId,
      name: this.#name,
      lastName: this.#lastName,
      email: this.#email,
      ...aux
    })
  }

  async updateOneUserBalance() {
    
    const user = await getUserByID(this.#userId)
    //console.log(`usuario userService ${user}`)
    this.#balance += parseInt(user.balance)
      
    const updatedUser = await updateOneUserBalance({id: this.#userId, balance: this.#balance })
    return updatedUser
  }


  async login() {
    if (!this.#email)
      throw new httpErrors.BadRequest('Missing required field: email')

    if (!this.#password)
      throw new httpErrors.BadRequest('Missing required field: password')

    const user = await getOneUser({ email: this.#email })

    if (!user) throw new httpErrors.BadRequest('Bad credentials')

    const { salt, hash } = user
    const { result } = hashString(this.#password, salt)

    if (hash !== result) throw new httpErrors.BadRequest('Bad credentials')

    return user
  }

  async checkPurchaserBalanceArticle (article) {

    const user = await getUserByID(this.#userId)
    const purchaseArticle = await article.getArticle()

    try {
      if(purchaseArticle[0].userId.type == 'comprador') 
       throw new httpErrors.Unauthorized('Article already buyed') 

      if(purchaseArticle[0].price > user.balance) 
      throw new httpErrors.Unauthorized('You have not enough money to buy') 

      
    return { user, purchaseArticle }
    
    } catch (error) {
      console.log(error)  
    }  
  }

  async changeMoney (user, article){
    //restas de comprador
    const price = article[0].price
    const newBalanceBuyer = user.balance - price
    const updatedBuyer = await updateOneUserBalance({id: user.id, balance: newBalanceBuyer })

    //sumas del vendedor

    const seller = article[0].userId.id
    const newBalanceSeller = article[0].userId.balance + price
    const updatedSeller = await updateOneUserBalance({id: seller, balance: newBalanceSeller })
    
    return { updatedBuyer, updatedSeller}
  }
}

module.exports = UserService
