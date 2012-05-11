

describe('ToDo', function() {
	var scope, ctrl;

	beforeEach(function($httpBackend) {
		scope = {};
		ctrl = new ToDo(scope);
	});

	it('should init items', function() {
		expect(scope.items).toBeDefined();
		expect(scope.items.length).toBeGreaterThan(1);
	});


	describe('add', function() {
		it('should add new task', function() {
			scope.items = [];
			scope.newText = 'FAKE TASK';
			scope.add();

			expect(scope.items.length).toBe(1);
			expect(scope.items[0].done).toBe(false);
			expect(scope.items[0].text).toBe('FAKE TASK');
		});


		it('should reset newText', function() {
			scope.newText = 'SOME TEXT';
			scope.add();

			expect(scope.newText).toBe('');
		});
	});


	describe('remaining', function() {

		it('should return number of tasks that are not done', function() {
			scope.items = [{done: false}, {done: false}, {done: false}, {done: false}];
			expect(scope.remaining()).toBe(4);

			scope.items[0].done = true;
			expect(scope.remaining()).toBe(3);
		});
	});


	describe('archive', function() {

		it('should remove tasks that are done', function() {
			scope.items = [{id: 1, done: true}, {id: 2, done: false}, {id: 3, done: true}];
			scope.archive();

			expect(scope.items.length).toBe(1);
			expect(scope.items[0].id).toBe(2);
		});
	});
});
