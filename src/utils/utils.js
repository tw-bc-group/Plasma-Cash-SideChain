const { getTransactionBytes } = require('./cryptoUtils');
const BigNumber					= require("bignumber.js")

const getHighestOcurrence = (arr) => {
	const occurences = {};
	let max = 0;

	arr.forEach(e => {
		if(occurences[e] == undefined){
			occurences[e]=1
		} else {
			 occurences[e] += 1
		}
		if(occurences[e] > max) {
			max = occurences[e]
		}
	});

	return max;
};

const groupBy = (arr, key)  => {
	return arr.reduce((result, e) => {
		result[e[key]] == undefined ? result[e[key]] = [e] : result[e[key]].push(e);
		return result
	}, {})
};

const logErr = (err) => { if (err) console.log(err) };


const blockToJson = (block) => ({
	block_number: block.block_number.toFixed(),
	root_hash: block.root_hash,
	timestamp: block.timestamp,
	transactions: block.transactions
});

const transactionToJson = (transaction) => ({
	slot: transaction.slot.toFixed(),
	owner: transaction.owner,
	recipient: transaction.recipient,
	hash: transaction.hash,
	block_spent: transaction.block_spent.toFixed(),
	signature: transaction.signature,

	mined_timestamp: transaction.mined_timestamp,
	mined_block: transaction.mined_block,
});

const exitDataToJson = (lastTx, lastProof, prevTx, prevProof) => {
	let prevTxBytes = prevTx ? getTransactionBytes(prevTx.slot, prevTx.block_spent, new BigNumber(1), prevTx.recipient) : "0x0";
	let prevTxInclusionProof = prevTx ? prevProof : "0x0";
	let prevBlock = prevTx ? prevTx.mined_block._id : '0';
	return {
		prevTxBytes,
		exitingTxBytes: getTransactionBytes(lastTx.slot, lastTx.block_spent, new BigNumber(1), lastTx.recipient),
		prevTxInclusionProof,
		exitingTxInclusionProof: lastProof,
		signature: lastTx.signature,
		blocks: [prevBlock, lastTx.mined_block._id]
	}
}

module.exports = {
	getHighestOcurrence,
	groupBy,
	logErr,
	blockToJson,
	transactionToJson,
	exitDataToJson
};