var util = require("util");
var events = require("events");

function DI() {
    events.EventEmitter.call(this);

    this.services = {};
    this.initEvents();
}

util.inherits(DI, events.EventEmitter);

DI.prototype.isDefined = function(name) {
    return this.services.hasOwnProperty(name);
};

DI.prototype.isCreated = function(name) {
    if (this.isDefined(name)) {
        return this.services[name].hasOwnProperty('object');
    }
    return false;
};

DI.prototype.getDependencies = function(name) {
    this.checkIsDefined(name);

    return this.services[name].dependencies || [];
};

DI.prototype.getDependents = function(name) {
    this.checkIsDefined(name);
    var services = this.services,
        result = [];

    Object.keys(services).forEach(function(key) {
        var dependencies = services[key].dependencies;
        if (dependencies && dependencies.indexOf(name) != -1) {
            result.push(key);
        }
    }, this);

    return result;
};

DI.prototype.initEvents = function() {
    this.on('newListener', (function(event, listener) {
        var match = event.match(/^create:(.+)$/);
        if (match) {
            var serviceName = match[1];
            if (this.isCreated(serviceName)) {
                listener(this.get(serviceName));
            }
        }
    }).bind(this));
};

DI.prototype.checkIsDefined = function(name) {
    if (!this.isDefined(name)) {
        throw new Error('Object "' + name + '" isn\'t defined');
    }
    return true;
};


DI.prototype._triggerEvent = function(event, name, service) {
    this.emit(event, name, service);
    this.emit(event + ':' + name, service);
};

DI.prototype.remove = function(name) {
    this.checkIsDefined(name);

    this._triggerEvent('remove', name, this.services[name]);
    delete this.services[name];
    return this;
};

DI.prototype.reset = function(name) {
    this.checkIsDefined(name);

    var data = this.services[name];
    if (!data.static) {
        delete data.object;
    }
    this._triggerEvent('reset', name, this.services[name]);
    return this;
};

DI.prototype.single = function (name, dependencies, factory){
    return this.define(name, dependencies, factory, true);
};

DI.prototype.define = function(name, dependencies, factory, single) {
    if (this.isDefined(name)) {
        throw new Error('Object "' + name + '" already defined');
    }

    var data = {
        name    : name,
        factory : factory,
        single  : single,
        static  : false,
        dependencies : dependencies || []
    };

    if (typeof factory != 'function') {
        data['static']  = true;
        data['single']  = true;
    }
    this.services[name] = data;

    this._triggerEvent('define', name, null);

    return this;
};

DI.prototype.get = function(){
    var args = Array.prototype.slice.call(arguments);
    var name = args.shift();
    this.checkIsDefined(name);

    var data = this.services[name];

    var triggerCreate = (!data.object)? true:false;

    if (data.static) {
        data.object = data.factory;
    } else {
        if (data.object && data.single) {
            return data.object;
        }
        var factoryArgs = data.dependencies.map(function (item) {
            return this.get(item);
        }, this);
        factoryArgs.push(this);
        data.object = data.factory.apply(this, factoryArgs);
    }

    if (triggerCreate) {
        this._triggerEvent('create', data.name, data.object);
    }
    return data.object;
};

module.exports = DI;