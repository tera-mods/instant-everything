module.exports = function InstantEverything(mod) {
	mod.log.warn('There is an ongoing bug where, when performing contract-related actions during periods of server instability, your character can become unable to login until server reboot. Instant Everything may increase the chance of this happening. Please exercise caution. Unpatched since: 2019-10-15')

	// Enchant/Upgrade
	let enchanting = null

	for(const method of ['ENCHANT', mod.patchVersion < 79 ? 'UPGRADE' : 'EVOLUTION']) {
		mod.hook(`C_REGISTER_${method}_ITEM`, 1, event => { enchanting = event })

		mod.hook(`C_START_${method}`, 1, event => {
			if(enchanting && event.contract === enchanting.contract) {
				mod.send(`C_REQUEST_${method}`, 1, enchanting)
				return false
			}
		})

		mod.hook(`C_REQUEST_${method}`, 'raw', () => false)
	}

	// Soulbind
	mod.hook('C_BIND_ITEM_BEGIN_PROGRESS', 1, event => {
		mod.send('C_BIND_ITEM_EXECUTE', 1, { contractId: event.contractId })

		process.nextTick(() => {
			mod.send('S_CANCEL_CONTRACT', 1, { type: 32, id: event.contractId })
		})
	})

	mod.hook('C_BIND_ITEM_EXECUTE', 'raw', () => false)

	// Merge
	mod.hook('S_REQUEST_CONTRACT', 1, event => {
		if(event.type !== 33) return

		mod.send('C_MERGE_ITEM_EXECUTE', 1, { contractId: event.id })

		process.nextTick(() => {
			mod.send('S_CANCEL_CONTRACT', 1, { type: 33, id: event.contractId })
		})
	})

	mod.hook('C_MERGE_ITEM_EXECUTE', 'raw', () => false)

	// Dismantle
	mod.hook('C_RQ_START_SOCIAL_ON_PROGRESS_DECOMPOSITION', 1, event => {
		mod.send('C_RQ_COMMIT_DECOMPOSITION_CONTRACT', 1, { contract: event.contract })
		return false
	})

	mod.hook('C_RQ_COMMIT_DECOMPOSITION_CONTRACT', 'raw', () => false)

	// Exit game
	mod.hook('S_PREPARE_EXIT', 'raw', () => {
		mod.send('S_EXIT', 3)
		return false
	})
}