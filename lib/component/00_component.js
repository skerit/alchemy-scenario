/**
 * The Base Scenario Component class
 *
 * @constructor
 *
 * @author   Jelle De Loecker <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.3.0
 *
 * @param    {Alchemy.Scenario.Session}   session    The session this component is in
 * @param    {Object}                     data       Scenario-specific block data
 */
const Component = Function.inherits('Alchemy.Base', 'Alchemy.Scenario.Component', function Component(session, data) {

	if (!session) {
		throw new Error('Scenario components require a session document');
	}

	// Store the session
	this.session = session;

	// And the component data
	this.data = data || {};
	this.config = this.data;

	// And the configuration
	this.settings = this.data.settings || {};

	// Store the id
	this.uid = this.id = this.data.uid;

	this.loadCustomIO();
});

/**
 * Make this an abstract class
 */
Component.makeAbstractClass();

/**
 * This class starts a new group
 */
Component.startNewGroup('scenario_component');

/**
 * Set the description of the component
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.4.0
 * @version  0.4.0
 */
Component.setStatic(function setDescription(description) {
	this.description = description;
});

/**
 * Get the client-side class
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.3.0
 * @version  0.3.0
 *
 * @return   {Function}
 */
Component.setStatic(function getClientClass() {
	return Classes.Alchemy.Client.Scenario.Component.Component.getClass(this.name);
});

/**
 * Get the component's public configuration
 * (This is used to create the client-side Component instances)
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.3.0
 * @version  0.4.0
 */
Component.setStatic(function getClientConfig() {

	const result = {
		name        : this.name,
		type_name   : this.type_name,
		schema      : this.schema,
		categories  : this.categories,
		title       : this.title || (this.type_name.titleize()),
		description : this.description,
		inputs      : [],
		outputs     : [],
	};

	for (let input of this.inputs) {
		result.inputs.push({
			name  : input.name,
			title : input.title,
			type  : input.type
		});
	}

	for (let output of this.outputs) {
		result.outputs.push({
			name  : output.name,
			title : output.title,
			type  : output.type
		});
	}

	if (this.super.name != 'Component') {
		result.parent = this.super.name;
	}

	return result;
});

/**
 * Reference to the scenario in the session property
 *
 * @type   {Document.Scenario}
 */
Component.setProperty(function scenario() {
	return this.session.scenario;
});

/**
 * Return the class-wide schema
 *
 * @type   {Schema}
 */
Component.setProperty(function schema() {
	return this.constructor.schema;
});

/**
 * Prepare the inputs & outputs
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.4.0
 */
Component.constitute(function prepareIo() {

	// Create the IO decks
	this.inputs = new Deck();
	this.outputs = new Deck();

	// Create the schema
	let schema = new Classes.Alchemy.Schema(this);
	this.schema = schema;

	// Make sure the client-side component exists on the server too
	Classes.Alchemy.Client.Scenario.Component.Component.getClass(this.name, this);
});

/**
 * Add a category to a component
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.3.0
 * @version  0.3.0
 */
Component.setStatic(function addCategory(category_name) {

	if (!this.categories) {
		this.categories = [];
	}

	if (!this.categories.includes(category_name)) {
		this.categories.push(category_name);
	}

	let client_class = this.getClientClass();

	if (client_class) {
		if (!client_class.categories) {
			client_class.categories = [];
		}
	
		if (!client_class.categories.includes(category_name)) {
			client_class.categories.push(category_name);
		}
	}
});

/**
 * Set an input handler
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 */
Component.setStatic(function setInput(name, fnc, options) {
	this.constitute(function constituteInput() {
		if (typeof name == 'function') {
			options = fnc;
			fnc = name;
			name = fnc.name;
		}

		if (!options) {
			options = {};
		} else if (options.name) {
			name = options.name;
		} else {
			options.name = name;
		}

		options.fnc = fnc;

		this.inputs.set(name, options);
	});
});

/**
 * Set an output config
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 */
Component.setStatic(function setOutput(name, options) {

	if (typeof name == 'object') {
		options = name;
		name = options.name;
	}

	if (!name) {
		throw new Error('Each component output requires a valid name');
	}

	this.constitute(function constituteOutput() {
		this.outputs.set(name, options);
	});
});

/**
 * Get all components
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.1
 */
Component.setStatic(function getAll() {

	let component,
	    outputs,
	    inputs,
	    result = [],
	    group = alchemy.getClassGroup('scenario_component'),
	    key;

	for (key in group) {
		component = group[key];
		outputs = [];
		inputs = [];

		for (let input of component.inputs) {
			inputs.push({
				name  : input.name,
				title : input.title,
				type  : input.type
			});
		}

		for (let output of component.outputs) {
			outputs.push({
				name  : output.name,
				title : output.title,
				type  : output.type
			});
		}

		let buttons = [];

		if (component.schema.field_count) {
			buttons.push({
				name  : 'config',
				title : 'Config',
				call  : 'Blast.Classes.Alchemy.Scenario.FlowHelper.configureNode',
				//href  : Router.getUrl('Scenario#configureComponent') + '',
			});
		}

		result.push({
			name        : key,
			title       : component.title,
			description : component.title + ' component',
			outputs     : outputs,
			inputs      : inputs,
			field_count : component.schema.field_count,
			schema      : component.schema,
			buttons     : buttons,
		});
	}

	console.log('Component RESULT:', result);

	return result;
}, false);

/**
 * Create a signal
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 */
Component.setMethod(function createSignal(type, value) {
	let signal = new Classes.Alchemy.Scenario.Signal(type, value);

	signal.source = this;

	return signal;
});

/**
 * Output a signal
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {String}   name     The output anchor name
 * @param    {Signal}   signal
 */
Component.setMethod(function outputSignal(name, signal) {

	let target_component,
	    connection;

	// Iterate over all the connections
	for (connection of this.data.connections.out) {

		// Make sure it's the correct output anchor
		if (connection.source.anchor_name != name) {
			continue;
		}

		target_component = this.scenario.getComponent(connection.target.node_uid);

		let cloned_signal = signal.clone();

		cloned_signal.source = this;
		cloned_signal.source_anchor = name;

		target_component.inputSignal(connection.target.anchor_name, cloned_signal);
	}
});

/**
 * Process an input signal
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @param    {String}   name     The input anchor name
 * @param    {Signal}   signal
 */
Component.setMethod(function inputSignal(name, signal) {

	let input = this.getInput(name);

	if (!input) {
		return;
	}

	input.fnc.call(this, signal);
});

/**
 * Get a memory instance for this component
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @return   {Alchemy.Scenario.Memory}
 */
Component.setMethod(function getMemory() {

	if (this.session.persistent_memory) {
		return this.session.persistent_memory.getSubMemory(this.uid);
	}

	return this.getSessionMemory();
});

/**
 * Specifically get the session memory for this component
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @return   {Alchemy.Scenario.Memory}
 */
Component.setMethod(function getSessionMemory() {
	return this.session.session_memory.getSubMemory(this.uid);
});

/**
 * Get all the input connections
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @return   {Array}
 */
Component.setMethod(function getInputConnections() {
	return this.data.connections.in;
});

/**
 * Get all the output connections
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.2.0
 * @version  0.2.0
 *
 * @return   {Array}
 */
Component.setMethod(function getOutputConnections() {
	return this.data.connections.out;
});

/**
 * Expose component class information for the client-side
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.3.0
 * @version  0.3.0
 */
alchemy.on('generate_static_variables', function generateStaticVariables(hawkejs) {

	let classes = Classes.Alchemy.Scenario.Component.Component.getAllChildren(),
	    info = {};

	for (let child_class of classes) {
		info[child_class.name] = child_class.getClientConfig();
	}

	hawkejs.exposeStatic('flow_component_info', info);
});