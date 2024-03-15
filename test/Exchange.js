const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Exchange', () => {
  let deployer, exchange, feeAccount, user1

  const feePercent = 10

  beforeEach(async () => {
    const Exchange = await ethers.getContractFactory('Exchange')
    const Token = await ethers.getContractFactory('Token')

    token1 = await Token.deploy('Streamcoin', 'SC', '1000000')
    token2 = await Token.deploy('Mock Eth', 'MEth', '1000000')

    accounts = await ethers.getSigners()
    deployer = accounts[0]
    feeAccount = accounts[1]
    user1 = accounts[2]
    user2 = accounts[3]

    let transaction = await token1.connect(deployer).transfer(user1.address, tokens(100000))
    await transaction.wait()
    transaction = await token2.connect(deployer).transfer(user2.address, tokens(100000))
    await transaction.wait()

    exchange = await Exchange.deploy(feeAccount.address, feePercent)
  })

  describe('Depositing', () => {
    let transaction, result
    let amount = tokens(10)

    describe('Success', () => {
      beforeEach(async () => {
        transaction = await token1.connect(user1).approve(exchange.address, amount)
        result = await transaction.wait()

        transaction = await exchange.connect(user1).depositToken(token1.address, amount)
        result = await transaction.wait()
      })
    
      it('Updates user balance', async () => {
        expect(await token1.balanceOf(exchange.address)).to.equal(amount)
        expect(await exchange.tokens(token1.address, user1.address)).to.equal(amount)
      })
    
    })
  })

  describe('Withdrawing', () => {
    let transaction, result
    let amount = tokens(10)

    describe('Success', () => {
      beforeEach(async () => {
        transaction = await token1.connect(user1).approve(exchange.address, amount)
        result = await transaction.wait()

        transaction = await exchange.connect(user1).depositToken(token1.address, amount)
        result = await transaction.wait()

        transaction = await exchange.connect(user1).withdrawToken(token1.address, amount)
        result = await transaction.wait()
      })
    
      it('Updates user balance', async () => {
        expect(await token1.balanceOf(exchange.address)).to.equal(0)
        expect(await exchange.tokens(token1.address, user1.address)).to.equal(0)
      })
    
    })
  })

  describe('Making Orders', async () => {
    let transaction, result
    
    const amount1 = tokens(10)
    const amount2 = tokens(20)
    const amount3 = tokens(30)

    const id = '1'

    describe('Success', () => {
      beforeEach(async () => {
        transaction = await token1.connect(user1).approve(exchange.address, amount3)
        result = await transaction.wait()

        transaction = await token2.connect(user2).approve(exchange.address, amount3)
        result = await transaction.wait()

        transaction = await exchange.connect(user1).depositToken(token1.address, amount3)
        result = await transaction.wait()

        transaction = await exchange.connect(user2).depositToken(token2.address, amount3)
        result = await transaction.wait()

        transaction = await exchange.connect(user1).makeOrder(token2.address, token1.address, amount2, amount1)
        result = await transaction.wait()

        balanceBefore1 = await exchange.balanceOf(token1.address, user1.address)
        balanceBefore2 = await exchange.balanceOf(token2.address, user2.address)
      })

      it('Updates Orders Mapping', async () => {
        expect(await exchange.orders(id)).to.have.property('id')
      })

      it('Cancels Order', async () => {
        transaction = await exchange.connect(user1).cancelOrder(id)
        result = await transaction.wait()
        
        expect(await exchange.orderCanceled(id)).to.equal(true)
      })

      it('Fills Order', async () => {
        transaction = await exchange.connect(user2).fillOrder(id)
        result = await transaction.wait()
        
        expect(await exchange.orderFilled(id)).to.equal(true)
        expect(await exchange.balanceOf(token2.address, user1.address)).to.equal(tokens(20))
        expect(await exchange.balanceOf(token2.address, user2.address)).to.equal(tokens(8))
      })

    })
  })

})