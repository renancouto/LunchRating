LunchRating.config = {
	// Parse Settings
	appId: 'osVwHKqwPjF8cCwjIOPYVaV5lQVVLZADa4zVrQoy',
	jsKey: 'EjVkdcArfvUxLcVkHSDL07b3feSIS5XXClrBJt5h'
};

LunchRating.init = function initF () {
	Parse.initialize(LunchRating.config.appId, LunchRating.config.jsKey);
	this.userSetup();
};

LunchRating.userSetup = function UserSetup () {
	var apply = function applyF () {
		LunchRating.user = Parse.User.current();

		$('#username')
			.show()
			.find('.name')
				.html(LunchRating.user.attributes.username);

		$('#logout').on('click', function(){
			Parse.User.logOut();
		});
	},

	signUp = function signUpF (email, password) {
		Parse.User.signUp(email, password, { ACL: new Parse.ACL() }, {
			success: function(user) {
				console.log(user);
			},

			error: function(user, error) {
				console.error(user, error);
			}
		});
	},

	logIn = function logInF (email, password) {
		Parse.User.logIn(email, password, {
			success: function(user) {
				console.log(user);
			},

			error: function(user, error) {
				console.error(user, error);
			}
		});
	};

	$('#login-form').on('submit', function(e){
		e.preventDefault();
		var $this = $(this),
			$input = $this.find('input');

		logIn($input.filter('[name=email]').val(), $input.filter('[name=password]').val());
	});

	// Check if user is logged
	if (Parse.User.current()) {
		apply();
	} else {
		// new LogInView();
	}
};