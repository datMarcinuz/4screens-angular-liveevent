/// <reference path="iliveevent.ts" />

module Liveevent {
  export class Liveevent implements ILiveevent {
    enabled: boolean;
    title: string;

    activePage: Page.IPage;
    activeQuiz: Engageform.IEngageform;
    activePageId: string;
    activeQuizId: string;
    socket: SocketIOClient.Socket;
    EF: Engageform.IEngageform;
    chat: ChatModule.IChat;

    constructor() {
      console.log('[ Liveevent ] Constructor');
    }

    private updatePage(page) {
      console.log('[ Liveevent ] Update Page: ' + page._id);
      this.activePage = page;
      this.activePageId = page._id;
      this.EF['_engageform'].initPage(page); // ts compiler ..

      // Add liveSettings
      this.EF.current.liveSettings = <Page.ILiveSetting>page.liveSettings;

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
      this.EF['_engageform'].navigation.prev = ($event) => { return; };
      this.EF['_engageform'].navigation.next = ($event, vcase: Page.ICase) => { return; };
      this.EF['_engageform'].navigation.start = ($event) => { return; };
      this.EF['_engageform'].navigation.finish = ($event, vcase: Page.ICase) => { return; };
    }

    private updateQuiz(EF) {
      console.log('[ Liveevent ] Update Quiz: ' + EF._engageformId);
      this.activeQuiz = EF;
      this.activeQuizId = EF._engageformId;
    }

    // Init chat
    private initChat(id: string): ng.IPromise<any> {
      var deferred = Extension.$q.defer();

      if (!this.chat) {
        this.chat = new ChatModule.Chat(id);

        return this.chat.init();
      } else {
        // If it is already initialised (meaning it's available on this instance), return a fake promise that
        // is here just to make the API looks better.
        deferred.resolve();
        return deferred.promise;
      }
    }

    // Sockets
    private initSocket(opts: API.ILiveEmbed) {
      console.log('[ Liveevent ] Init socket');
      var url = Extension.config.backend.socket + Extension.config.liveEvent.socketNamespace;
      url = url.replace(':liveEventId', opts.id);
      this.socket = Extension.io.connect(url, { 'force new connection': true });

      this.socket.on('connect', () => {
        console.log('[ Liveevent:Socket ] Connected');
        this.socket.emit('getStatus', { liveEventId: opts.id });
      });

      this.socket.on('disconnect', this.initSocket);

      this.socket.on('error', (res) => {
        console.warn(res);
      });

      this.socket.on('liveEventStatus', (data) => {
        if (data.activeQuestionId !== this.activePageId || data.activeQuizId !== this.activeQuizId) {
          // Quiz changed
          if (data.activeQuizId !== this.activeQuizId) {
            console.log('[ Liveevent:Socket ] Quiz changed');
            // return Engageform.Engageform.getById(data.activeQuizId).then((quizData) => {
            //   this.updateQuiz(quizData);
            // });

            this.EF.init({ id: data.activeQuizId, mode: 'default' }).then((res) => {
              this.updateQuiz(res);
              // Update Page
              this.getPageById(data.activeQuestionId).then((page) => {
                this.updatePage(page);
              });
            });
          } else {
            // Only Page changed
            console.log('[ Liveevent:Socket ] Only Page changed');
            this.getPageById(data.activeQuestionId).then((page) => {
              this.updatePage(page);
            });
          }
        }
      });
    }

    // Get Liveevent
    getById(id: string): ng.IPromise<ILiveeventResponse> {
      var url = Extension.config.backend.domain + Extension.config.liveEvent.liveEventUrl;
      url = url.replace(':liveEventId', id);

      // TODO: Get quiz and current question
      return Extension.$http.get(url).then((res) => {
        if ([200, 304].indexOf(res.status) !== -1) {
          return res.data;
        }

        return Extension.$q.reject(res);
      });
    }

    // Get Page
    private getPageById(questionId: string) {
      var url = Extension.config.backend.domain + Extension.config.liveEvent.activeQuestion;
      url = url.replace(':questionId', questionId);

      return Extension.$http.get(url).then(function(res) {

        if ([200, 304].indexOf(res.status) !== -1) {
          console.log('[ Liveevent ] Get PAGE: ' + res.data['_id']);
          return res.data;
        }

          this.$q.reject(res);
      });
    }

    init(opts: API.ILiveEmbed) {
      console.log('[ Liveevent ] Init: ' + opts.id);
      var deferred = Extension.$q.defer();

      this.EF = opts.engageform;

      // Get Liveevent
      this.getById(opts.id).then((res) => {

        // Init socket
        this.initSocket(opts);

        // Init chat
        this.initChat(res.chatId).then(() => {
          // Resolve the general promise when chat will be available.
          deferred.resolve(this);
        });
      });

      return deferred.promise;
    }
  }
}
