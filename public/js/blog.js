var blogApp = angular.module("blogApp", ["ngRoute", "hc.marked", "angularFileUpload", "xeditable"]);

blogApp.controller('MainController', ['$scope', '$rootScope', '$route', '$routeParams', '$location', "$window", "$http", "userService",
function($scope, $rootScope, $route, $routeParams, $location, $window, $http, userService) {
	$scope.$route = $route;
	$scope.$location = $location;
	$scope.$routeParams = $routeParams;
	$scope.userService = userService;

	$scope.logout = function() {
		userService.logout();
	};
	
	$scope.load = function(path) {
		$window.location.href = path;
	};
	
	$scope.sync = function() {
		$http.get("/sync").then(function(res) {
			console.log(res);
			if(res.data)
				for(var i = 0; i < res.data.length; i++) {
					$rootScope.$root.allPosts.push(res.data[i]);
				}
		}, function(err) {
			console.log(err)
		});
	};
}]);


blogApp.controller("PostsController", ["$scope", "$rootScope", "$http", "$location", "$routeParams", "util", "shareDataService", "userService",
function($scope, $rootScope, $http, $location, $routeParams, util, shareDataService, userService) {
	$scope.posts = $rootScope.$root.allPosts;
	$scope.editable = userService.isLoggedIn();
	$scope.enableEdit = function(post) {
		post.editable = $scope.editable && true;
	};
console.log("---")
	$scope.disableEdit = function(post) {
		post.editable = false;
	};

	$scope.onDelete = function(post) {
		if ($scope.editable) {
			$http.delete("/posts/" + post.id).then(function(res) {
				util.deleteFromArray($scope.posts, post);
			}, function(error) {
				console.error(error);
			});
		}
	};

	$scope.onEdit = function(post, newPath) {
		shareDataService.set(post);
		$location.path(newPath);
	};

	var filter = function(allPosts, tag) {
		var posts = [];
		for (var j = 0; j < allPosts.length; j++) {
			var post = allPosts[j];
			if (post.tag && post.tag.indexOf(tag) >= 0) {
				posts.push(post);
			}
		}
		return posts;
	};

	if (!$rootScope.$root.allPosts || $rootScope.$root.allPosts.length == 0) {
		$http.get("/posts").then(function(res) {
			$scope.posts = $rootScope.$root.allPosts = res.data;
			if ($routeParams.tag) {
				$scope.posts = filter($scope.allPosts, $routeParams.tag);
			}
		}, function(error) {
			console.err(error);
		});
	} else {
		if ($routeParams.tag) {
			$scope.posts = filter($scope.allPosts, $routeParams.tag);
		}
	}
}]);

blogApp.controller("PostController", ["$scope", "$http", "$routeParams", "userService", "util",
function($scope, $http, $routeParams, userService, util) {
	$scope.id = $routeParams.id;
	$scope.editable = userService.isLoggedIn();
	$http.get("/posts/" + $scope.id).then(function(res) {
		$scope.post = res.data;
	}, function(error) {
		console.err(error);
	});
	
	$scope.newComment = "";
	$scope.name = "";
	$scope.email = "";
	
	$scope.addComment = function() {
		var comment = $scope.newComment.trim();
		var name = $scope.name.trim();
		var email = $scope.email.trim();
		if(comment !== "") {
			$http.post("/posts/"+$scope.post.id+"/comment", {
				comment: comment,
				user: name,
				email: email
			}).then(function(res) {
				if(!$scope.post.comments)
					$scope.post.comments = [];
				$scope.post.comments.push(res.data);
			}, function(error) {
				console.log(error);
			});
		}
		console.log($scope.newComment);
	};
	
	$scope.enableEdit = function(comment) {
		comment.editable = $scope.editable && true;;
	};
	
	$scope.disableEdit = function(comment) {
		comment.editable = false;
	};
	
	$scope.onDelete = function(comment) {
		if($scope.editable) {
			$http.delete("/posts/" + $scope.id+"/comment/"+comment.id).then(function(res) {
				util.deleteFromArrayById($scope.post.comments, res.data.id);
			}, function(error) {
				console.log(error);
			});
		}
	};
}]);

blogApp.controller("EditPostController", ["$scope", "$controller", "$http", "shareDataService",
function($scope, $controller, $http, shareDataService) {
	$controller('NewPostController', {
		$scope : $scope
	});
	$scope.post = shareDataService.get() || {};
	var post = $scope.post;
	$scope.submit = function() {
		if ($scope.uploader.queue.length > 0) {
			var item = $scope.uploader.queue[0];
			item.formData.push(post);
			item.upload();
		} else {
			$http.put("/posts/" + $scope.post.id, $scope.post).then(function(res) {
				console.log(res);
			}, function(err) {
				console.error(err);
			});
		}
	};
}]);

blogApp.controller("NewPostController", ["$scope", "$http", "FileUploader", "util",
function($scope, $http, FileUploader, util) {
	$scope.uploader = new FileUploader({
		url : "posts"
	});

	$scope.uploader.onAfterAddingFile = function(item) {
		$scope.post = util.getPostFromFile(item.file);
	};

	$scope.post = {};

	$scope.submit = function() {
		if ($scope.uploader.queue.length > 0) {
			var item = $scope.uploader.queue[0];
			item.formData.push($scope.post);
			item.upload();
		};
	};
}]);

blogApp.controller('CalculatorController', ["$scope", function($scope) {
  $scope.z = 0;
  $scope.sum = function() {
    $scope.z = $scope.x + $scope.y;
  };
}]);

blogApp.controller('LoginController', ["$scope", "$http", "$location", "$window", 
function($scope, $http, $location, $window) {
	$scope.login = function(newPath) {
		$http.post('/login', {
			username : $scope.username,
			password : $scope.password
		}).then(function(ret) {
			$window.sessionStorage["user"] = JSON.stringify(ret.data);
			$location.path(newPath);
		}, function(err) {
			console.log(err);
		});
	};
}]);

blogApp.controller('TagController', ["$scope", "$rootScope", "$http", "shareDataService",
function($scope, $rootScope, $http, shareDataService) {
	$scope.leftHalf = [];
	$scope.rightHalf = [];

	$scope.showPosts = function(tagName) {
		$rootScope.$broadcast('tagSelected', $scope.tags[tagName].posts);
	};

	$http.get('/posts/tags').then(function(res) {
		var data = $scope.tags = res.data;
		var index = 0;
		for (var tagName in data) {
			var tag = data[tagName];
			tag.name = tagName;
			if (index % 2 == 0)
				$scope.leftHalf.push(tag);
			else
				$scope.rightHalf.push(tag);
			index++;
		}
	}, function(err) {
		console.log(err);
	});
}]);

blogApp.config(['$routeProvider', 'markedProvider',
function($routeProvider, markedProvider) {
	$routeProvider.when('/posts', {
		templateUrl : 'posts.html',
		controller : 'PostsController'
	}).when('/post/:id', {
		templateUrl : 'post.html',
		controller : 'PostController'
	}).when('/new', {
		templateUrl : 'newPost.html',
		controller : 'NewPostController'
	}).when('/edit', {
		templateUrl : 'newPost.html',
		controller : 'EditPostController'
	}).when('/login', {
		templateUrl : 'login.html',
		controller : 'LoginController'
	}).when('/about', {
		templateUrl: 'about.html'
	}).otherwise({
		redirectTo : '/posts'
	});
	markedProvider.setOptions({
		gfm : true
	});
}]);

blogApp.factory('util', [
function() {
	var obj = {};
	obj.deleteFromArray = function(array, item) {
		var index = array.indexOf(item);
		array.splice(index, 1);
		return array;
	};
	
	obj.deleteFromArrayById = function(array, id) {
		for(var i = 0; i < array.length; i++) {
			var item = array[i];
			if(item.id && item.id === id) {
				array.splice(i, 1);
				return array;
			}
		}
	};

	obj.getPostFromFile = function(file) {
		var name = file.name;
		var index = name.lastIndexOf(".");
		var post = {
			title : name
		};
		if (index > 0) {
			post.title = name.substr(0, index);
			post.type = name.substr(index + 1, name.length);
		}
		return post;
	};
	return obj;
}]);

blogApp.factory('shareDataService', function() {
	var savedData = {};
	function set(data) {
		savedData = data;
	}

	function get() {
		return savedData;
	}

	return {
		set : set,
		get : get
	};

});

blogApp.factory('userService', ["$window",
function($window) {
	function isLoggedIn() {
		return $window.sessionStorage["user"] !== undefined;
	};
	var sdo = {
		isLoggedIn : isLoggedIn,
		logout: function() {
			delete $window.sessionStorage["user"];
		},
		getUsername : function() {
			return isLoggedIn() ? JSON.parse($window.sessionStorage["user"]).username : undefined;;
		}
	};
	return sdo;
}]);
