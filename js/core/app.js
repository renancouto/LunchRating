LunchRating.config = {
	// Parse Settings
	appId: 'osVwHKqwPjF8cCwjIOPYVaV5lQVVLZADa4zVrQoy',
	jsKey: 'EjVkdcArfvUxLcVkHSDL07b3feSIS5XXClrBJt5h'
};

LunchRating.init = function Init () {
	Parse.initialize(LunchRating.config.appId, LunchRating.config.jsKey);
	this.userSetup();
};

LunchRating.userSetup = function UserSetup () {
	var apply = function Apply () {
		LunchRating.user = Parse.User.current();

		$('#username').html(LunchRating.user.attributes.username);
		$('#logout').on('click', function(){
			Parse.User.logOut();
		});
	},

	signUp = function signUpP (email, password) {
		Parse.User.signUp(email, password, { ACL: new Parse.ACL() }, {
			success: function(user) {
				console.log(user);
				// new ManageTodosView();
				// self.undelegateEvents();
				// delete self;
			},

			error: function(user, error) {
				console.log(user, error);
				// self.$(".signup-form .error").html(error.message).show();
				// this.$(".signup-form button").removeAttr("disabled");
			}
		});
	};

	// Check if user is logged
	if (Parse.User.current()) {
		apply();
	} else {
		// new LogInView();
	}
};