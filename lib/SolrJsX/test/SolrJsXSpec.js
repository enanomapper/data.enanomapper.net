var Solr = require("../"),
		_ = require("underscore"),
		customMatchers = {
			toDeepEqual: function (util, customEqualityTesters) {
				return {
					compare: function(actual, expected) {
							return { pass: _.isEqual(actual, expected) };
					}
				}
			}
		};


describe("SolrJsX:", function () {
	// prepare the test for dual runs - browser & npm
	beforeEach(function () {
		var jself = typeof this.addMatchers === 'function' ? this : jasmine;
		jself.addMatchers(customMatchers);
	});

	// Now - GO with the tests.
	it("Trivial test", function () {
		expect(true).toBe(true);
	});
});
