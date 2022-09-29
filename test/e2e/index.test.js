const axios = require('axios')
const { faker } = require('@faker-js/faker')
const { server } = require('../../src/expressExample/network')

const URL = `http://localhost:${process.env.PORT || 2000}`

beforeAll(async () => {
  await server.start()
})

afterAll(async () => {
  await server.stop()
})

describe('API: GET /', () => {
  let response = {}

  test('Should return 200 as status code', async () => {
    response = await axios.get(URL)
    expect(response.status).toBe(200)
  })

  test('Should be a successful operation', () => {
    expect(response.data.error).toBe(false)
  })
})

describe('E2E test: Use cases from UserService', () => {
  const name = faker.name.firstName()
  const lastName = faker.name.lastName()
  const newUserBuyer = {
    name,
    lastName,
    email: faker.internet.email(name, lastName).toLowerCase(),
    password: faker.datatype.string(),
    type:'comprador'
  }
  const newUserSeller = {
    name,
    lastName,
    email: faker.internet.email(name, lastName).toLowerCase(),
    password: faker.datatype.string(),
    type:'vendedor'
  }

  const tokens = {
    accessToken: '',
    refreshToken: ''
  }

  let idBuyer = ''
  let _idBuyer = ''
  const newBalance = 5000

  let idSeller = ''
  let _idSeller = ''

  let idProduct = ''
  

  describe('Testing save buyer user', () => {
    let response = {}

    test('Should return 201 as status code and asign user id', async () => {
      response = await axios.post(`${URL}/api/user/signup`, newUserBuyer)
      expect(response.status).toBe(201)
      idBuyer = response.data.message.id
      _idBuyer = response.data.message._id
    })
  })

  describe('Testing login a user', () => {
    const keys = ['accessToken', 'refreshToken']

    test('Should return accessToken and refreshToken', async () => {
      const {
        data: { message }
      } = await axios.post(`${URL}/api/user/login`, {
        email: newUserBuyer.email,
        password: newUserBuyer.password
      })

      expect(Object.keys(message)).toEqual(keys)
      tokens.accessToken = message.accessToken
      tokens.refreshToken = message.refreshToken
    })
  })

  describe('Testing get all users', () => {
    test('Should return an array of users', async () => {
      const {
        data: { message: allUsers }
      } = await axios.get(`${URL}/api/user`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`
        }
      })

      expect(allUsers.some(u => u.email === newUserBuyer.email)).toBe(true)

    })
  })

  describe('Testing save seller user', () => {
    let response = {}

    test('Should return 201 as status code and asign user id', async () => {
      response = await axios.post(`${URL}/api/user/signup`, newUserSeller)
      expect(response.status).toBe(201)
      idSeller = response.data.message.id
      _idSeller = response.data.message._id
    })
  })

  describe('Testing login a seller user', () => {
    const keys = ['accessToken', 'refreshToken']

    test('Should return accessToken and refreshToken', async () => {
      const {
        data: { message }
      } = await axios.post(`${URL}/api/user/login`, {
        email: newUserSeller.email,
        password: newUserSeller.password
      })

      expect(Object.keys(message)).toEqual(keys)
      tokens.accessToken = message.accessToken
      tokens.refreshToken = message.refreshToken
    })
  })

  describe('Testing post a new article as seller', () => {
    response: {}
    test('Should return 201 status code', async () => {
      response = await axios.post(`${URL}/api/article/${idSeller}`, {
        name: 'articulo',
        price: 300
      })

      expect(response.status).toBe(201)
      idProduct = response.data.message.id
    })
  })
/*
  describe('Testing buy a product without credit', () => {
    test('Should throw error with message not enough money', async () => {
      try {
        response = await axios.patch(`${URL}/api/article/${idProduct}/user/${idBuyer}`)
      } catch (error) {
        expect(error).toBeInstanceOf(httpErrors)      
      }
    })
  })
*/
  describe('Testing get credit', () => {
    test('Should return user with credit', async () =>{
      const {
        data: { message }
      } = await axios.patch(`${URL}/api/user/${idBuyer}/recharge`,{
        balance: newBalance
      })

      expect(message.balance).toBe(newBalance)
    })
  })

  describe('Testing buy a product with credit', () => {
    response: {}
    test('Should return 200 status code', async () => {
      response = await axios.patch(`${URL}/api/article/${idProduct}/user/${idBuyer}`)
      
      expect(response.status).toBe(200)
    })

    test('El saldo pasa de la cuenta del cliente a la cuenta del vendedor', () => {
      const vendorAccount = response.data.message.users.updatedSeller.balance
      expect(vendorAccount).toBe(300)
    })
    test('El saldo resta de la cuenta del comprador', () => {
      const buyerAccount = response.data.message.users.updatedBuyer.balance
      expect(buyerAccount).toBe(4700)
    })
    test('El artículo pasa de la cuenta del vendedor a la cuenta del cliente', () => {
      const owner = response.data.message.article.userId
      expect(owner).toBe(_idBuyer)
    })
  })

})

/**
 * E commerce
 * ------
 * 1. Registrar (sign up) un usuario como cliente✅
 *  1.1. Login del cliente✅
 * 2. Recargar saldo del cliente✅
 * 3. Registrar un usuario como vendedor✅
 *  3.1. Login del vendedor✅
 * 4. Registrar un artículo (precio) del vendedor✅
 * 5. El cliente intenta comprar el artículo
 *  5.1. El saldo del cliente del insuficiente -> Recarga más saldo
 *  5.2. El saldo es suficiente -> Se genera la compra ✅
 * 6. El saldo pasa de la cuenta del cliente a la cuenta del vendedor ✅
 * 7. El artículo pasa de la cuenta del vendedor a la cuenta del cliente
 *
 * Nota: las únicas rutas públicas son las rutas de registro
 */
