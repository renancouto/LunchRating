var fs = require('fs'),
	_ = require('./underscore-min'),

	paths = {
		content: '../content/view/',
		markup: '../markup/',
		result: '../../public/'
	},

	cache = {},
	date = Date.now(),

Log = function(msg, addTime) {
	console.log(addTime ? msg + ' (' + (Date.now() - date) + 'ms)' : msg);
},

Build = function(data) {
	if (!data) {
		Log('Aborting automatic build: no data was passed.');
		return;
	}

	Log('Building started!');

	data = require(paths.content + data).data;

	Log('Building page: ' + data.view.url, true);
	fs.writeFile(paths.result + data.view.url, _.render(data.view.template.base, data));
	Log('Building of page "' + data.view.url + '" finished!', true);
};

_.mixin({
	load: function(file) {
		var contents;

		if (cache[file]) {
			Log('Getting: ' + file, true);
			contents = cache[file];
		}
		else {
			Log('Loading: ' + file, true);
			contents = fs.readFileSync(paths.markup + file, 'utf8');
			cache[file] = contents;
		}

		return contents;
	},

	render: function(file, data, context) {
		return _.template(_.load(file), data || {}, context || { variable: 'it' });
	}
});

Build(process.argv[2]);