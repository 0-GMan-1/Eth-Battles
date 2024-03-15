const config = require('../src/config.json')

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

async function main() {
	const accounts = await ethers.getSigners()

	const {chainId} = await ethers.provider.getNetwork()

	const dogeCoin = await ethers.getContractAt('Token', config[chainId].dogeCoin.address)
	console.log(`Successfully fetched DogeCoin Contract At ${dogeCoin.address}`)

	const mEth = await ethers.getContractAt('Token', config[chainId].mEth.address)
	console.log(`Successfully fetched mEth Contract At ${mEth.address}`)

	const mDai = await ethers.getContractAt('Token', config[chainId].mDai.address)
	console.log(`Successfully fetched mDai Contract At ${mDai.address}`)

	const USDT = await ethers.getContractAt('Token', config[chainId].USDT.address)
	console.log(`Successfully fetched USDT Contract At ${USDT.address}`)

	const exchange = await ethers.getContractAt('Exchange', config[chainId].exchange.address)
	console.log(`Successfully fetched Exchange Contract At ${exchange.address}\n`)

	const sender = accounts[0]
	const receiver = accounts[1]
	const escrow = accounts[2]

	let amount = tokens(10000)
	let transaction, result

	transaction = await mEth.connect(sender).transfer(receiver.address, amount)
	await transaction.wait()
	console.log(`Transferred ${amount} mETH Tokens to ${receiver.address}\n`)

	const user1 = accounts[0]
	const user2 = accounts[1]

	transaction = await dogeCoin.connect(user1).approve(exchange.address, amount)
	await transaction.wait()
	console.log(`Successfully Approved Exchange for Transfer of ${amount} dogeCoin`)

	transaction = await exchange.connect(user1).depositToken(dogeCoin.address, amount)
	await transaction.wait()
	console.log(`User Successfully Deposited ${amount} dogeCoin`)

	transaction = await mEth.connect(user2).approve(exchange.address, amount)
	await transaction.wait()
	console.log(`Successfully Approved Exchange for Transfer of ${amount} mETH`)

	transaction = await exchange.connect(user2).depositToken(mEth.address, amount)
	await transaction.wait()
	console.log(`User Successfully Deposited ${amount} mETH`)
  
	let orderId
	transaction = await exchange.connect(user1).makeOrder(mEth.address, dogeCoin.address, tokens(100), tokens(5))
	result = await transaction.wait()
	console.log(`Made order`)
  console.log('here')
	orderId = result.events[0].args.id
	transaction = await exchange.connect(user1).cancelOrder(orderId)
	result = await transaction.wait()
	console.log('canceled order')

	transaction = await exchange.connect(user1).makeOrder(mEth.address, dogeCoin.address, tokens(100), tokens(10))
	result = await transaction.wait()
	console.log(`Made order`)

	orderId = result.events[0].args.id
	transaction = await exchange.connect(user2).fillOrder(orderId)
	result = await transaction.wait()
	console.log('filled order')

	transaction = await exchange.connect(user1).makeOrder(mEth.address, dogeCoin.address, tokens(50), tokens(15))
	result = await transaction.wait()
	console.log(`Made order`)

	orderId = result.events[0].args.id
	transaction = await exchange.connect(user2).fillOrder(orderId)
	result = await transaction.wait()
	console.log('filled order')

	transaction = await exchange.connect(user1).makeOrder(mEth.address, dogeCoin.address, tokens(200), tokens(20))
	result = await transaction.wait()
	console.log(`Made order`)

	orderId = result.events[0].args.id
	transaction = await exchange.connect(user2).fillOrder(orderId)
	result = await transaction.wait()
	console.log('filled order')

	for(let i = 1; i <= 10; i++) {
		transaction = await exchange.connect(user1).makeOrder(mEth.address, dogeCoin.address, tokens(10 * i), tokens(10))
		result = await transaction.wait()
		console.log('made order')
	}

	for(let i = 1; i <= 10; i++) {
		transaction = await exchange.connect(user2).makeOrder(dogeCoin.address, mEth.address, tokens(10), tokens(10 * i))
		result = await transaction.wait()
		console.log('made order')
	}

	amount = tokens(1000000000)

	transaction = await dogeCoin.connect(escrow).approve(exchange.address, amount)
	await transaction.wait()
	console.log(`Successfully Approved Exchange for Transfer of ${amount} dogeCoin`)
	transaction = await mEth.connect(escrow).approve(exchange.address, amount)
	await transaction.wait()
	console.log(`Successfully Approved Exchange for Transfer of ${amount} mEth`)

	for(let i = 1; i <= 10; i++) {
		let winner, loser, winnerToken, loserToken, winnerAmount, loserAmount

		if(i % 2 == 0) {
			winner = accounts[0].address
			loser = accounts[1].address
			winnerToken = dogeCoin.address
			loserToken = mEth.address
			winnerAmount = tokens(10 * i)
			loserAmount = tokens(10)
		}

		else {
			winner = accounts[1].address	
			loser = accounts[0].address
			winnerToken = mEth.address
			loserToken = dogeCoin.address
			winnerAmount = tokens(10)
			loserAmount = tokens(10 * i)
		}

		transaction = await exchange.connect(user2).duelStart(accounts[0].address, mEth.address, dogeCoin.address, tokens(10), tokens(10 * i))
		result = await transaction.wait()
		await new Promise((resolve) => setTimeout(resolve, 1 * 1000));
		transaction	= await exchange.connect(user2).duelEnd(winner, loser, winnerToken, loserToken, winnerAmount, loserAmount)
		result = await transaction.wait()

		console.log('Duelled')
	}

	for(let i = 1; i <= 5; i++) {
		try {
			transaction = await exchange.connect(user2).makeDuel(accounts[0].address, mEth.address, dogeCoin.address, tokens(5), tokens(5 * i))
			await transaction.wait()

			await new Promise((resolve) => setTimeout(resolve, 1 * 1000));

			console.log('Made Duel')			
		}
		catch(error) {
			console.log(error)
		}
	}

	for(let i = 1; i <= 5; i++) {
		transaction = await exchange.connect(user2).makeDuel(accounts[0].address, mEth.address, dogeCoin.address, tokens(5), tokens(5 * i))
		await transaction.wait()

		await new Promise((resolve) => setTimeout(resolve, 1 * 1000));

		console.log('Made Duel')			
	}
	
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});