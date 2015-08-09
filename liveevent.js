/// <reference path="../typings/tsd.d.ts" />
var app = angular.module('4screens.liveevent', ['LocalStorageModule']);

/// <reference path="iliveevent.ts" />
var Liveevent;
(function (Liveevent_1) {
    var Liveevent = (function () {
        function Liveevent() {
            console.log('[ Liveevent ] Constructor');
        }
        Liveevent.prototype.updatePage = function (page) {
            console.log('[ Liveevent ] Update Page: ' + page._id);
            var __type = this.activePage ? (this.activePage.type + '') : null;
            // Check if form and if so, send all inputs
            if (__type && __type.indexOf('form') > -1) {
                this.EF['_engageform'].navigation.pick();
            }
            this.activePage = page;
            this.activePageId = page._id;
            this.EF['_engageform'].initPage(page); // ts compiler ..
            // Add liveSettings
            this.EF.current.liveSettings = page.liveSettings;
            // Overwrite navigation
            this.EF['_engageform'].navigation.enabled = false;
            this.EF['_engageform'].navigation.position = 0;
            this.EF['_engageform'].navigation.size = 1;
            this.EF['_engageform'].navigation.hasStart = false;
            this.EF['_engageform'].navigation.enabledStart = false;
            this.EF['_engageform'].navigation.hasPrev = false;
            this.EF['_engageform'].navigation.enabledPrev = false;
            this.EF['_engageform'].navigation.hasNext = false;
            this.EF['_engageform'].navigation.enabledNext = false;
            this.EF['_engageform'].navigation.hasFinish = false;
            this.EF['_engageform'].navigation.enabledFinish = false;
            this.EF['_engageform'].navigation.distance = 0;
            this.EF['_engageform'].navigation.prev = function ($event) { return; };
            this.EF['_engageform'].navigation.next = function ($event, vcase) { return; };
            this.EF['_engageform'].navigation.start = function ($event) { return; };
            this.EF['_engageform'].navigation.finish = function ($event, vcase) { return; };
        };
        Liveevent.prototype.updateQuiz = function (EF) {
            console.log('[ Liveevent ] Update Quiz: ' + EF._engageformId);
            this.activeQuiz = EF;
            this.activeQuizId = EF._engageformId;
        };
        // Init chat
        Liveevent.prototype.initChat = function (id) {
            var deferred = Extension.$q.defer();
            if (!this.chat) {
                this.chat = new ChatModule.Chat(id);
                return this.chat.init();
            }
            else {
                // If it is already initialised (meaning it's available on this instance), return a fake promise that
                // is here just to make the API looks better.
                deferred.resolve();
                return deferred.promise;
            }
        };
        // Sockets
        Liveevent.prototype.initSocket = function (opts) {
            var _this = this;
            console.log('[ Liveevent ] Init socket');
            var url = Extension.config.backend.socket + Extension.config.liveEvent.socketNamespace;
            url = url.replace(':liveEventId', opts.id);
            this.socket = Extension.io.connect(url, { 'force new connection': true });
            this.socket.on('connect', function () {
                console.log('[ Liveevent:Socket ] Connected');
                _this.socket.emit('getStatus', { liveEventId: opts.id });
            });
            this.socket.on('disconnect', this.initSocket);
            this.socket.on('error', function (res) {
                console.warn(res);
            });
            this.socket.on('liveEventStatus', function (data) {
                if (data.activeQuestionId !== _this.activePageId || data.activeQuizId !== _this.activeQuizId) {
                    // Quiz changed
                    if (data.activeQuizId !== _this.activeQuizId) {
                        console.log('[ Liveevent:Socket ] Quiz changed');
                        // return Engageform.Engageform.getById(data.activeQuizId).then((quizData) => {
                        //   this.updateQuiz(quizData);
                        // });
                        _this.EF.init({ id: data.activeQuizId, mode: 'default' }).then(function (res) {
                            _this.updateQuiz(res);
                            // Update Page
                            _this.getPageById(data.activeQuestionId).then(function (page) {
                                _this.updatePage(page);
                            });
                        });
                    }
                    else {
                        // Only Page changed
                        console.log('[ Liveevent:Socket ] Only Page changed');
                        _this.getPageById(data.activeQuestionId).then(function (page) {
                            _this.updatePage(page);
                        });
                    }
                }
            });
        };
        // Get Liveevent
        Liveevent.prototype.getById = function (id) {
            var url = Extension.config.backend.domain + Extension.config.liveEvent.liveEventUrl;
            url = url.replace(':liveEventId', id);
            // TODO: Get quiz and current question
            return Extension.$http.get(url).then(function (res) {
                if ([200, 304].indexOf(res.status) !== -1) {
                    return res.data;
                }
                return Extension.$q.reject(res);
            });
        };
        // Get Page
        Liveevent.prototype.getPageById = function (questionId) {
            var url = Extension.config.backend.domain + Extension.config.liveEvent.activeQuestion;
            url = url.replace(':questionId', questionId);
            return Extension.$http.get(url).then(function (res) {
                if ([200, 304].indexOf(res.status) !== -1) {
                    console.log('[ Liveevent ] Get PAGE: ' + res.data['_id']);
                    return res.data;
                }
                this.$q.reject(res);
            });
        };
        Liveevent.prototype.init = function (opts) {
            var _this = this;
            console.log('[ Liveevent ] Init: ' + opts.id);
            var deferred = Extension.$q.defer();
            this.EF = opts.engageform;
            // Get Liveevent
            this.getById(opts.id).then(function (res) {
                // Init socket
                _this.initSocket(opts);
                // Init chat
                _this.initChat(res.chatId).then(function () {
                    // Resolve the general promise when chat will be available.
                    deferred.resolve(_this);
                });
            });
            return deferred.promise;
        };
        return Liveevent;
    })();
    Liveevent_1.Liveevent = Liveevent;
})(Liveevent || (Liveevent = {}));

/// <reference path="ichat.ts" />
var ChatModule;
(function (ChatModule) {
    var Chat = (function () {
        function Chat(id) {
            this.messages = [];
            console.log('[ Chat ] Constructor');
            this.id = id;
            return this;
        }
        Chat.prototype.login = function (data, dataMe) {
            this.user = {
                accessToken: data.accessToken,
                user: data.userID,
                userLink: dataMe.link,
                userName: dataMe.name,
                userID: data.userID
            };
        };
        Chat.prototype.logout = function () {
            this.user = null;
        };
        Chat.prototype.updateChat = function (data) {
            console.log('[ Chat ] Update chat');
            this.id = data.id;
            this.name = data.name;
            this.premoderated = data.premoderated;
            // Get some old msgs
            this.getMsgs();
        };
        Chat.prototype.sendMsg = function (m) {
            console.log('[ Chat ] Posting msg');
            if (!this.user)
                return;
            var url = Extension.config.backend.domain + Extension.config.chat.sendUrl, msg;
            url = url.replace(':chatId', this.id);
            msg = {
                accessToken: this.user.accessToken,
                date: Date.now(),
                hidden: false,
                id: this.user.userId,
                msg: m,
                user: this.user.user,
                userLink: this.user.userLink,
                userName: this.user.userName
            };
            return Extension.$http.post(url, msg);
        };
        Chat.prototype.getMsgs = function () {
            var _this = this;
            console.log('[ Chat ] Get old msgs');
            var url = Extension.config.backend.domain + Extension.config.chat.messagesUrl;
            url = url.replace(':chatId', this.id);
            return Extension.$http.get(url).then(function (res) {
                //console.log('[ Chat ] Got ' + res.data.length + ' msgs');
                _this.messages = res.data;
            });
        };
        Chat.prototype.initSocket = function () {
            var _this = this;
            console.log('[ Chat:Socket ] Init socket');
            var url = Extension.config.backend.socket;
            this.socket = Extension.io.connect(url, { 'force new connection': true });
            this.socket.on('error', function (res) {
                console.warn(res);
            });
            this.socket.on('connect', function (data) {
                console.log('[ Chat:Socket ] Connected');
                // Join room
                _this.socket.emit('joinRoom', _this.id);
                // We can also leave room, to do so just emit 'leaveRoom' with roomId as param
            });
            // New msg event
            this.socket.on('msg', function (data) {
                console.log('[ Chat:Socket ] New msg');
                Extension.$rootScope.$apply(function () {
                    _this.messages.unshift(data);
                });
            });
            this.socket.on('msgHide', function (id) {
                console.log('[ Chat:Socket] Hide msg');
                var messageIndex = _this.messages.length;
                for (var i = 0; i < _this.messages.length; i += 1) {
                    if (_this.messages[i].id === id) {
                        messageIndex = i;
                    }
                }
                Extension.$rootScope.$apply(function () {
                    _this.messages.splice(messageIndex, 1);
                });
            });
            // On disconect
            this.socket.on('disconnect', this.initSocket);
        };
        Chat.prototype.init = function () {
            var _this = this;
            console.log('[ Chat ] Init: ' + this.id);
            // Get chat details
            var url = Extension.config.backend.domain + Extension.config.chat.detailUrl;
            url = url.replace(':chatId', this.id);
            return Extension.$http.get(url).then(function (res) {
                _this.updateChat(res.data);
                _this.initSocket();
                return res;
            });
        };
        return Chat;
    })();
    ChatModule.Chat = Chat;
})(ChatModule || (ChatModule = {}));

/// <reference path="api/api.ts" />
/// <reference path="liveevent/liveevent.ts" />
/// <reference path="chat/chat.ts" />
var Extension = (function () {
    function Extension($http, $q, localStorage, $rootScope, ApiConfig) {
        Extension.$http = $http;
        Extension.$q = $q;
        Extension.localStorage = localStorage;
        Extension.config = ApiConfig;
        Extension.$rootScope = $rootScope;
    }
    Extension.prototype.init = function (opts) {
        Extension.io = opts.io;
        var liveevent = new Liveevent.Liveevent;
        return liveevent.init(opts);
    };
    return Extension;
})();
Extension.$inject = ['$http', '$q', 'localStorageService', '$rootScope', 'ApiConfig'];
app.service('Liveevent', Extension);

/// <reference path="api/iembed.ts" />
/// <reference path="api/iquizquestion.ts" />
/// <reference path="api/iquizquestionsres.ts" />
/// <reference path="api/iquizquestionanswer.ts" />
/// <reference path="api/iquizquestionanswerres.ts" />
/// <reference path="api/iquiz.ts" />
/// <reference path="api/iquizres.ts" />
/// <reference path="api/iquizfinish.ts" />
/// <reference path="api/iquizfinishres.ts" />
/// <reference path="page/enum.ts" />
/// <reference path="page/icase.ts" />
/// <reference path="page/ipage.ts" />
/// <reference path="page/ipages.ts" />
/// <reference path="page/ipagesent.ts" />
/// <reference path="page/isettings.ts" />
/// <reference path="engageform/enum.ts" />
/// <reference path="engageform/iengageform.ts" />
/// <reference path="engageform/isettings.ts" />
/// <reference path="engageform/itheme.ts" />
/// <reference path="branding/ibranding.ts" />
/// <reference path="navigation/inavigation.ts" /> 

//# sourceMappingURL=liveevent.js.map