
/*
    Copyright (c) 2013-2014 by Olivier Houle (Fungus)
    Please do not copy or modify without my permission.
*/
 
SockJS.prototype.msg = function(a){this.send(JSON.stringify(a))};
Array.prototype.isArray = true;
var tastyPlugShutDown;
if (typeof tastyPlugShutDown != 'undefined') tastyPlugShutDown();
(function(){
    var sock, afktime = Date.now(), pms = false, drag = false, hidevideo = false, joincd = false, cd = false,
    version = '1.3.2.9', commands = {}, tos = {}, boothcd = false, reconnect = true, inRoom = [], hover = false,
    room = location.pathname, lastchat,
    emotes = {}, sounds = ['default','pin','meow','robot','lolping','lolbutton','skype','inception','ding','hardkick','custom'],
    settings = {
        show: true,
        autowoot: false,
        autojoin: false,
        chatmentions: false,
        joinnotifs: {toggle:false,ranks:false,friends:false},
        joinmode: 1,
        msgs: [],
        lastPM: null,
        uipos: {'top':'54px','left':'0'},
        fullscreen: false,
        boothalert: false,
        boothnotify: 3,
        histalert: false,
        chatimgs: false,
        emotes: false,
        hidden: false,
        mention: 0,
        customsound: ''
    };
    function socket() {
        sock = new SockJS('https://fungustime.pw:4957');
        sock.onopen = function() {
            reconint = 2;
            console.log('[TastyPlug v' + version + '] Connected to socket!');
            return sock.msg({z:'userjoin',a:API.getUser(),r:location.pathname});
        };
        sock.onmessage = function(data) {
            data = JSON.parse(data.data);
            switch (data.z) {
                case 'cmderr':
                    return Chat('error', data.e);
                case 'clientmsg':
                    return Chat('info', data.a);
                case 'pm':
                    settings.lastPM = data.user.username;
                    chatSound();
                    ChatPM(data.user.username, data.m);
                    return;
                case 'reload':
                    return commands.reset();
                default:
                    console.log('[TastyPlug v' + version + '] Unknown socket command');
            }
        };
        sock.onclose = function() {
            console.log('[TastyPlug v' + version + '] Disconnected from socket!');
            if (reconnect) tos.reconnect = setTimeout(function(){
                if (sock && sock.readyState == 3) socket();
            },128000);
        };
    }
    function startup() {
        loadSettings();
        loadUI();
        loadEvents();
        loadEmotes();
        tos.roomcheck = setInterval(function(){
            if (location.pathname != room) {
                clearInterval(tos.roomcheck);
                a = function(){
                    if ($('#room-loader').length) setTimeout(a,200);
                    else $.getScript('https://fungustime.pw/tastyplug/tastyplug.js');
                };
                a();
            }
        },200);
        if (room != '/tastycat') {
            $('#tp-afkalert').remove();
        } else eta();
        if (settings.autowoot) woot();
        if (settings.autojoin) {
            afkCheck();
            if (!getLocked() && API.getWaitListPosition() == -1 && API.getDJ() && API.getDJ().id != API.getUser().id) join();
        }
        var users = API.getUsers();
        for (var i = 0; i < users.length; i++) inRoom.push(users[i].id);
        if (room == '/tastycat') socket();
        Chat('init', 'TastyPlug v' + version + ' now running!<br>Type /commands for a list of commands.');
        console.log('[TastyPlug v' + version + '] Now running.');
    }
    function loadSettings() {
        var a = JSON.parse(localStorage.getItem('tastyPlugSettings'));
        if (a) {
            for (var i in settings) {
                if (typeof a[i] != 'undefined') {
                    if (a[i] !== null && a[i].isArray && settings[i] !== null && settings[i].isArray) settings[i] = a[i];
                    else if (typeof settings[i] == 'object' && settings[i] !== null) {
                        var j = undefined;
                        for (j in settings[i]) {
                            if (typeof a[i][j] != 'undefined') settings[i][j] = a[i][j];
                        }
                        if (typeof j == 'undefined') settings[i] = a[i];
                    } else settings[i] = a[i];
                }
            }
        }
    }
    function loadUI() {
        $('head').append('<style type="text/css" id="tastyplug-css">#tastyplug-ui{-moz-user-select:none;-webkit-user-select:none;position:absolute;width:150px;border-radius:10px;background-color:#1c1f25;background-image:-webkit-gradient(linear,left bottom,left top,color-stop(0,#1c1f25),color-stop(1,#282d33));background-image:-o-linear-gradient(top,#1c1f25 0,#282d33 100%);background-image:-moz-linear-gradient(top,#1c1f25 0,#282d33 100%);background-image:-webkit-linear-gradient(top,#1c1f25 0,#282d33 100%);background-image:-ms-linear-gradient(top,#1c1f25 0,#282d33 100%);background-image:linear-gradient(to top,#1c1f25 0,#282d33 100%);z-index:9;padding-bottom:1.5px;color:#DDD}#tastyplug-ui a{color:inherit;text-decoration:none}.tastyplug-icon{position:relative;float:right}#tastyplug-ui .tp-toggle{color:#f04f30}#tastyplug-ui .tp-toggle.button-on{color:#1cc7ed}#tp-title{margin:0 15px;padding:3px 0;color:#a874fc;font-size:19px;cursor:move}.tp-mainbutton,.tp-secbutton{margin:0 15px;padding:2px 0 3px;font-size:15px;border-top:1px solid rgba(56,60,68,.85);cursor:pointer}.tp-highlight{background-color:rgba(168,116,252,.33)}.tp-secbutton{padding-left:8px}#tastyplug-ui .icon-drag-handle{position:relative;float:right;top:3px;height:14px;width:14px;background-position:-183px -113px}#waitlist-button .eta{left:45px;font-size:10px}#chat-messages .tastyplug-pm .icon{top:-1px;left:-3px}#chat-pm-button{left:-3px}#chat-messages .tastyplug-pm{border-left-style:solid;border-left-width:3px;border-color:#f59425;padding-left:25px}#chat-messages .tastyplug-pm .from{color:#f59425;font-weight:700}#user-lists .list.room .user .icon-meh{left:auto;right:8px;top:-1px}#chat-messages [data-cid|="3946454"] .icon{top:7px;left:6px;background-position:-145px -287px;width:18px;height:16px}#chat-messages [data-cid|="3946454"].mention .icon{left:3px}#chat-messages [data-cid|="5590517"]{background-color:#0d3655}#chat-messages .emote:nth-child(2n+1)[data-cid|="3946454"],#chat .mention:nth-child(2n+1)[data-cid|="3946454"],#chat .message:nth-child(2n+1)[data-cid|="3946454"]{background-color:#240024}#chat .emote[data-cid|="3946454"] .text,#chat .mention[data-cid|="3946454"] .text,#chat .message[data-cid|="3946454"] .text{font-weight:700;color:#cfcfcf}#chat .emote[data-cid|="3946454"] .text{font-style:normal}.tp-info{border-left:3px solid #1cc7ed}#chat .update.tp-info .text{color:#1cc7ed}#chat .update.tp-info .text span{color:#EEE}.tp-error{border-left:3px solid red}#chat .update.tp-error .text{color:red}.tp-init{border-left:3px solid #d1d119}#chat .update.tp-init .text{color:#d1d119}.tp-join-admin{border-left:3px solid #1cc7ed}#chat .update.tp-join-admin .text{color:#1cc7ed}.tp-join-ba{border-left:3px solid #088c30}#chat .update.tp-join-ba .text{color:#088c30}.tp-join-host{border-left:3px solid #d1d119}#chat .update.tp-join-host .text{color:#d1d119}.tp-join-cohost{border-left:3px solid #f59425}#chat .update.tp-join-cohost .text{color:#f59425}.tp-join-staff{border-left:3px solid #c322e3}#chat .update.tp-join-staff .text{color:#c322e3}.tp-join-friend{border-left:3px solid #009cdd}#chat .update.tp-join-friend .text{color:#009cdd}.tp-img.wide{width:280px;height:auto}.tp-img.high{height:350px;width:auto}.tp-img-delete{position:absolute;top:25px;left:8px;background-color:#f04f30;padding:0 3px;cursor:pointer}#playback.tp-video-hide,#playback .tp-video-hide{height:0 !important}.custom-emote{display:inline-block;vertical-align:top}</style>');
        $('body').append('<div id="tp-room" style="position:absolute;top:54px;left:0"></div><div id="tastyplug-ui"> <div id="tp-title"> TastyPlug <img class="tastyplug-icon" src="https://fungustime.pw/tastyplug/tastyplug.png"> </div><div class="tp-mainbutton tp-toggle button-on" id="tp-autowoot"> <span>Autowoot</span> </div><div class="tp-mainbutton tp-toggle button-on" id="tp-autojoin"> <span>Autojoin</span> </div><div class="tp-mainbutton tp-toggle" id="tp-hidevideo"> <span>Hide Video</span> </div><div class="tp-mainbutton tp-toggle" id="tp-fullscreen"> <span>Fullscreen</span> </div><div class="tp-mainbutton tp-toggle button-on" id="tp-boothalert"> <span>Booth Alert</span> </div><div class="tp-mainbutton tp-toggle button-on" id="tp-histalert"> <span>History Alert</span> </div><div class="tp-mainbutton tp-toggle button-on" id="tp-chatimgs"> <span>Chat Images</span> </div><div class="tp-mainbutton tp-toggle button-on" id="tp-emotes"> <span>Cust. Emotes</span> </div><div class="tp-mainbutton tp-toggle button-on" id="tp-mentions"> <div class="icon icon-drag-handle"></div><span>Chat Mentions</span> </div><div class="tp-secbutton tp-secmention" id="tp-addmention"> <span>Add</span> </div><div class="tp-secbutton tp-secmention" id="tp-delmention"> <span>Delete</span> </div><div class="tp-secbutton tp-secmention" id="tp-listmention"> <span>List</span> </div><div class="tp-mainbutton tp-toggle button-on" id="tp-joinnotifs"> <div class="icon icon-drag-handle"></div><span>Join Notifs.</span> </div><div class="tp-secbutton tp-secjoin tp-toggle button-on" id="tp-joinranks"> <span>Ranks</span> </div><div class="tp-secbutton tp-secjoin tp-toggle button-on" id="tp-joinfriends"> <span>Friends</span> </div><a href="http://fungustime.pw/tastyplug/emotes" target="_blank"> <div class="tp-mainbutton" id="tp-listemotes"> <span>Emotes List</span> </div></a></div>');
        if (room == '/tastycat') $('#waitlist-button').append('<span class="eta"></span>');
        if (room == '/hummingbird-me') $('#tp-autojoin').remove();
        //$('#chat-header').append('<div id="chat-pm-button" class="chat-header-button"><i class="icon icon-ignore"></i></div>');
        if (!settings.autowoot) $('#tp-autowoot').removeClass('button-on');
        if (!settings.autojoin) $('#tp-autojoin').removeClass('button-on');
        if (!settings.boothalert) $('#tp-boothalert').removeClass('button-on');
        if (!settings.histalert) $('#tp-histalert').removeClass('button-on');
        if (!settings.chatimgs) $('#tp-chatimgs').removeClass('button-on');
        if (!settings.emotes) $('#tp-emotes').removeClass('button-on');
        if (!settings.chatmentions) $('#tp-mentions').removeClass('button-on');
        if (!settings.joinnotifs.toggle) $('#tp-joinnotifs').removeClass('button-on');
        if (!settings.joinnotifs.ranks) $('#tp-joinranks').removeClass('button-on');
        if (!settings.joinnotifs.friends) $('#tp-joinfriends').removeClass('button-on');
        if (!settings.show) {
            $('.tp-mainbutton').hide();
            $('#tastyplug-ui').css('padding-bottom','0');
        }
        if (settings.fullscreen) {
            $('#tp-fullscreen').addClass('button-on');
            $('#dj-button').hide();
            $('#avatars-container').hide();
            fullScreen();
        }
        if (getRank(API.getUser()) < 2) $('#tp-histalert').remove();
        $('.tp-secbutton').hide();
        $('#tastyplug-ui').css(settings.uipos);
        var uicont = {
            width: $('.app-right').position().left,
            height: $('.app-right').height()
        };
        $('#tp-room').css(uicont);
        resize();
        for (var i = 1; i < sounds.length - 1; i++) {
            $('body').append('<audio id="' + sounds[i] + '-sound"><source src="https://fungustime.pw/tastyplug/sounds/' + sounds[i] + '.mp3"></audio>');
        }
        $('body').append('<audio id="default-sound"><source src="https://cdn.plug.dj/_/static/sfx/badoop.801a12ca13864e90203193b2c83c019c03a447d1.mp3"></audio>');
        if (settings.mention == sounds.indexOf('custom')) $('body').append('<audio id="custom-sound"><source src="' + settings.customsound + '"></audio>');
    }
    function loadEvents() {
        API.on({
            'chat':eventChat,
            'userJoin':eventJoin,
            'userLeave':eventLeave,
            'waitListUpdate':eventWLUpd,
            'advance':eventDjAdv,
            'chatCommand':eventCommand
        });
        $(window).resize(resize);
        if (getRank(API.getUser()) >= 2) {
            API.on('voteUpdate',refreshMehs);
            $('#users-button:not(.selected)').click(refreshMehs);
        }
        //make it draggable
        var dragopts = {
            distance:20,
            handle:'#tp-title',
            containment:'#tp-room',
            scroll:false,
            start:function(){drag = true},
            stop:function(e,ui){
                drag = false;
                settings.uipos = ui.position;
                saveSettings();
            }
        };
        if ($.ui == undefined) {
            $.getScript('https://fungustime.pw/jquery-ui-1.10.4.custom.min.js',function(){
                $('#tastyplug-ui').draggable(dragopts);
            });
        } else $('#tastyplug-ui').draggable(dragopts);
        //hover over song title
        $('#now-playing-media').hover(
            function(){
                hover = true;
                if (API.getMedia()) {
                    var left = $('#now-playing-bar').position().left + 74;
                    $('body').append('<div id="tooltip" class="tp-songtitle" style="top:6px;left:' + left + 'px"><span>' + 
                        API.getMedia().author + ' - ' + API.getMedia().title + '</span><div class="corner"></div></div>');
                }
            },
            function(){
                hover = false;
                $('#tooltip.tp-songtitle').remove();
            }
        );
        //quick reply to pm
        $('#chat-messages').on('click','.pm-from',function(){
            if ($('#chat-input-field').val()) return;
            var a = '/pm @' + $(this).text();
            $('#chat-input-field').val(a);
            $('#chat-input-field').focus();
        });
        //pm button
        /*$('#chat-pm-button i').click(function(){
            if (!$('.icon-mention-off').length) return Chat('error', 'Don\'t use this button while the mentions button is on! (Button to the left)');
            pms = !pms;
            $('#chat-pm-button i').attr('class',(pms ? 'icon icon-unignore' : 'icon icon-ignore'));
            $('#chat-messages').children().not('.tastyplug-pm').toggle();
            $('#chat-messages').scrollTop(20000);
        });*/
        //highlight ui buttons
        $('.tp-mainbutton,.tp-secbutton').hover(
            function(){$(this).addClass('tp-highlight')},
            function(){$(this).removeClass('tp-highlight')}
        );
        //tp title
        $('#tp-title').mouseup(function(){
            if (!drag) {
                settings.show = !settings.show;
                if (!settings.show) {
                    $('#tastyplug-ui').css('padding-bottom','0');
                    $('.tp-mainbutton').css('border-top','0');
                    $('.tp-secbutton').css('border-top','0');
                }
                $('#tastyplug-ui .tp-mainbutton').slideToggle(function(){
                    if (settings.show) {
                        $('#tastyplug-ui').css('padding-bottom','');
                        $('.tp-mainbutton').css('border-top','');
                        $('.tp-secbutton').css('border-top','');
                    }
                });
                $('.tp-secbutton,.tp-infobutt').slideUp();
                saveSettings();
            }
        });
        //tp autowoot
        $('#tp-autowoot').click(function(){
            settings.autowoot = !settings.autowoot;
            $(this).toggleClass('button-on');
            if (settings.autowoot) woot();
            saveSettings();
        });
        //autojoin
        $('#tp-autojoin').click(function(){
            settings.autojoin = !settings.autojoin;
            $(this).toggleClass('button-on');
            if (settings.autojoin && !getLocked() && API.getWaitListPosition() == -1) join();
            afkCheck();
            saveSettings();
        });
        //hide video
        $('#tp-hidevideo').click(function(){
            hidevideo = !hidevideo;
            $('#playback-container').toggleClass('tp-video-hide');
            $('#playback').toggleClass('tp-video-hide');
            hidevideo ? $('.background').hide() : $('.background').show();
            settings.fullscreen ? fullScreen() : $('#tp-fs-hv').remove();
            $(this).toggleClass('button-on');
        });
        //fullscreen
        $('#tp-fullscreen').click(function(){
            settings.fullscreen = !settings.fullscreen;
            $(this).toggleClass('button-on');
            $('#dj-button').toggle();
            $('#avatars-container').toggle();
            if (!settings.fullscreen) {
                $('#tp-fs').remove();
                $('#tp-fs-hv').remove();
            } else fullScreen();
            saveSettings();
        });
        //booth alert
        $('#tp-boothalert').click(function(){
            settings.boothalert = !settings.boothalert;
            $(this).toggleClass('button-on');
            saveSettings();
        });
        //history alert
        $('#tp-histalert').click(function(){
            settings.histalert = !settings.histalert;
            $(this).toggleClass('button-on');
            saveSettings();
        });
        //chat images
        $('#tp-chatimgs').click(function(){
            settings.chatimgs = !settings.chatimgs;
            $(this).toggleClass('button-on');
            saveSettings();
        });
        //custom emotes
        $('#tp-emotes').click(function(){
            settings.emotes = !settings.emotes;
            $(this).toggleClass('button-on');
            saveSettings();
        });
        //chat mentions
        $('#tp-mentions span').click(function(){
            settings.chatmentions = !settings.chatmentions;
            $(this).parent().toggleClass('button-on');
            saveSettings();
        });
        $('#tp-addmention').click(function(){
            var len = settings.msgs.length;
            var a = prompt('Add words to the chat mentions list! Separate them with a comma.').trim().split(',');
            if (!a) return Chat('error', 'Please enter at least one word!');
            for (var i = 0; i < a.length; i++) {
                a[i] = a[i].trim().toLowerCase();
                if (a[i].length < 3) Chat('error', 'Did not add: ' + _.escape(a[i]) + ' (too short)');
                else if (settings.msgs.indexOf(a[i]) > -1) Chat('error', 'Did not add: ' + _.escape(a[i]) + ' (already on list)');
                else settings.msgs.push(a[i]);
            }
            if (settings.msgs.length > len) {
                Chat('info', 'Added word(s) to chat mentions list');
                saveSettings();
            }
        });
        $('#tp-delmention').click(function(){
            var a = prompt('Which word would you like to remove from the mentions list?');
            if (settings.msgs.indexOf(a) > -1) {
                settings.msgs.splice(settings.msgs.indexOf(a),1);
                Chat('info', 'Removed "' + _.escape(a) + '" from the chat mentions list');
                saveSettings();
            } else Chat('error', 'That word isn\'t in the mentions list!');
        });
        $('#tp-listmention').click(function(){
            var a = settings.msgs;
            for (var i = 0; i < a.length; i++) a[i] = _.escape(a[i]);
            if (a.length) return Chat('info', 'Chat mentions list:<br>' + a.join('<br>'));
            return Chat('error', 'You don\'t have anything in your chat mentions list!');
        });
        $('#tp-mentions .icon-drag-handle').click(function(){
            $('.tp-secmention').slideToggle();
        });
        //join notifs
        $('#tp-joinnotifs span').click(function(){
            settings.joinnotifs.toggle = !settings.joinnotifs.toggle;
            $(this).parent().toggleClass('button-on');
            saveSettings();
        });
        $('#tp-joinranks').click(function(){
            settings.joinnotifs.ranks = !settings.joinnotifs.ranks;
            $(this).toggleClass('button-on');
            saveSettings();
        });
        $('#tp-joinfriends').click(function(){
            settings.joinnotifs.friends = !settings.joinnotifs.friends;
            $(this).toggleClass('button-on');
            saveSettings();
        });
        $('#tp-joinnotifs .icon-drag-handle').click(function(){
            $('.tp-secjoin').slideToggle();
        });
    }
    function loadEmotes() {
        $.ajax({
            cache: false,
            url: "https://fungustime.pw/tastyplug/emotes/json/emotes.json",
            dataType: "json",
            success: function(a){
                for (var i in a) {
                    for (var j in a[i]) {
                        emotes[j] = a[i][j];
                    }
                }
            },
            error: function(){Chat('error','Could not load custom emotes. Refresh and/or try again later.')}
        });
    }
    tastyPlugShutDown = function() {
        API.off({
            'chat':eventChat,
            'userJoin':eventJoin,
            'userLeave':eventLeave,
            'waitListUpdate':eventWLUpd,
            'advance':eventDjAdv,
            'chatCommand':eventCommand,
            'voteUpdate':refreshMehs
        });
        $(window).off('resize',resize);
        $('#users-button').off('click',refreshMehs);
        $('#chat-messages .pm-from').off('click');
        $('.tp-img-delete').off('click');
        $('#chat-messages .message,#chat-messages .mention,#chat-messages .emote').has('img').off('mouseenter mouseleave');
        $('#now-playing-media').off('mouseenter mouseleave');
        $('#chat-pm-button').remove();
        $('#waitlist-button').find('.eta').remove();
        $('#playback-container').removeClass('tp-video-hide');
        $('.background').show();
        $('#playback').removeClass('tp-video-hide');
        $('#tastyplug-ui').remove();
        $('#tastyplug-css').remove();
        $('#tp-fs').remove();
        $('#tp-fs-hv').remove();
        $('#tp-room').remove();
        $('#dj-button').show();
        $('#avatars-container').show();
        $('#tooltip.tp-songtitle').remove();
        for (var i = 1; i < sounds.length; i++) {
            $('#' + sounds[i] + '-sound').remove();
        }
        reconnect = false;
        for (var i in tos) clearInterval(tos[i]);
        saveSettings();
        if (sock) sock.close();
        console.log('[TastyPlug v' + version + '] Shut down.');
    };
    function eventChat(a) {
        if (!a.cid || a.cid == lastchat) return;
        lastchat = a.cid;
        var msg = $('#chat-messages').children('[data-cid="' + a.cid + '"]');
        if (pms && !msg.hasClass('.tastyplug-pm')) msg.hide();
        if (settings.emotes) custEmotes(msg.find('.text'));
        if (settings.chatimgs && a.message.toLowerCase().indexOf('nsfw') == -1) {
            var txt = msg.find('.text'), txts = txt.text().trim().split(' ');
            for (var i = 0; i < txts.length; i++) if (/.(gif|png|jpe?g)/i.test(txts[i]) && /^https?:\/\//i.test(txts[i])) return checkImg(txts[i],txt);
        }
        var b = document.createElement('div');
        b.innerHTML = a.message;
        var message = b.textContent.replace(/  +/g, ' ').trim();
        if (a.uid == API.getUser().id) {
            afktime = Date.now();
            if (API.getUser().status == 1) API.setStatus(0);
            if (!message.toLowerCase().indexOf('!afk')) API.setStatus(1);
        }
        if (!settings.chatmentions || a.uid == API.getUser().id || a.type == 'mention') return;
        b = message.toLowerCase().split(' ');
        for (var i = 0; i < settings.msgs.length; i++) {
            if (b.indexOf(settings.msgs[i]) > -1) return chatSound();
        }
    }
    function eventJoin(a) {
        if (inRoom.indexOf(a.id) == -1) {
            if (!settings.joinnotifs.toggle || !a.username || (!settings.joinnotifs.ranks && !settings.joinnotifs.friends)) return;
            var b, rank = getRank(a);
            if (rank) switch (rank) {
                case 10: b = 'admin'; break;
                case 8: b = 'ba'; break;
                case 5: b = 'host'; break;
                case 4: b = 'cohost'; break;
                case 3:case 2:case 1: b = 'staff'; break;
                default: b = 'undef'; break;
            }
            else if (settings.joinnotifs.friends && a.friend) b = 'friend';
            if (b) Chat('join-' + b, _.escape(a.username) + ' joined the room');
            var users = API.getUsers();
            inRoom.length = 0;
            for (var i = 0; i < users.length; i++) inRoom.push(users[i].id);
        }
    }
    function eventLeave(a) {
        var users = API.getUsers();
        inRoom.length = 0;
        for (var i = 0; i < users.length; i++) inRoom.push(users[i].id);
    }
    function eventWLUpd() {
        if (settings.autojoin && !getLocked() && API.getWaitListPosition() == -1) join();
        if (settings.boothalert && API.getWaitListPosition() < settings.boothnotify && API.getWaitListPosition() != -1 && !boothcd) {
            chatSound();
            Chat('info','[Booth Alert] It\'s almost your turn to DJ! Make sure to pick a song!');
            boothcd = true;
            if (room == '/tastycat' && sock.readyState == 1) commands.cs()
        }
    }
    function eventDjAdv(a) {
        if (settings.autojoin && !getLocked() && API.getWaitListPosition() == -1) join();
        if (settings.autowoot) setTimeout(woot,(Math.floor(Math.random()*10)+1)*1000);
        if (hidevideo) $('#tp-hidevideo').click();
        if (!a.dj) return;
        if (a.dj.id == API.getUser().id) boothcd = false;
        if (settings.histalert && getRank(API.getUser()) >= 2 && a.media) {
            var hist = API.getHistory();
            for (var i = 0; i < hist.length; i++) {
                if (hist[i].media.cid == a.media.cid) {
                    Chat('error','This song is on the history! (played ' + (i + 1) + ' song' + (i == 0 ? '' : 's') + ' ago)');
                    chatSound();
                    break;
                }
            }
        }
        if (hover) {
            $('#tooltip.tp-songtitle').remove();
            if (API.getMedia()) {
                var left = $('#now-playing-bar').position().left + 74;
                $('body').append('<div id="tooltip" class="tp-songtitle" style="top:6px;left:' + left + 'px"><span>' + 
                    API.getMedia().author + ' - ' + API.getMedia().title + '</span><div class="corner"></div></div>');
            }
        }
    }
    function eventCommand(a) {
        var cmd = a.trim().substr(1).split(' ')[0].toLowerCase();
        if (cmd == 'afk' || cmd == 'away') API.setStatus(1);
        else if (cmd == 'work' || cmd == 'working') API.setStatus(2);
        else if (cmd == 'gaming' || cmd == 'game' || cmd == 'ingame') API.setStatus(3);
        var data = {
            uid: API.getUser().id,
            un: API.getUser().username,
            message: a.trim(),
            room: room
        }, a;
        if (cmd == 'opcheck' || cmd == 'check') a = commands.cs(data);
        else if (commands[cmd]) a = commands[cmd](data);
        else if (room == '/tastycat' && sock && sock.readyState == 1) {
            sock.msg({z:'command',a:data});
            a = true;
        }
        if (a) {
            cd = true;
            setTimeout(function(){cd = false},2E3);
        }
    }
    function refreshMehs() {
        if ($('#users-button').hasClass('selected') && $('.button.room').hasClass('selected')) {
            $('#user-lists .list.room i.icon.icon-meh').remove();
            var users = $(API.getUsers()).filter(function(){return this.vote == -1 && !this.curated;});
            users.each(function(i){
                $('#user-lists .list.room .user span').filter(function(){return $(this).text()==users[i].username;}).parent().append('<i class="icon icon-meh"></i>');
            });
        }
    }
    commands.lock = function() {
        if (getRank(API.getUser()) < 3) return;
        API.moderateLockWaitList(true);
    };
    commands.unlock = function() {
        if (getRank(API.getUser()) < 3) return;
        API.moderateLockWaitList(false);
    };
    commands.cycle = function() {
        if (getRank(API.getUser()) < 3) return;
        $('.cycle-toggle').click();
    };
    commands.ban = function(a) {
        if (getRank(API.getUser()) < 3) return;
        var user = getUser(a.message.substr(a.message.indexOf('@')+1));
        if (!user) return Chat('error', 'User not found.');
        if (getRank(API.getUser()) <= getRank(user)) return Chat('error', 'You can\'t ban people who are of equal or higher rank as you!');
        API.moderateBanUser(user.id,0,API.BAN.PERMA);
    };
    commands.kick = function(a) {
        if (getRank(API.getUser()) < 2) return;
        var msg = a.message.split(' '), user, dur;
        if (msg[msg.length-1] != 'day' && msg[msg.length-1] != 'hour') {
            user = getUser(a.message.substr(a.message.indexOf('@')+1));
            dur = API.BAN.HOUR;
        } else {
            user = getUser(msg.slice(1,msg.length-1).join(' ').substr(1));
            dur = msg[msg.length-1] == 'day' ? API.BAN.DAY : API.BAN.HOUR;
        }
        if (!user) return Chat('error', 'User not found.');
        if (getRank(API.getUser()) <= getRank(user)) return Chat('error', 'You can\'t kick people who are of equal or higher rank as you!');
        API.moderateBanUser(user.id,0,dur);
    };
    commands.skip = function() {
        if (getRank(API.getUser()) < 2) return;
        API.moderateForceSkip();
    };
    commands.pm = function(a) {
        if (cd) return Chat('error', 'PMs have a 2 second slow-mode!');
        if (sock && sock.readyState != 1) return Chat('error', 'Not connected to TastyPlug\'s server!');
        if (a.message == '/pm') return Chat('info', 'Usage: /pm @user message<br>Sends a private message to the user if they are using Tastyplug and you are each other\'s fans');
        var str = a.message.substr(5).split(' '), user;
        for (var i = 1; i <= str.length; i++) {
            user = getUser(str.slice(0,i).join(' '));
            if (user) break;
        }
        if (!user) return Chat('error', 'User not found.');
        if (user.id == API.getUser().id) return Chat('error', 'You can\'t PM yourself!');
        var msg = str.slice(i).join(' ');
        if (!msg) return Chat('error', 'Please input a message to send!');
        sock.msg({z:'pm',m:msg,f:API.getUser(),t:user})
        ChatPM('To: ' + user.username,msg);
        return true;
    };
    commands.pmconnect = function() {
        if (room == '/tastycat' || (sock && sock.readyState == 1)) return;
        Chat('info', 'Connecting to TastyPlug server');
        socket();
    };
    commands.r = function(a) {
        if (settings.lastPM) eventCommand('/pm @' + settings.lastPM + ' ' + a.message.split(' ').slice(1).join(' '));
        else Chat('error', 'Nobody has PMed you yet!');
    };
    commands.cs = function() {
        if (cd) return Chat('error', '/opcheck has a 2 second slow-mode!');
        if (room != '/tastycat') return;
        if (sock && sock.readyState != 1) return Chat('error', 'Not connected to TastyPlug\'s server!');
        var b = API.getNextMedia().media;
        sock.msg({z:'songcheck',id:b.format+':'+b.cid,song:'Next on your playlist',author:b.author,title:b.title});
        return true;
    };
    commands.reset = function() {
        Chat('init', 'Reloading...');
        setTimeout(function(){$.getScript('https://fungustime.pw/tastyplug/tastyplug.js')},1000);
    };
    commands.commands = function() {
        if (room == '/tastycat') Chat('info', 'Tastybot commands: <a href="https://fungustime.pw/tastybot" target="_blank">Click Here</a>');
        Chat('info', 'TastyPlug commands: ' + Object.keys(commands).join(', '));
    };
    commands.whois = function(a) {
        var user = getUser(a.message.split(' ').slice(1).join(' ').substr(1)), rank;
        if (!user) return Chat('error','User not found.');
        var pos = API.getWaitListPosition(user.id);
        switch (getRank(user)) {
            case 10: rank = 'plug.dj Admin'; break;
            case 8: rank = 'Brand Ambassador'; break;
            case 5: rank = 'Host'; break;
            case 4: rank = 'Co-Host'; break;
            case 3: rank = 'Manager'; break;
            case 2: rank = 'Bouncer'; break;
            case 1: rank = 'Resident DJ'; break;
            case 0: rank = 'User'; break;
            default: rank = 'Unknown';
        }
        if (API.getDJ().id == user.id) pos = 'Currently DJing';
        else if (pos == -1) pos = 'Not on list';
        else pos++;
        Chat('info','Username: <span>' + user.username + '</span><br>ID: <span>' + user.id + 
            '</span><br>Rank: <span>' + rank + '</span><br>Level: <span>' + user.level + '</span><br>Wait List: <span>' + pos + '</span>');
    };
    commands.link = function() {
        var b = API.getMedia();
        if (b.format == '1') Chat('info', 'Current song: <a href="http://youtu.be/' + b.cid + '" target="_blank">Click Here</a>');
        else SC.get('/tracks/' + b.cid, function(c) {
            Chat('info', 'Current song: ' + (c.permalink_url ? ('<a href="' + c.permalink_url + '" target="_blank">Click Here') : 'Link not found'));
        });
    };
    commands.pic = function() {
        var b = API.getMedia();
        if (b.format == 1) Chat('info', 'Video image: <a href="http://i1.ytimg.com/vi/' + b.cid + '/maxresdefault.jpg" target="_blank">Click Here</a>');
        else SC.get('/tracks/' + b.cid, function(c) {
           Chat('info', 'Song art: ' + (c.artwork_url ? ('<a href="' + c.artwork_url + '" target="_blank">Click Here</a>') : 'Artwork unavailable'));
        });
    };
    commands.uireset = function() {
        settings.uipos = {'top':'54px','left':'0'};
        $('#tastyplug-ui').css(settings.uipos);
        saveSettings();
        Chat('info', 'UI position reset');
    };
    commands.hidden = function() {
        settings.hidden = !settings.hidden;
        saveSettings();
        Chat('info', 'Hidden emotes ' + (settings.hidden ? 'enabled!' : 'disabled!'));
    };
    commands.mentionsound = function(a) {
        var b = a.message.split(' ').slice(1);
        if (!b.length) return Chat('info', 'Usage: <span>/mentionsound [sound]</span><br>Available sounds: ' + sounds.join(', '));
        if (sounds.indexOf(b[0]) == -1) return Chat('error', 'Invalid sound. Available sounds: ' + sounds.join(', '));
        if (b[0] == 'custom') {
            if (!b[1] || !(/.(mp3|wav|ogg)/i.test(b[1])) || !(/^https?:\/\//i.test(b[1]))) return Chat('error', 'Please supply a direct link to a valid mp3, wav, or ogg file!<br>Usage: /mentionsound custom [link]');
            $('#custom-sound').remove();
            $('body').append('<audio id="custom-sound"><source src="' + b[1] + '"></audio>');
            settings.customsound = b[1];
        }
        settings.mention = sounds.indexOf(b[0]);
        saveSettings();
        chatSound();
        Chat('info', 'Mention sound set to <span>' + b[0] + '</span>.<br>Turn off mention sounds by changing to <span>default</span> or clicking the mention toggle at the top of the chat.');
    };
    commands.boothnotify = function(a) {
        var b = a.message.substr(13);
        settings.boothnotify = ~~b || 3;
        Chat('info', 'Booth Alert notification spot changed to spot <span>' + settings.boothnotify + '</span>.');
        saveSettings();
    };
    function Chat(type, m) {
        if ($('#chat-button').css('display') == 'block') {
            var chat = $('#chat-messages'), a = chat.scrollTop() > chat[0].scrollHeight - chat.height() - 28;
            chat.append('<div class="update tp-' + type + '"><span class="text">' + m + '</span></div>');
            if (a) chat.scrollTop(chat[0].scrollHeight);
            if (chat.children().length >= 512) chat.children().first().remove();
        } else API.chatLog(m.replace(/<br>/g,', ').replace(/<\/?span>/g,''),true);
    }
    function ChatPM(user, msg) {
        if ($('#chat-button').css('display') == 'block') {
            var chat = $('#chat-messages'), a = chat.scrollTop() > chat[0].scrollHeight - chat.height() - 28,
            c = !user.indexOf('To: ') ? '-to' : '-from clickable',
            d = $('#chat-timestamp-button .icon').attr('class').substr(21),
            e = d == 'off' ? 'none' : 'block',
            f = new Date().toTimeString().substr(0,5), j = false,
            k = !user.indexOf('To: ') ? ' message' : ' mention';
            if (d == '12') {
                var g = parseInt(f),
                    h = g >= 12 ? 'pm' : 'am',
                    i = g%12 == 0 ? '12' : g%12;
                f = i + f.substr(2) + h;
            }
            if (f.charAt(0) == '0') f = f.substr(1);
            msg = urlFix(_.escape(msg));
            if (!msg.indexOf('/me')) { msg = msg.replace('/me','<em>'); j = true; }
            else if (!msg.indexOf('/em')) { msg = msg.replace('/em','<em>'); j = true; }
            j = j ? '' : '&nbsp;';
            chat.append('<div class="tastyplug-pm' + k + '"><i class="icon icon-ignored"></i><div class="timestamp" style="display:' + e + '">' + f + '</div><span class="from pm' + c + '">' + user + ' </span><span class="text">' + j + msg + '</span></div>');
            if (a) chat.scrollTop(chat[0].scrollHeight);
            if (chat.children().length >= 512) chat.children().first().remove();
        } else API.chatLog('[PM] ' + user + ': ' + msg);
    }
    function eta() {
        tos.eta = setInterval(function(){
            var pos = API.getWaitListPosition(); 
            var str = pos == -1 ? '' : ('ETA: ' + getTime(pos*1000*60*(25/6) + API.getTimeRemaining()*1000));
            $('#waitlist-button').find('.eta').text(str);
        },10000);
    }
    function resize() {
        var room = $('#tp-room'), rpos = room.position(), rwidth = room.width(), rheight = room.height(),
            ui = $('#tastyplug-ui'), uipos = ui.position(), uiwidth = ui.width(), uiheight = ui.height(),
            a = Object.keys(rpos),
            uicont = {
                width: $('.app-right').position().left,
                height: $('.app-right').height()
            };
        $('#tp-room').css(uicont);
        for (var i = 0; i < a.length; i++) if (uipos[a[i]] < rpos[a[i]]) ui.css(a[i], rpos[a[i]]);
        uipos = $('#tastyplug-ui').position();
        if (uiwidth + uipos.left > rwidth) ui.css('left', rwidth-uiwidth);
        if (uiheight + uipos.top > rheight) ui.css('top', rheight-uiheight);
        settings.uipos = ui.position();
        if (settings.fullscreen) fullScreen();
        saveSettings();
    }
    function getUser(a) {
        a = a.trim();
        var b = API.getUsers();
        for (var i = 0; i < b.length; i++) if (b[i].username == a) return b[i];
        return null;
    }
    function getTime(a) {
        a = Math.floor(a/60000);
        var minutes = (a-Math.floor(a/60)*60);
        var hours = (a-minutes)/60;
        var str = '';
        str += hours + 'h';
        str += minutes<10?'0':'';
        str += minutes;
        return str;
    }
    function getRank(a) {
        if (a.gRole) switch (a.gRole) {
            case 5: return 10;
            case 4:case 3:case 2: return 8;
            default:return 6;
        }
        return a.role;
    }
    function urlFix(a) {
        if (a.indexOf('http') == -1) return a;
        a = a.split(' ');
        for (var i = 0; i < a.length; i++) if (!a[i].indexOf('http')) a[i] = '<a href="' + a[i] + '" target="_blank">' + a[i] + '</a>';
        return a.join(' ');
    }
    function afkCheck() {
        if (settings.autojoin) tos.afkInt = setInterval(function(){
            if (Date.now() - afktime >= 12E5) {
                settings.autojoin = false;
                $('#tp-autojoin').removeClass('button-on');
                clearInterval(tos.afkInt);
            }
        },6E4);
        else clearInterval(tos.afkInt);
    }
    function checkImg(a,b) {
        var img = new Image();
        img.onload =  function() {
            img.className += 'tp-img';
            if (img.height > 350 && 280*img.height/img.width > 350) return;
            if (img.width > 280) img.className += ' wide';
            else if (img.height > 350) img.className += ' high';
            var c = b.html().replace('<a href="' + a + '" target="_blank">' + a + '</a>', '<br><a href="' + a + '" target="_blank">' + img.outerHTML + '</div></a>');
            b.parent().append('<div class="tp-img-delete" style="display:none">X</div>');
            b.parent().hover(
                function(){$(this).find('.tp-img-delete').css('display','block')},
                function(){$(this).find('.tp-img-delete').css('display','none')}
            );
            b.parent().find('.tp-img-delete').click(function(){
                var a = $(this).parent().find('img')[0].src;
                $(this).parent().find('br').remove();
                $(this).parent().find('img').parent().append(a).find('img').remove();
                $(this).remove();
            });
            var chat = $('#chat-messages'), d = chat.scrollTop() > chat[0].scrollHeight - chat.height() - 28;
            b.html(c);
            if (d) chat.scrollTop(chat[0].scrollHeight);
        };
        img.src = a;
    }
    function custEmotes(a) {
        if (!Object.keys(emotes).length) return;
        var b = a.html();
        if (typeof b != 'string') return;
        var c = b.toLowerCase(), chat = $('#chat-messages'), d = chat.scrollTop() > chat[0].scrollHeight - chat.height() - 28;
        for (var i in emotes) {
            if (emotes[i].hidden && !settings.hidden) continue;
            var j = ':' + i.toLowerCase() + ':';
            b = b.replace(new RegExp(j,'gi'),'<div class="custom-emote" title="' + (emotes[i].hidden ? 'Hidden Emote!' : (':' + i + ':')) + '" style="background-image:url(' + emotes[i].url + ');width:' + emotes[i].width + ';height:' + emotes[i].height + ';"></div>');
        }
        a.html(b);
        if (d) chat.scrollTop(chat[0].scrollHeight);
    }
    function join() {
        if (!joincd && room != '/hummingbird-me') {
            API.djJoin();
            joincd = true
            setTimeout(function(){joincd = false},5000);
        }
    }
    function fullScreen() {
        $('#tp-fs').remove();
        $('#tp-fs-hv').remove();
        var vidwidth = $('.app-right').position().left;
        var vidheight = $('.app-right').height();
        var votetop = $('#footer').position().top - $('#vote').height();
        var ctrls = (vidwidth - $('#playback-controls').width()) / 2;
        var style = '<style id="tp-fs">#playback-container{width:{VW}px !important;height:{VH}px !important;left:0px !important}#vote{left:0px !important;top:{VT}px !important;color:rgba(238, 238, 238, 0.6) !important}#playback{left:0px !important}#playback .background{display:none !important}#playback-controls{left:{CT}px !important}.crowd-response{background:rgba(40, 44, 53, 0.33) !important;margin-right:0 !important}#woot{border-radius:0 !important}#meh{border-radius:0 !important}#woot .bottom,#woot.selected{background:rgba(144, 173, 47, 0.33) !important}#meh .bottom,#meh.selected{background:rgba(196, 46, 59, 0.33) !important}#grab .bottom,#grab.selected{background:rgba(170, 116, 255, 0.33)!important}#woot .bottom{border-radius:0 !important}#meh .bottom{border-radius:0 !important}#vote .icon{display:none !important}#woot .label{left:19px !important}#grab .label{left:20px !important}#meh .label{left:19px !important}</style>';
        style = style.replace(/\{VW\}/, vidwidth).replace(/\{VH\}/, vidheight).replace(/\{VT\}/, votetop).replace(/\{CT\}/, ctrls);
        var hvstyle = '<style id="tp-fs-hv">.room-background{background:url() !important}</style>';
        $('head').append(style);
        if (!hidevideo) $('head').append(hvstyle);
    }
    function chatSound(){
        if ($('.icon-chat-sound-on').length && settings.mention) {
            document.getElementById(sounds[settings.mention] + '-sound').play();
        }
    }
    function saveSettings(){localStorage.setItem('tastyPlugSettings',JSON.stringify(settings))}
    function getLocked(){return $('.lock-toggle .icon').hasClass('icon-locked')}
    function woot(){$('#woot').click()}
    var z = function() {
        if (typeof API === 'undefined' || !API.enabled) setTimeout(z,200);
        else startup();
    };
    z();
})();