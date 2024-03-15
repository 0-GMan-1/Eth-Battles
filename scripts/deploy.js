async function main() {

	const Token = await ethers.getContractFactory('Token')
	const Exchange = await ethers.getContractFactory('Exchange')
	const accounts = await ethers.getSigners()

	const dogeCoin = await Token.deploy('Doge Coin', 'DC', 100000)
	await dogeCoin.deployed()
	console.log(`Token Contract Successfully Deployed To ${dogeCoin.address}`)
	const mEth = await Token.deploy('Mock Eth', 'mETH', 100000)
	await mEth.deployed()
	console.log(`Token Contract Successfully Deployed To ${mEth.address}`)
	const mDai = await Token.deploy('Mock Dai', 'mDAI', 100000)
	await mDai.deployed()
	console.log(`Token Contract Successfully Deployed To ${mDai.address}`)
	const usdt = await Token.deploy('US Dollar Tether', 'USDT', 100000)
	await usdt.deployed()
	console.log(`Token Contract Successfully Deployed To ${usdt.address}`)

	const exchange = await Exchange.deploy(accounts[1].address, 10, accounts[2].address)
	await exchange.deployed()
	console.log(`Exchange Contract Successfully Deployed To ${exchange.address}`)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});