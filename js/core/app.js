// App configuration
LunchRating.config = {

	// Parse settings
	appId: 'osVwHKqwPjF8cCwjIOPYVaV5lQVVLZADa4zVrQoy',
	jsKey: 'EjVkdcArfvUxLcVkHSDL07b3feSIS5XXClrBJt5h',

	// Template settings
	template: {
		path: 'markup/',
		prefix: 'template.',
		sulfix: ''
	}
};

// Data
LunchRating.data = { user: {}, menu: {} };

// App initializer
LunchRating.initialize = function() {
	LunchRating.helpers.underscore();

	Parse.$ = jQuery;
	Parse.initialize(LunchRating.config.appId, LunchRating.config.jsKey);

	new LunchRating.router();
	new LunchRating.view.main();

	Parse.history.start();

	// var TestObject = Parse.Object.extend("TestObject");
	// var testObject = new TestObject();
	// testObject.save({foos: "bars"});
};

// Routes
LunchRating.router = Parse.Router.extend({
	routes: {
		completed: 'completed'
	},

	completed: function() {

	}
});

// Views
LunchRating.view = {

	// Main
	main: Parse.View.extend({
		el: $('#lunch-rating'),

		initialize: function() {
			this.render();
		},

		render: function() {
			if (Parse.User.current()) {
				new LunchRating.view.rating();
			} else {
				new LunchRating.view.login();
			}
		}
	}),

	// Login
	login: Parse.View.extend({
		events: {
			'submit #login-form': 'login',
			'submit #signup-form': 'signup'
		},

		el: '.structure-content',

		initialize: function() {
			_.bindAll(this, 'login', 'signup', 'success');
			this.render();
		},

		login: function(e) {
			e.preventDefault();

			var self = this,
				data = _.formData($(e.currentTarget));

			Parse.User.logIn(data.username, data.password, {
				success: function(user) { self.success(self); },
				error: function(user, error) {
					console.error(user, error);
					// feedback($loginForm, 'Combinação de login/senha incorretos');
				}
			});
		},

		signup: function(e) {
			e.preventDefault();

			var self = this,
				data = _.formData($(e.currentTarget));

			Parse.User.signUp(data.username, data.password, { ACL: new Parse.ACL() }, {
				success: function(user) { self.success(self); },
				error: function(user, error) {
					console.error(user, error);
				}
			});
		},

		success: function(self) {
			new LunchRating.view.rating();
			self.undelegateEvents();
		},

		render: function() {
			var content = _.render('asset/login-form.html');
				content += _.render('asset/signup-form.html');

			LunchRating.content.build(_.render('content/login.html'));
		}
	}),

	// Rating
	rating: Parse.View.extend({
		// events: {},

		// el: '',

		initialize: function() {
			var Menu = Parse.Object.extend('Menu'),
				menu = new Menu(),
				self = this;

			menu.fetch().then(function(){
				LunchRating.data.menu = menu.attributes.results;
				LunchRating.data.user = Parse.User.current().attributes;
				self.render();
			});
		},

		render: function() {
			LunchRating.content.reset();
			LunchRating.content.build(_.render('content/rating.html', LunchRating.data, true));
		}
	})
};

// Display template results
LunchRating.content = {
	$el: $('.structure-content'),

	build: function(content) {
		this.$el
			.removeClass('loading')
			.hide()
			.html(content)
			.fadeIn();
	},

	reset: function() {
		this.$el
			.html('')
			.addClass('loading');
	}
};

LunchRating.userSetup = function() {
	var apply = function() {
		LunchRating.user = Parse.User.current();

		$('#username')
			.show()
			.find('.name')
				.html(LunchRating.user.attributes.username.split('@')[0]);

		$('#logout').on('click', function(){
			Parse.User.logOut();
		});
	},

	signUp = function(email, password) {
		Parse.User.signUp(email, password, { ACL: new Parse.ACL() }, {
			success: function(user) {
				console.log(user);
			},

			error: function(user, error) {
				console.error(user, error);
			}
		});
	},

	logIn = function(email, password) {
		Parse.User.logIn(email, password, {
			success: function(user) {
				// console.log(user);
				apply();
			},

			error: function(user, error) {
				// console.error(user, error);
				feedback($loginForm, 'Combinação de login/senha incorretos');
			}
		});
	},

	feedback = function($el, msg) {
		var $feedback = $el.find('.feedback').hide();

		if (!msg) return;

		$feedback
			.addClass('error')
			.show()
			.html(msg);
	},

	$loginForm = $('#login-form').on('submit', function(e){
		e.preventDefault();
		var $this = $(this),
			$input = $this.find('input');

		feedback($this);
		logIn($input.filter('[name=email]').val(), $input.filter('[name=password]').val());
	});

	// Check if user is logged
	if (Parse.User.current()) {
		apply();
	} else {
		// new LogInView();
	}
};

// Helpers
LunchRating.helpers = {

	// Underscore extensions
	underscore: function() {

		_.mixin({

			// Load data and store on browser's localStorage for future requests
			load: function(file, noCache) {
				file += LunchRating.config.template.sulfix;

				// Recover data stored on the browser
				var template = noCache ? '' : localStorage.getItem(LunchRating.config.template.prefix + file);

				// If no data is stored, then load it synchronously
				if (!template) {
					$.ajax(LunchRating.config.template.path + file, {
						async: false,

						error: function(a, b, c) {
							console.error('Template loading error', a, b, c);
						},

						success: function(data) {
							template = data;
							localStorage.setItem(LunchRating.config.template.prefix + file, template);
						}
					});
				}

				// Return the template data
				return template;
			},

			// Load and render data
			render: function(file, data, noCache, context) {
				return _.template(_.load(file, noCache), data || {}, context || { variable: 'it' });
			},

			// Turns form data into an object (depends on jQuery's serializeArray)
			formData: function($form) {
				return _.reduce($form.serializeArray(),
					function(result, orgin) {
						result[orgin.name] = orgin.value;
						return result;
					},
				{});
			},

			// Print an array list to string, separated by commas also with and in the last item
			printArray: function(list) {
				var result = '',
					total = list.length;

				_.each(list, function(item, index){
					result += item;
					if (index == total - 2) result += ' e ';
					else if (index != total - 1) result += ', ';
				});

				return result;
			}
		});
	}
};

String.prototype.toProperCase = function () {
	return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};