// App configuration
LunchRating.config = {

	// Parse settings
	appId: 'osVwHKqwPjF8cCwjIOPYVaV5lQVVLZADa4zVrQoy',
	jsKey: 'EjVkdcArfvUxLcVkHSDL07b3feSIS5XXClrBJt5h',

	// Template settings
	template: {
		path: 'markup.',
		prefix: 'template.',
		sulfix: ''
	}
};

// Data
LunchRating.data = { user: {}, meal: {}, rating: {} };

// App initializer
LunchRating.initialize = function() {
	LunchRating.helpers.underscore();

	Parse.$ = jQuery;
	Parse.initialize(LunchRating.config.appId, LunchRating.config.jsKey);

	LunchRating.router = new LunchRating.router();
	new LunchRating.view.main();

	Parse.history.start();
};

// Routes
LunchRating.router = Parse.Router.extend({
	routes: {
		completed: 'completed'
	},

	completed: function() {}
});

// Model
LunchRating.rating = Parse.Object.extend('Rating', {
	initialize: function() {
		_.bindAll(this, 'update');
		// this.bind('change', this.update);
	},

	update: function(feedback) {
		this.save(null, {
			success: function() { feedback({ status: 'success', msg: 'Dados enviados' }); }
		});
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
				LunchRating.view.ratingBuilder();
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
			_.bindAll(this, 'login', 'signup', 'success', 'feedback');
			this.render();
		},

		login: function(e) {
			e.preventDefault();

			var self = this,
				$form = $(e.currentTarget),
				data = _.formData($form);

			self.feedback($form, 'Logging in...', 'start');

			Parse.User.logIn(data.username, data.password, {
				success: function(user) { self.success(self); },
				error: function(user, error) { self.feedback($form, error.message, 'error'); }
			});
		},

		signup: function(e) {
			e.preventDefault();

			var self = this,
				$form = $(e.currentTarget),
				data = _.formData($form);

			self.feedback($form, 'Signing up...', 'start');

			Parse.User.signUp(data.username, data.password, { ACL: new Parse.ACL() }, {
				success: function(user) { self.success(self); },
				error: function(user, error) { self.feedback($form, error.message, 'error'); }
			});
		},

		feedback: function($form, msg, type) {
			var $feedback = $form.find('.feedback')
				.hide()
				.removeClass('error, success, start');

			if (!msg) return;

			$feedback
				.addClass(type)
				.show()
				.html(msg);
		},

		success: function(self) {
			LunchRating.content.reset();
			self.undelegateEvents();
			LunchRating.view.ratingBuilder();
		},

		render: function() {
			var content = _.render('asset/login-form.html');
				content += _.render('asset/signup-form.html');

			LunchRating.content.build(_.render('content/login.html'));
		}
	}),

	// Rating
	ratingBuilder: function() {
		var rating = new LunchRating.rating(),
			view = new LunchRating.view.rating({ model: rating });
	},

	rating: Parse.View.extend({
		events: {
			'change [name]': 'update'
		},

		el: '.structure-content',

		preloader: function() {
			return this.$el.find('.ui-preloader');
		},

		initialize: function() {
			var Meal = Parse.Object.extend('Meal'),
				meal = new Meal(),
				self = this,
				query = new Parse.Query(Meal);

			query.first({
				success: function(current) {
					LunchRating.data.meal = current;
					LunchRating.data.user = Parse.User.current();

					self.model.set({
						user: LunchRating.data.user,
						meal: current
					});

					self.render();
				},

				error: function(err) {
					console.error('Couldn\'t load meal data', err);
				}
			});

			_.bindAll(this, 'update', 'feedback', 'preloader');
		},

		update: function(e) {
			this.feedback({ status: 'start', msg: 'Enviando' });

			var $trigger = $(e.currentTarget),
				key = $trigger.attr('name'),
				val = $trigger.val(),
				checked = e.currentTarget.checked,
				arr, obj = {};

			// Convert to Array
			if (/\[]/.test(key)) {
				key = key.replace('[]', '');
				arr = this.model.get(key);

				if (arr) {
					if (checked) arr.push(val);
					else arr = _.without(arr, val);
					val = arr;
				}
				else if (checked) {
					val = [val];
				}

				obj[key] = val;
			}

			// Convert to object
			if (/\./.test(key)) {
				arr = key.split('.');
				key = arr[0];

				obj[key] = this.model.get(key) || {};
				obj[key][arr[1]] = val;
			}

			this.model.set(obj);
			this.model.update(this.feedback);

			if (key == 'aceitacao') $('#questions')[val == 'sim' ? 'fadeIn' : 'fadeOut']();
		},

		feedback: function(settings) {
			this.preloader()
				.stop()
				.hide()
				.attr('data-status', settings.status)
				.fadeIn()
				.find('.label')
					.html(settings.msg);

			if (settings.status != 'start') this.preloader().show().delay(2000).fadeOut();
		},

		render: function() {
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

// Helpers
LunchRating.helpers = {

	// Underscore extensions
	underscore: function() {

		_.mixin({

			// Load data and store on browser's localStorage for future requests
			load: function(file, noCache) {
				file += LunchRating.config.template.sulfix;

				// Convert dashes into points to bypass parse deploy on folders issue
				file = file.replace(/\//g, '.');

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
				var result = '', total;

				if (!list) return '';

				total = list.length;

				_.each(list, function(item, index){
					result += item;
					if (index == total - 2) result += ' e ';
					else if (index != total - 1) result += ', ';
				});

				return result;
			},

			// Replace special characters
			specialChars: function(str) {
				return str
					.toLowerCase()
					.replace(/[á|ã|â|à]/gi, 'a')
					.replace(/[é|ê|è]/gi, 'e')
					.replace(/[í|ì|î]/gi, 'i')
					.replace(/[õ|ò|ó|ô]/gi, 'o')
					.replace(/[ú|ù|û]/gi, 'u')
					.replace(/[ç]/gi, 'c')
					.replace(/[ñ]/gi, 'n')
					.replace(/[á|ã|â]/gi, 'a');
					// .replace(/\W/gi, '-');
			}
		});
	}
};

String.prototype.toProperCase = function () {
	return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};