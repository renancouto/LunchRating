var $ = require('../config/helpers');

exports.data = {
	"app": $.Partial('../config/app'),

	"view": {
		"title": "Lunch Rating - Avalie seu almoço",
		"description": "Avalie a qualidade do seu almoço",

		"source": {
			"css": ["base.css"],

			"js": {
				"head": {
					"base": "script/top.html",
					"custom": []
				},

				"body": {
					"base": "",
					"custom": []
				},

				"jquery": "1.9.1",
				"parse": "1.2.7"
			}
		},

		"template": {
			"base": "template/_.html"
		},

		"url": "index.html"
	},

	"content": {
		"heading": "Lunch Rating"
	}
};