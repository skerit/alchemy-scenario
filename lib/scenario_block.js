/**
 * The Base Scenario Block class
 *
 * @constructor
 *
 * @author   Jelle De Loecker <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Document.Scenario}   scenario    The scenario this block is in
 * @param    {Object}              data        Scenario-specific block data
 */
var Block = Function.inherits('Alchemy.Base', 'Alchemy.Scenario.Block', function Block(scenario, data) {

	if (!scenario) {
		throw new Error('Scenario blocks require a scenario document');
	}

	// Store the scenario
	this.scenario = scenario;

	// And the block data
	this.data = data || {};

	// And the configuration
	this.settings = this.data.settings || {};

	// Store the id
	this.id = this.data.id;

	// The blocks that have been seen, that have called this block
	this.seen_blocks = [];
});

/**
 * Make this an abstract class
 */
Block.makeAbstractClass();

/**
 * This class starts a new group
 */
Block.startNewGroup('scenario_block');

/**
 * Only start blocks are entrance points
 *
 * @type {Boolean}
 */
Block.setProperty('entrance_point', false);

/**
 * Each block has a run counter
 *
 * @type {Number}
 */
Block.setProperty('evaluation_count', 0);

/**
 * Has the booting started?
 *
 * @type {Boolean}
 */
Block.setProperty('booting', false);

/**
 * Most blocks have an entrance
 * (So other blocks can point towards it)
 *
 * @type {Boolean}
 */
Block.setProperty('has_entrance', true);

/**
 * Certain blocks can have empty settings,
 * mainly used for description getting
 *
 * @type {Boolean}
 */
Block.setProperty('has_settings', true);

/**
 * Static description,
 * only set when this block should never use
 * `getDescription`
 *
 * @type {Boolean}
 */
Block.setProperty('static_description', '');

/**
 * Always execute `getDescription`, even when
 * there are no settings
 *
 * @type {Boolean}
 */
Block.setProperty('force_description_callback', false);

/**
 * Most blocks have 2 exits
 *
 * @type {Array}
 */
Block.setProperty('exit_names', ['true', 'false']);

/**
 * Return the class-wide schema
 *
 * @type   {Schema}
 */
Block.setProperty(function schema() {
	return this.constructor.schema;
});

/**
 * Return the truthy output block ids
 *
 * @type   {Array}
 */
Block.setProperty(function block_ids_when_true() {

	var result = [],
	    id,
	    i;

	if (this.data && this.data.out_on_true && this.data.out_on_true.length) {
		for (i = 0; i < this.data.out_on_true.length; i++) {
			id = this.data.out_on_true[i];

			if (id) {
				result.push(id);
			}
		}
	}

	return result;
});

/**
 * Return the falsy output block ids
 *
 * @type   {Array}
 */
Block.setProperty(function block_ids_when_false() {

	var result = [],
	    id,
	    i;

	if (this.data && this.data.out_on_false && this.data.out_on_false.length) {
		for (i = 0; i < this.data.out_on_false.length; i++) {
			id = this.data.out_on_false[i];

			if (id) {
				result.push(id);
			}
		}
	}

	return result;
});

/**
 * Return all exit block ids
 *
 * @type   {Array}
 */
Block.setProperty(function exit_block_ids() {
	return this.block_ids_when_true.concat(this.block_ids_when_false);
});

/**
 * Get the blocks pointing to this
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Block.setProperty(function entrance_block_ids() {

	var scenario_blocks,
	    exit_ids,
	    block_ids,
	    result = [],
	    block,
	    exit_id,
	    temp,
	    id,
	    i;

	if (this._entrance_block_ids) {
		return this._entrance_block_ids;
	}

	// Get all the available scenario blocks 
	scenario_blocks = this.scenario.getSortedBlocks().all;

	for (id in scenario_blocks) {
		block = scenario_blocks[id];

		// Get all the exit ids
		exit_ids = (block.block_ids_when_true || []).concat(block.block_ids_when_false);

		for (i = 0; i < exit_ids.length; i++) {

			// Ignore falsy values
			if (!exit_ids[i]) {
				continue;
			}

			// Stringify the id
			exit_id = String(exit_ids[i]);

			// Compare to the id of this block
			if (exit_id == this.id) {
				// The ids match, so the block itself points here
				temp = String(block.id);

				// Make sure each id only gets added once
				if (result.indexOf(temp) == -1) {
					result.push(temp);
				}
			}
		}
	}

	this._entrance_block_ids = result;

	return result;
});

/**
 * Set the block schema
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Block.constitute(function setSchema() {

	var schema;

	// Create a new schema
	schema = new Classes.Alchemy.Schema(this);
	this.schema = schema;
});

/**
 * Callback with a nice description to display in the scenario editor,
 * check if the settings are set first
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Function}   callback
 */
Block.setMethod(function doGetDescription(callback) {

	console.log('Getting description of', this);

	// If there is a static description, that should be returned
	if (this.static_description && !this.force_description_callback) {
		return callback(null, this.static_description);
	}

	// Get the description if the settings can be empty,
	// the callback is forced or the settings object is not empty
	if (!this.has_settings || this.force_description_callback || !Object.isEmpty(this.settings)) {
		return this.getDescription(callback);
	}

	callback(null, this.title + ' (unconfigured)');
});

/**
 * Callback with a nice description to display in the scenario editor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Function}   callback
 */
Block.setMethod(function getDescription(callback) {
	callback(null, this.title);
});

/**
 * Call the savingScenario method if this block is enabled
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Object}   data      The raw scenario data
 * @param    {Object}   options   The saving options
 * @param    {Boolean}  creating  If this scenario is being created
 */
Block.setMethod(function doSavingScenario(data, options, creating) {
	// @todo: check enabled
	return this.savingScenario(data, options, creating);
});

/**
 * Called when the scenario this block is in is being saved
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Object}   data      The raw scenario data
 * @param    {Object}   options   The saving options
 * @param    {Boolean}  creating  If this scenario is being created
 */
Block.setMethod(function savingScenario(data, options, creating) {
	// Do some special stuff
});

/**
 * Start the boot procedure
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Function}   callback
 */
Block.setMethod(function startBoot(callback) {

	var that = this;

	if (this.booting) {
		return;
	}

	// Indicate we're booting
	this.booting = true;

	if (!callback) {
		callback = Function.thrower;
	}

	this.emit('booting', function afterBooting(err) {

		if (err) {
			return callback(err);
		}

		that.boot(function booted(err) {

			if (err) {
				return callback(err);
			}

			that.emit('booted');
		})
	});
});

/**
 * This method starts the evaluation
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {ScenarioBlock}   from_block   The referring block
 * @param    {Function}        callback
 */
Block.setMethod(function startEvaluation(from_block, callback, special_callback) {

	var that = this;

	if (!callback) {
		callback = Function.dummy;
	}

	// Make sure the callbacks gets called only once
	callback = Function.regulate(callback, 1);
	special_callback = Function.regulate(special_callback, 1);

	// Push the referring block to the seen_blocks array
	this.seen_blocks.push(from_block);

	// Only evaluate after the block has booted
	this.after('booted', function booted() {

		// Increase the evaluation counter
		that.evaluation_count++;

		try {
			// Do the actual evaluating
			that.evaluate(from_block, function evaluated(err, value) {

				// Store the value on this block
				that.setResultValue(err, value);

				// Callback, pass along the arguments
				callback.apply(that, arguments);

				// Emit the executed event
				that.emitOnce('evaluated');
			}, function specialised(command, silent_value) {

				// We might not call any exit blocks,
				// this block's value still needs to change (silently)
				if (typeof silent_value != 'undefined') {
					that.setResultValue(null, silent_value, true);
				}

				special_callback(command, silent_value);
			});
		} catch (err) {
			console.log('Got block evaluation error:', err);
			callback(err);
		}
	});
});

/**
 * Get this block's current result object
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {String}   scope_name   The scopename to use,
 *                                   defaults to currently set name
 *
 * @return   {Object}   Return the value object
 */
Block.setMethod(function getCurrentResult(scope_name) {

	var result = this.scenario.touchPersistedBlockValue(this, scope_name);

	return result;
});

/**
 * Get this block's result object from the previous scenario run
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {String}   scope_name   The scopename to use,
 *                                   defaults to currently set name
 *
 * @return   {Object}   Return the value object
 */
Block.setMethod(function getPreviousResult(scope_name) {

	var values,
	    result;

	if (!scope_name) {
		scope_name = this.scenario.scope_name;
	}

	// If the previous result clone object doesn't exist,
	// just return the current values
	if (!this.scenario.previous_result_clone) {
		result = this.getCurrentResult(scope_name);
	} else {

		if (!this.scenario.previous_result_clone[scope_name]) {
			this.scenario.previous_result_clone[scope_name] = {};
		}

		values = this.scenario.previous_result_clone[scope_name];

		result = values[this.id] || {};
	}

	return result;
});

/**
 * Set this block's result values
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Object}   err        The error if there was one, or null
 * @param    {Mixed}    value      The value
 * @param    {Boolean}  silently   If this is a silent value
 */
Block.setMethod(function setResultValue(err, value, silently) {

	// Indicate this block as a new result value
	this.has_result_value = true;

	// Indicate this value was set silently
	this.has_silent_value = !!silently;

	// Store the value on the block,
	// so next blocks inside this scenario can use it
	this.result_value = value;

	// Also store the error, just in case
	this.result_err = err;

	// Persist the block value
	this.scenario.persistBlockValue(this);
});

/**
 * Get the blocks pointing to this
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Block.setMethod(function getEntranceBlocks() {

	var entrance_block_ids = this.entrance_block_ids,
	    scenario_blocks,
	    result = [],
	    block,
	    id,
	    i;

	if (this._entrance_blocks) {
		return this._entrance_blocks;
	}

	scenario_blocks = this.scenario.getSortedBlocks().all;

	for (i = 0; i < entrance_block_ids.length; i++) {
		id = entrance_block_ids[i];
		block = scenario_blocks[id];

		if (block) {
			result.push(block);
		}
	}

	this._entrance_blocks = result;
	return result;
});

/**
 * Get the next blocks, depending on response value
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Block.setMethod(function getNextBlocks(value) {

	var scenario_blocks,
	    block_ids,
	    result = [],
	    block,
	    id,
	    i;

	if (value) {
		block_ids = this.block_ids_when_true;
	} else {
		block_ids = this.block_ids_when_false;
	}

	if (block_ids && block_ids.length) {
		// Get all the blocks in the scenario
		scenario_blocks = this.scenario.getSortedBlocks().all;

		for (i = 0; i < block_ids.length; i++) {
			id = block_ids[i];

			block = scenario_blocks[id];

			if (block) {
				result.push(block);
			}
		}
	}

	return result;
});

/**
 * Get a value out of the current scenario variables
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {String}        name
 *
 * @return   {Mixed}
 */
Block.setMethod(function get(name) {

	var obj;

	if (!this.scenario) {
		return null;
	}

	if (!this.scenario.variables) {
		return null;
	}

	// Get the variable object
	obj = this.scenario.variables[name];

	if (obj) {
		return obj.value;
	}
});

/**
 * Set a value in the current scenario variables
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {String}        name    Name of the variable
 * @param    {Mixed}         value   The actual value
 * @param    {String}        type    The optional type
 *
 * @return   {Mixed}
 */
Block.setMethod(function set(name, value, type) {

	if (!this.scenario) {
		return false;
	}

	if (!this.scenario.variables) {
		return false;
	}

	this.scenario.variables[name] = {
		value : value,
		type  : type
	};

	return true;
});

/**
 * Bootup the block,
 * is called as soon as the scenario starts.
 * Evaluation will only happen after this has finished.
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Function}        callback
 */
Block.setMethod(function boot(callback) {
	callback(null);
});

/**
 * Evaluate the block with the given data
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {ScenarioBlock}   from_block   The referring block
 * @param    {Function}        callback
 * @param    {Function}        command      A special callback to send commands to the scenario
 *                                          When called without arguments, 'ignore' is used
 */
Block.setMethod(function evaluate(from_block, callback, command) {
	console.log('Should evaluate block', this);
});
