module.exports = function InstantUpgrade(mod) {
	// Remove enchant/upgrade timer
	let enchanting = null

	for(const method of ['ENCHANT', 'UPGRADE']) {
		mod.hook(`C_REGISTER_${method}_ITEM`, 1, event => { enchanting = event })

		mod.hook(`C_START_${method}`, 1, event => {
			if(enchanting && event.contract === enchanting.contract) {
				mod.send(`C_REQUEST_${method}`, 1, enchanting)
				return false
			}
		})

		mod.hook(`C_REQUEST_${method}`, 'raw', () => false)
	}

	// Remove soulbind timer
	mod.hook('C_BIND_ITEM_BEGIN_PROGRESS', 1, event => {
		mod.send('C_BIND_ITEM_EXECUTE', 1, { contractId: event.contractId })

		process.nextTick(() => {
			mod.send('S_CANCEL_CONTRACT', 1, {
				senderId: event.gameId,
				recipientId: 0,
				type: 32,
				id: event.contractId
			})
		})
	})

	mod.hook('C_BIND_ITEM_EXECUTE', 'raw', () => false)
}