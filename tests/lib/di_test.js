var should = require('should');
var DI = require('../../lib/di');

describe('DI', function() {
    it('should be return DI object', function(){
        var di = new DI();
        di.should.be.an.instanceOf(DI);
    });

    it('should throw error when service already registered', function( ){
        var di = new DI();
        di.single('Log', [], function(di) {});
        should(function() {
            di.single('Log', [], function() {});
        }).throw();
    });

    it('should create services', function( ){

        var di = new DI();
        var numCreate = 0;
        di.define('Log', [], function(_di){
            arguments.length.should.be.eql(1);
            //_di.should.be.exactly(di);
            numCreate++;
            return {
                log: function( ){}
            }
        }).should.be.exactly(di);

        var log = di.get('Log');
        log.should.be.an.Object.and
           .have.property('log').with.type('function');


        di.get('Log').should.be.not.exactly(log);
        numCreate.should.be.eql(2);
    });

    it('should create once singleton', function() {
        var di = new DI();
        di.single('Log', [], function() {
            return {log: function() {}};
        });

        di.get('Log').should.be.exactly(di.get('Log'));
    });

    it('should emit event when create service', function() {
        var di = new DI();
        di.define('Log', function() {
            return "Hello";
        });
        var emitNum = 0;
        di.on('create:Log', function() {
            emitNum++;
        });
        di.on('create', function(serviceName) {
            serviceName.should.be.equal('Log');
            emitNum++;
        });
        di.get('Log');
        emitNum.should.be.equal(2);
    });

    it('should be throw error if the service is not defined', function() {
        var di = new DI();
        should(function() {
            di.get('Log');
        }).throw();
    });

    it('should emit right after bind if the service created', function() {
        var di = new DI();
        di.single('Log', [], function() {});
        di.get('Log');

        var numCall = 0;
        di.on('create:Log', function() {
            numCall++;
        });
        numCall.should.be.eql(1);
    });

    it('should allow register scalar objects', function() {
        var di = new DI();
        var PI = '3.14';
        di.single('PI', [], PI);
        di.get('PI').should.be.exactly(PI).and.equal('3.14');
    });

    it('should load dependecies', function() {
        var di = new DI();
        di.single('PI', [], 3.14);
        di.single('Math', ['PI'], function(PI, di){
            return {
                PI: PI
            }
        });
        di.get('Math').PI.should.be.equal(3.14);
    });
});