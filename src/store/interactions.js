import { ethers } from 'ethers'

import TOKEN_ABI from '../abis/Token'
import EXCHANGE_ABI from '../abis/Exchange'

import config from '../config.json'

import {useSelector} from 'react-redux'
import ETHLogo from '../assets/ethlogo.png'

export const loadProvider = (dispatch) => {
	const provider = new ethers.providers.Web3Provider(window.ethereum)
	const providerHardhat = new ethers.providers.getDefaultProvider('http://127.0.0.1:8545')
    dispatch({ type: 'PROVIDER_LOADED', connection: provider })
    dispatch({type: 'PROVIDER_HARHAT_LOADED', connection: provider})
    
    return [provider, providerHardhat]
}

export const loadNetwork = async (dispatch, provider) => {
	const { chainId } = await provider.getNetwork()
    dispatch({ type: 'NETWORK_LOADED', chainId })
    
    return {chainId}
}

export const loadAccount = async (dispatch, provider) => {
	const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
	const account = ethers.utils.getAddress(accounts[0])
	dispatch({ type: 'ACCOUNT_LOADED', account })

	let balance = await provider.getBalance(account)
	balance = ethers.utils.formatEther(balance)
	dispatch({ type: 'ETHER_BALANCE_LOADED', balance })

	return account, balance
}

export const loadTokens = async (dispatch, provider, addresses) => {
	let token, symbol
	token = new ethers.Contract(addresses[0], TOKEN_ABI, provider)
	symbol = await token.symbol()
	dispatch({ type: 'TOKEN_LOADED_1', token, symbol })

	token = new ethers.Contract(addresses[1], TOKEN_ABI, provider)
	symbol = await token.symbol()
	dispatch({ type: 'TOKEN_LOADED_2', token, symbol })

	token = new ethers.Contract(addresses[2], TOKEN_ABI, provider)
	symbol = await token.symbol()
	dispatch({type: 'TOKEN_LOADED_3', token, symbol})
	return token
}

export const loadExchange = async (dispatch, provider, address) => {
	const exchange = new ethers.Contract(address, EXCHANGE_ABI, provider)
	dispatch({ type: 'EXCHANGE_LOADED', exchange })
	
	return exchange
}

const tokenSubscribe = async (provider, exchange, from, value, dispatch, token) => {
	const signer = await provider.getSigner()
	console.log(provider)
	await exchange.connect(signer).localDeposit(token.address, from, value)
	let balance = ethers.utils.formatUnits(value, 18)
	dispatch({type: 'DEPOSIT_TOKENS', balance})
	dispatch({type: 'LOCAL_DEPOSIT'})
}

export const subscribeToEvents = async (exchange, dispatch, provider, account, addresses) => {

	exchange.on('Deposit', (token, user, amount, balance, event) => {
		dispatch({ type: 'TRANSFER_SUCCESS', event })
	})
	exchange.on('Withdraw', (token, user, amount, balance, event) => {
		dispatch({ type: 'TRANSFER_SUCCESS', event })
	})
	exchange.on('NewOrder', (id, user, tokenGet, amountGet, tokenGive, amountGive, timestamp, event) => {
		const order = event.args
		dispatch({ type: 'ORDER_SUCCESS', event, order})
	})
	exchange.on('CancelOrder', (id, user, tokenGet, amountGet, tokenGive, amountGive, timestamp, event) => {
		const order = event.args
		dispatch({type: 'ORDER_CANCEL_SUCCESS', order, event})
	})
	exchange.on('Trade', (id, user, tokenGet, amountGet, tokenGive, amountGive, creator, timestamp, event) => {
		const order = event.args
		dispatch({type: 'FILL_ORDER_SUCCESS', order, event})
	})
	exchange.on('DuelEnd', (winner, loser, winnerToken, winnerTokenAmount, loserToken, loserTokenAmount, timestamp, event) => {
		const duel = event.args
		dispatch({ type: 'DUEL_SUCCESS', event, duel})
	})

	const tokenDC = new ethers.Contract(addresses[0], TOKEN_ABI, provider)
	const tokenETH = new ethers.Contract(addresses[1], TOKEN_ABI, provider)
	const tokenUSDT = new ethers.Contract(addresses[2], TOKEN_ABI, provider)

	tokenDC.on('Transfer', async (from, to, value, event) => {
		await tokenSubscribe(provider, exchange, from, value, dispatch, tokenDC)
	})
	tokenETH.on('Transfer', async (from, to, value, event) => {
		await tokenSubscribe(provider, exchange, from, value, dispatch, tokenETH)
	})
	tokenUSDT.on('Transfer', async (from, to, value, event) => {
		await tokenSubscribe(provider, exchange, from, value, dispatch, tokenUSDT)
	})		
}

export const loadBalances = async (dispatch, exchange, tokens, account) => {
	let balance
	balance = ethers.utils.formatUnits(await tokens[0].balanceOf(account), 18)
	dispatch({ type: 'TOKEN_1_BALANCE_LOADED', balance })

	balance = ethers.utils.formatUnits(await exchange.balanceOf(tokens[0].address, account), 18)
	dispatch({ type: 'EXCHANGE_TOKEN_1_BALANCE_LOADED', balance})

	balance = ethers.utils.formatUnits(await tokens[1].balanceOf(account), 18)
	dispatch({ type: 'TOKEN_2_BALANCE_LOADED', balance })

	balance = ethers.utils.formatUnits(await exchange.balanceOf(tokens[1].address, account), 18)
	dispatch({ type: 'EXCHANGE_TOKEN_2_BALANCE_LOADED', balance})
}

export const loadBalancesNew = async (dispatch, exchange, tokens, account) => {
	let balances
	let exchangeBalances

	const btcBalance = ethers.utils.formatUnits(await tokens[0].balanceOf(account), 18)
	const ethBalance = ethers.utils.formatUnits(await tokens[1].balanceOf(account), 18)
	const usdtBalance = ethers.utils.formatUnits(await tokens[2].balanceOf(account), 18)

	const exchangeBTC = ethers.utils.formatUnits(await exchange.balanceOf(tokens[0].address, account), 18)
	const exchangeETH = ethers.utils.formatUnits(await exchange.balanceOf(tokens[1].address, account), 18)
	const exchangeUSDT = ethers.utils.formatUnits(await exchange.balanceOf(tokens[2].address, account), 18)

	balances = {
		btcBalance: btcBalance,
		ethBalance: ethBalance,
		usdtBalance: usdtBalance
	}

	exchangeBalances = {
		btcBalance: exchangeBTC,
		ethBalance: exchangeETH,
		usdtBalance: exchangeUSDT
	}

	dispatch({type: 'BALANCES_LOADED', balances, ETHLogo})

	dispatch({type: 'EXCHANGE_BALANCES_LOADED', exchangeBalances, ETHLogo})
}

export const loadOrders = async (dispatch, provider, exchange) => {
	let allOrders
	let orderStream
	const block = await provider.getBlockNumber()

	const tradeStream = await exchange.queryFilter('Trade', 0, block)
	const tradeOrders = tradeStream.map(event => event.args)

	dispatch({ type: 'TRADEORDERS_LOADED', tradeOrders })

	const cancelStream = await exchange.queryFilter('CancelOrder', 0, block)
	const cancelledOrders = cancelStream.map(event => event.args)

	dispatch({ type: 'CANCELLEDORDERS_LOADED', cancelledOrders })
	
	orderStream = await exchange.queryFilter("NewOrder", 0, block)
	allOrders = orderStream.map(event => event.args)

	dispatch({ type: 'ALL_ORDERS_LOADED', allOrders })
}

export const transferTokens = async (dispatch, provider, exchange, transferType, token, amount) => {
	let transaction

	dispatch({ type: 'TRANSFER_REQUEST' })

	try {
		const signer = await provider.getSigner()
		const amountToTransfer = ethers.utils.parseUnits(amount.toString(), 18)
	
		if (transferType == 'deposit') {
			transaction = await token.connect(signer).approve(exchange.address, amountToTransfer)
			await transaction.wait()
		
			transaction = await exchange.connect(signer).depositToken(token.address, amountToTransfer)
			await transaction.wait()
		}
		else if (transferType == 'withdraw') {
			transaction = await exchange.connect(signer).withdrawToken(token.address, amountToTransfer)
			await transaction.wait()
		}
	}

	catch (error) {
		dispatch({ type: 'TRANSFER_FAIL' })
	}

}

export const makeOrder = async (dispatch, provider, exchange, transferType, tokens, amounts) => {
	let transaction

	dispatch({ type: 'ORDER_REQUEST' })

	try {
		const signer = await provider.getSigner()

		let tokenGet = tokens[0].address
		let tokenGive = tokens[1].address
		let amountGet = ethers.utils.parseUnits(amounts.tokenAmount.toString(), 18)
		let amountGive = ethers.utils.parseUnits((amounts.priceAmount * amounts.tokenAmount).toString(), 18)
		
		if (transferType == 'buy') {
			tokenGet = tokens[0].address
			tokenGive = tokens[1].address
			amountGet = ethers.utils.parseUnits(amounts.tokenAmount.toString(), 18)
			amountGive = ethers.utils.parseUnits((amounts.priceAmount * amounts.tokenAmount).toString(), 18)

			transaction = await exchange.connect(signer).makeOrder(tokenGet, tokenGive, amountGet, amountGive)
			await transaction.wait()
		}
		else if (transferType == 'sell') {
			tokenGet = tokens[1].address
			tokenGive = tokens[0].address
			amountGet = ethers.utils.parseUnits((amounts.priceAmount * amounts.tokenAmount).toString(), 18)
			amountGive = ethers.utils.parseUnits(amounts.tokenAmount.toString(), 18)

			transaction = await exchange.connect(signer).makeOrder(tokenGet, tokenGive, amountGet, amountGive)
			await transaction.wait()
		}
	}
	catch (error) {
		dispatch({ type: 'ORDER_FAIL' })
		console.log(error)
	}
}

export const cancelOrder = async (provider, exchange, order, dispatch) => {
	dispatch({type: 'ORDER_CANCEL_REQUEST'})

	try {
		const signer = await provider.getSigner()
		const transaction = await exchange.connect(signer).cancelOrder(order.id)
		await transaction.wait()
	}
	catch(error) {
		dispatch({type: 'ORDER_CANCEL_FAIL'})
	}
}

export const fillOrder = async (provider, exchange, order, dispatch) => {
	dispatch({type: 'FILL_ORDER_REQUEST'})

	try {
		const signer = await provider.getSigner()
		const transaction = await exchange.connect(signer).fillOrder(order.id)
		await transaction.wait()
	}
	catch(error) {
		dispatch({type: 'FILL_ORDER_FAIL'})
	}
}

export const logIn = (dispatch, user, pass) => {
	if(user.length != 0 && pass.length != 0) {
		dispatch({type: 'LOG_IN_SUCCESS', user, pass})
	}

	else {
		dispatch({type: 'LOG_IN_FAIL'})
	}
}

export const transfersToExchange = async (provider, exchange) => {
	const token = new ethers.Contract(config[31337].dogeCoin.address, TOKEN_ABI, provider)
	const block = await provider.getBlockNumber()
	const tradeStream = await token.queryFilter('Transfer', 0, block)

	let transaction
	const signer = await provider.getSigner()

	const amountToTransfer = '1'
	transaction = await token.connect(signer).transfer(exchange.address, amountToTransfer)
	await transaction.wait()
}

export const loadDuels = async (dispatch, provider, exchange) => {
	let allDuels, openDuels
	let duelStream
	const block = await provider.getBlockNumber()
	
	duelStream = await exchange.queryFilter("DuelEnd", 0, block)
	allDuels = duelStream.map(event => event.args)

	dispatch({ type: 'DUELS_LOADED', allDuels })

	duelStream = await exchange.queryFilter("MakeDuel", 0, block)
	openDuels = duelStream.map(event => event.args)

	dispatch({ type: 'OPEN_DUELS_LOADED', openDuels })
}

export const addFriend = (dispatch, friendAddress, sender, type) => {
	if (type == 'guild') {
		dispatch({type:'GUILD_REQUEST', friendAddress, sender})
	}

	else if (type == 'friend') {
		dispatch({type:'FRIEND_REQUEST', friendAddress, sender})
	}
}

export const acceptFriend = (dispatch, friendAddress, sender) => {
	dispatch({type:'FRIEND_ACCEPT', friendAddress, sender})
}

export const createGuild = (dispatch, ownerAddress, name, maxPlayers, guilds) => {
	let filteredGuilds = guilds.findIndex(guild => guild.name == name)
	if (filteredGuilds == 0) {
		dispatch({type:'GUILD_CREATE_CANCEL'})
		return 'Guild Name Already Exists'
	}
	
	const guild = {
		name: name,
		owner: ownerAddress,
		playerCount: 1,
		players: [ownerAddress],
		maxPlayers: maxPlayers,
		level: 1
	}

	dispatch({type:'GUILD_CREATE', guild})
}

export const acceptGuild = (dispatch, inviteAddress, ownerAddress) => {
	dispatch({type:'GUILD_ACCEPT', ownerAddress})
}

export const messageSend = (dispatch, account, sender, reciever, message) => {
	let messageObject

		messageObject = {
			messageSender: sender,
			messageReciever: reciever,
			recipient: reciever,
			messages: {message1: [sender == account && message], message2: [sender != account && message]}
		}

	dispatch({type:'MESSAGE', messageObject, message})
}