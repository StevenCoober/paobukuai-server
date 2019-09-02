var RoomMgr = require('./room_mgr');
var MsgCode = require('../etc/msg_code');
var RoomBase = require('./room_base');
var PlayerMgr = require('./player_mgr');
var RunFastCardLogic = require('./RunFastCardLogic');

var RunFastConfig = require('./RunFastConfig');
var glog = require('./log');
var GameConfig = require('../etc/game_config');

var INVALID_USER = -1;
var GameState = RunFastConfig.GameState;
// var GAMETYPE = RunFastConfig.GAMETYPE;
// var GAMERULE = RunFastConfig.GAMERULE;
// var GAMERULETYPE = RunFastConfig.GAMERULETYPE;
var RUNFAST_GAME_PLAYER_MAX = RunFastConfig.RUNFAST_GAME_PLAYER_MAX;
var RUNFAST_PLAYER_MAX_CARD = RunFastConfig.RUNFAST_PLAYER_MAX_CARD;
// var CALL_BANK_TYPE = RunFastConfig.CALL_BANK_TYPE;
// var CALL_SCORE_TYPE = RunFastConfig.CALL_SCORE_TYPE;

Array.prototype.remove = function(val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};

var RoomPlayerState = {
    INIT: 0,
    ONLINE: 1,
    OFFLINE: 2,
}



var DisbandState = {
    NONE: 0,
    AGREE: 1,
    NOAGREE: 2,
}


//无人操作90秒解散
var RoomPlayer = function(userid) {
    console.log("var RoomPlayer = function (userid)", userid);
    this.userid     = userid;               //用户id
    this.name       = '';                   //用户姓名  
    this.seat       = 0;                    //用户座位号
    this.state      = RoomPlayerState.INIT; //玩家状态 0 初始化 1 在线 2 离线
    this.isready    = false;                //是否准备开始游戏
    this.isdisband  = DisbandState.NONE;                //是否同意解散
    this.pais       = [];                   //用户手牌
    this.isbanker   = false;                //是否庄家
    this.outcards   = null;                 //出牌
    this.islooker   = false;                //是否是旁观者
    this.bombcount  = 0;                    //炸弹数
    this.score      = 0;                    //积分

    this.roundStart = function() {
        this.isready    = false;                //是否准备开始游戏
        this.pais       = [];                   //用户手牌
        this.isbanker   = false;                //是否庄家
        this.outcards   = null;                 //出牌
        this.bombcount  = 0;                    //炸弹数
        this.isdisband  = DisbandState.NONE;    //是否同意解散
    }

    this.send = function(event, data) {
        PlayerMgr.sendMsg(this.userid, event, data);
    }


    //清空or不清空?
    this.pushOutCards = function(cbOutCardData) {
        this.outcards = cbOutCardData;
        this.clearHandCardsByOutCards(cbOutCardData);
    }

    this.clearHandCardsByOutCards = function(cbOutCardData) {
        for (var i = 0; i < cbOutCardData.length; i++) {
            this.pais.remove(cbOutCardData[i]);
        }
    }

    this.getOutCards = function() {
        return this.outcards;
    }

    this.clearOutCards = function() {
        this.outcards = null;
    }

    this.hasOutCards = function() {
        return this.outcards != null;
    }



    this.wintimes = 0; //胜利次数
}

class RunfastBureauCounter {
    constructor(bombcounts, leftcards, winner) {
        this.bombcounts  = bombcounts;         //炸弹数, 炸弹使用后20分，其余玩家各被扣10分
        this.leftcards   = leftcards;          //剩一张牌扣一分,按此类推(已报单的不扣),没出一张牌扣一分,按此类推(已报单的不扣)
        this.winner = winner;
        console.log("this.bombcounts", this.bombcounts, "this.leftcards", this.leftcards, "this.winner", this.winner);
    }

    countScore() {
        var scores = {};
        for(var seat in this.bombcounts) {
            if(!scores[seat]) scores[seat] = 0;
            var bombcount = this.bombcounts[seat];

            if (bombcount > 0) {
                scores[seat] = scores[seat] + 8;
                for(var jseat in this.bombcounts) {
                    if(jseat != seat) {
                        scores[seat] = scores[seat] - 4;
                    }
                }
            }

            var leftcard = this.leftcards[seat];
            var leftcardcount = leftcard.length;
            if(leftcardcount == 16) {
                scores[seat] = scores[seat] - 32;
            }
            else if (leftcardcount != 1) {
                scores[seat] = scores[seat] - leftcardcount;
            }
        }

        scores[this.winner] = 0;

        for(var seat in this.bombcounts) {
            if(seat != this.winner) {
                scores[this.winner] = scores[this.winner]-scores[seat];
            }    
        }

        return scores;
    }
}



class RunfastRoom extends RoomBase {
    constructor(id) {
        console.log("    constructor(id)", id);
        super(id);
        
        this.room_players      = {};                                         // 房间玩家列表

        this.is_round_openning = false;                                      //当局是否开始

        this.wCurrentUser      = INVALID_USER;                               //当前玩家
        this.wOutCardUser      = INVALID_USER;                               //出牌玩家
        this.wPassCardUser     = INVALID_USER;                               //放弃玩家
        
        this.bureaucount       = this.game_conf.playtimesConfig;             //总局数
        this.disarmbomb        = this.game_conf.disarmbombConfig;            //是否可以拆炸弹
        this.consumeroomcount  = this.getConsumeRoomCount(this.bureaucount); //消费房卡数
        this.bureaucounters    = [];                                         //总统计
        this.gamestate         = GameState.FREE_STATE;                       //游戏状态 空闲 游戏中
        this.max_player_num    = RunFastConfig.RUNFAST_GAME_PLAYER_MAX;

        this.bOnlyOnecard      = false;
        this.roomstate         = 0;
        console.log("this.bureaucount", this.bureaucount);
        console.log("this.consumeroomcount", this.consumeroomcount);
    }

    roundStartInit() {
        this.wCurrentUser      = INVALID_USER;                               //当前玩家
        this.wOutCardUser      = INVALID_USER;                               //出牌玩家
        this.wPassCardUser     = INVALID_USER;                               //放弃玩家
        this.gamestate         = GameState.FREE_STATE;                       //游戏状态 空闲 游戏中
        this.bOnlyOnecard      = false;

        if(this.bureaucounters.length == 1){
            var cost = this.consumeroomcount;
            RoomMgr.payForRoom(this.roomid, cost);
        }

        for(var userid in this.room_players) {
            const roomplayer = this.room_players[userid];
            roomplayer.roundStart();
        }
    }

    getConsumeRoomCount(bureaucount) {
        var BureauConsume = RunFastConfig.BureauConsume;

        var consumeCard = 0;
        for (var onebureaucount in BureauConsume) {
            if (bureaucount <= onebureaucount) {
                consumeCard = BureauConsume[onebureaucount];
                break;
            }
        }

        return consumeCard;
    }

    bureauCount(lbombcount, cbhandcarddata, winner) {
        var runfastbureaucounter = new RunfastBureauCounter(lbombcount, cbhandcarddata, winner);

        this.bureaucounters.push(runfastbureaucounter);
        var scores = runfastbureaucounter.countScore();

       
        return scores;
    }


    /**
     * 销毁房间
     */
    destroy() {
        console.log("    destroy()", );
        
        // 删除在线玩家
        for (const uid of this.player_list) {
            PlayerMgr.delPlayer(uid);
        }
        // 通知房间管理器 销毁房间
        RoomMgr.destroyRoom(this.roomid);
    }

    /**
     * 判断暂离状态
     *      如果所有玩家都暂离 则 3分钟后 解散房间
     */
    checkAllOffline() {
        console.log("    checkAllOffline()", );
        let isalloffline = true;
        for (const uid in this.room_players) {
            if (this.room_players.hasOwnProperty(uid)) {
                const roomplayer = this.room_players[uid];
                if (roomplayer.state != RoomPlayerState.OFFLINE) {
                    isalloffline = false;
                    break;
                }
            }
        }
        if (isalloffline) {
            this.offline_timer = setTimeout(() => {
                this.destroy();
            }, 3 * 60 * 1000);
        } else {
            if (this.offline_timer != 0) {
                clearTimeout(this.offline_timer);
                this.offline_timer = 0;
            }
        }
    }

    forceLogout(userid) {
        let p = this.room_players[userid];
        if(p) {
            if(p.state == RoomPlayerState.ONLINE) {
                this.playerExit(userid);
                PlayerMgr.delPlayer(userid);
            }
            
        }
    }
    /**
     * 玩家进入房间
     * @param {*玩家id} userid 
     */
    playerEnter(userid) {

        if (this.isGameFinal()) {
            return MsgCode.ROOM_HAS_END;
        }

        console.log("    playerEnter(userid)", userid);
        super.playerEnter(userid); // 调用父类玩家进入
        // 判断是否 是暂离重入
        
        let p = this.room_players[userid];
        if (!p) {

            var seat = 0;
            
            for(var i = 0; i < 3; i++) {
                var exist = false;
                for(var uid in this.room_players) {
                    if(this.room_players[uid].seat == i) {
                        exist = true;
                        break;
                    }
                }

                if(!exist) {
                    seat = i;
                    break;
                }
            }

            

            // 新玩家进入
            let roomplayer = new RoomPlayer(userid);
            roomplayer.roundStart();
            roomplayer.name             = PlayerMgr.getPlayerName(userid);
            // roomplayer.seat             = Object.getOwnPropertyNames(this.room_players).length;
            roomplayer.seat             = seat;

           
            this.room_players[userid]   = roomplayer;
        }

        let roomplayer = this.room_players[userid];
        roomplayer.state = RoomPlayerState.ONLINE;

        this.broadcastPlayerInfo(userid);
        // this.sendRoomInfo(userid);

        if (this.gamestate == GameState.FREE_STATE) {
            this.RunFast_StatusFreeSyn(userid);
        } else if (this.gamestate == GameState.GAMING_STATE) {
            this.RunFast_StatusPlaySyn(userid);
        }

        // 撤销 销毁定时器
        if (this.offline_timer != 0) {
            this.checkAllOffline();
        }
    }


    /**
     * 玩家退出
     * @param {*玩家id} userid 
     */
    playerExit(userid) {
        console.log("    playerExit(userid)", userid);
        let roomplayer = this.room_players[userid];
        if (roomplayer == null) {
            return;
        }

        if(this.roomstate == 0) {
            if (this.master == userid) {
                
                this.destroy(); // 直接销毁房间
                return;
            }
            super.playerExit(userid);
            delete this.room_players[userid];
            this.broadcast('runfast_player_exit', {
                wLeaveUser: roomplayer.seat
            });
        }
       
        roomplayer.state = RoomPlayerState.OFFLINE;
        this.broadcast('runfast_player_leave', {
            wLeaveUser: roomplayer.seat
        });

        // 判断是否 已经完全没人了
        if (this.player_list.length <= 0) {
            this.destroy(); // 直接销毁房间
        } else {
            this.checkAllOffline(); // 判断暂离状态
        }
    }


    RunFast_StatusFreeSyn(userid) {
        console.log("RunFast_StatusFreeSyn");
        let playerlist = [];

        let painums = [];
        let cbTurnScore = {};
        let cbDisbandUsers = [];

        for (const uid in this.room_players) {
            var roomplayer               = this.room_players[uid];
            painums[roomplayer.seat]     = roomplayer.pais.length;
            cbTurnScore[roomplayer.seat] = roomplayer.score;
            if (roomplayer.isdisband) cbDisbandUsers.push(roomplayer.seat);
        }

        for (const uid in this.room_players) {
            if (this.room_players.hasOwnProperty(uid)) {
                const roomplayer = this.room_players[uid];
                let pdata = {};
                pdata.userid    = roomplayer.userid;
                pdata.name      = roomplayer.name;
                pdata.seat      = roomplayer.seat;
                pdata.score     = roomplayer.score;
                pdata.isready   = roomplayer.isready;
                pdata.isoffline = roomplayer.state == RoomPlayerState.OFFLINE;
                pdata.islook    = roomplayer.islook;
                pdata.headicon  = PlayerMgr.getPlayerHeadIcon(uid);
                pdata.lHandCount = 0;
                playerlist.push(pdata);
            }
        }


        var disbandusers = this.getPlayerAllDisband();
        var bIsDisband = disbandusers.length != 0;
        

        // 房间信息
        let Package = {
                roomid: this.roomid,                    //房间id
                lCellScore: 0,                          //基础积分
                lCollectScore: 0,                       //
                cbTurnScore: cbTurnScore,               //所有玩家的积分信息
                wCreateUser: this.master,               //创建者椅子
                lCurRound: this.bureaucounters.length,  //当前局数
                lMaxRound: this.bureaucount,            //总局数
                lDisarmBomb: this.disarmbomb,           //是否可以拆炸弹(1, 0)
                bIsDisband: bIsDisband,                 //房间是否解散
                cbDisbandUser: disbandusers,            //解散房间的用户
                playerList: playerlist,
        };

        this.room_players[userid].send('RunFast_StatusFreeSyn', Package);
    }


    RunFast_StatusPlaySyn(userid) {
        console.log("RunFast_StatusPlaySyn");
        let playerlist = [];

        let cbhandcount = {};

        let cbTurnScore = {};

        let cbDisbandUsers = [];


        for (const uid in this.room_players) {
            const roomplayer = this.room_players[uid];
            let pdata = {};
            pdata.userid    = roomplayer.userid;
            pdata.name      = roomplayer.name;
            pdata.seat      = roomplayer.seat;
            pdata.score     = roomplayer.score;
            pdata.isready   = roomplayer.isready;
            pdata.isoffline = roomplayer.state == RoomPlayerState.OFFLINE;
            pdata.islook    = roomplayer.islook;
            pdata.lHandCount = roomplayer.pais.length;
            pdata.headicon  = PlayerMgr.getPlayerHeadIcon(uid);
            playerlist.push(pdata);
           
            cbTurnScore[roomplayer.seat] = roomplayer.score;
            if (roomplayer.isdisband) cbDisbandUsers.push(roomplayer.seat);

        }

        var roomplayer = this.room_players[userid];


        var lastoutcarddata = [];

        if(this.wOutCardUser != INVALID_USER) {
            var lastoutcarduser = this.getRoomUserBySeat(this.wOutCardUser);
            lastoutcarddata = lastoutcarduser.getOutCards();
        }
        
        var disbandusers = this.getPlayerAllDisband();
        var bIsDisband = disbandusers.length != 0;

        // 房间信息
        let Package = {

            roomid: this.roomid,                        //房间id
            lCellScore: 0,                              //基础积分
            lCollectScore: 0,                           //
            cbTurnScore: cbTurnScore,                   //所有玩家的积分信息
            wCreateUser: this.master,                   //创建者椅子

            lCurRound: this.bureaucounters.length + 1,  //当前局数
            lMaxRound: this.bureaucount,                //总局数
            lDisarmBomb: this.disarmbomb,               //是否可以拆炸弹(1, 0)

            bIsDisband: bIsDisband,                     //房间是否解散
            cbDisbandUser: disbandusers,                //解散房间的用户
            playerList: playerlist,

            wBankerUser: this.wStartUser,               //当前庄家
            wCurrentUser: this.wCurrentUser,
            wTurnUser: this.wOutCardUser,               //
            cbTurnCardCount: 0,                         //出牌数目
            cbTurnCardData: lastoutcarddata,            //出牌数据

            cbHandCardData: roomplayer.pais,            //手上扑克
            cbCollectScore: [0, 0, 0],                  //所有玩家的积分信息
            bOnlyOnecard: this.bOnlyOnecard,            //是否报单
        };

        this.room_players[userid].send('RunFast_StatusPlaySyn', Package);
    }

    /**
     * 给玩家发送 房间信息
     *  用于断线重连
     * @param {*玩家id} userid 
     */
    // sendRoomInfo(userid) {
    //     console.log("    sendRoomInfo(userid)", userid);
    //     let playerlist = []; // 所有玩家的数据信息
    //     for (const uid in this.room_players) {
    //         if (this.room_players.hasOwnProperty(uid)) {
    //             const roomplayer = this.room_players[uid];
    //             let pdata        = {};
    //             pdata.userid     = roomplayer.userid;
    //             pdata.name       = roomplayer.name;
    //             pdata.seat       = roomplayer.seat;
    //             pdata.score      = roomplayer.score;
    //             pdata.ismaster   = this.master == uid;
    //             pdata.isready    = roomplayer.isready;
    //             pdata.isout      = roomplayer.isout;
    //             pdata.isoffline  = roomplayer.state == RoomPlayerState.OFFLINE;
    //             pdata.islook     = roomplayer.islook;
    //             pdata.isdisband  = roomplayer.isdisband;
    //             pdata.pais       = [0, 0, 0];
    //             if (userid == uid) {
    //                 if (roomplayer.islook) {
    //                     pdata.pais = roomplayer.pais;
    //                 }
    //             }
    //             playerlist.push(pdata);
    //         }
    //     }
    //     // 房间信息
    //     let senddata = {
    //         roomid: this.roomid,
    //         master: this.master,
    //         roomconf: this.game_conf,
    //         maxround: this.max_round,
    //         curround: this.cur_round,
    //         score_count: this.score_count,
    //         isdisband: this.disband_state,
    //         playerlist: playerlist,
    //     };
    //     PlayerMgr.sendMsg(userid, 'runfast_room_info', senddata)
    // }

    /**
     * 广播玩家信息
     * @param {*玩家id} userid 
     */
    broadcastPlayerInfo(userid) {
        console.log("    broadcastPlayerInfo(userid)", userid);
        let roomplayer = this.room_players[userid];
        if (roomplayer == null) {
            return;
        }
        let pdata = {};
        pdata.userid    = roomplayer.userid;
        pdata.name      = roomplayer.name;
        pdata.seat      = roomplayer.seat;
        pdata.score     = roomplayer.score;
        pdata.isready   = roomplayer.isready;
        pdata.isoffline = roomplayer.state == RoomPlayerState.OFFLINE;
        pdata.islook    = roomplayer.islook;
        pdata.headicon  = PlayerMgr.getPlayerHeadIcon(userid);
        this.broadcast('runfast_player_enter', pdata);
    }

    /**
     * 解散房间
     */
    disband() {
        console.log("    disband()", );
        
    }

    /**
     * 检查是否全部同意解散
     */
    checkDisband() {
        console.log("    checkDisband()", );
        let allagree = true;
        for (const userid in this.room_players) {
            if (this.room_players.hasOwnProperty(userid)) {
                let roomplayer = this.room_players[userid];
                if (roomplayer && roomplayer.isdisband == false) {
                    allagree = false;
                    break;
                }
            }
        }
        if (allagree) {

            this.gameEnd();
            // this.disband();
            this._disbandTimer = setTimeout(() => {
                this.disband();
            }, 2 * 1000);
        }
    }

    /**
     * 玩家申请解散房间
     * @param {*玩家id} userid 
     */
    applyDisband(userid) {
        console.log("    applyDisband(userid)", userid);
        let roomplayer = this.room_players[userid];
        if (roomplayer == null) {
            return MsgCode.ROOM_NOT_IN_ROOM;
        }
        roomplayer.isdisband = true;
        let senddata = {
            userid: userid,
            isagree: true,
            name: roomplayer.name,
        }
        this.broadcast('apply_disband', senddata);
        this.disband_state = true;
        this._disbandTimer = setTimeout(() => {
            this.disband();
        }, 30 * 1000);
    }

    /**
     * 玩家同意解散房间
     * @param {*玩家id} userid 
     */
    playerAgreeDisband(userid) {
        console.log("    playerAgreeDisband(userid)", userid);
        let roomplayer = this.room_players[userid];
        if (roomplayer == null) {
            return MsgCode.ROOM_NOT_IN_ROOM;
        }
        roomplayer.isdisband = true;
        let senddata = {
            userid: userid,
            isagree: true,
            name: roomplayer.name,
        }
        this.broadcast('agree_disband', senddata);
        this.checkDisband();
    }
    /**
     * 玩家拒绝解散房间
     * @param {*玩家id} userid 
     */
    playerDisagreeDisband(userid) {
        console.log("    playerDisagreeDisband(userid)", userid);
        let roomplayer = this.room_players[userid];
        if (roomplayer == null) {

            return MsgCode.ROOM_NOT_IN_ROOM;
        }
        // 重置房间状态
        this.disband_state = false;
        // 重置所有玩家的解散标记
        for (const uid in this.room_players) {
            if (this.room_players.hasOwnProperty(uid)) {
                let rplayer = this.room_players[uid];
                rplayer.isdisband = false;
            }
        }
        // 通知所有玩家 拒绝解散
        let senddata = {
            userid: userid,
            isagree: false,
            name: roomplayer.name,
        };
        this.broadcast('disagree_disband', senddata);
        // 销毁解散房间定时器
        clearTimeout(this._disbandTimer);
    }

    isPlayerAllReady() {

        if (Object.getOwnPropertyNames(this.room_players).length < RUNFAST_GAME_PLAYER_MAX) return false;

        for (const uid in this.room_players) {
            if (this.room_players.hasOwnProperty(uid)) {

                const roomplayer = this.room_players[uid];

                if (roomplayer.isready == false) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * 玩家准备
     * @param {*玩家id} userid 
     */
    playerReady(userid) {
        console.log("    playerReady(userid)", userid, this.room_players);
        let roomplayer = this.room_players[userid];
        if (roomplayer == null) {
            return;
        }

        if (roomplayer.isready) {
            return;
        }
        roomplayer.isready = true;
        this.broadcast('runfast_player_ready', {
            userid: userid
        });

        if (this.isPlayerAllReady()) {
            this.gameStart();
        }
    }

    getStarter() {
        if(this.bureaucounters.length > 0) {
            return this.bureaucounters[this.bureaucounters.length - 1].winner;
        }
        else {

            for (const uid in this.room_players) {
                var onePlayer = this.room_players[uid];
                var pais = onePlayer.pais;
                for(var i = 0; i < pais.length; i++) {
                    //红心3
                    if(pais[i] == 0x23) {
                        return onePlayer.seat;
                    }
                }
            }

            //根本不会走到这里
        }
        
    }



    dealCardsSendFunc() {
        console.log("    dealCardsSendFunc()");
        var playerCards = RunFastCardLogic.getRandomCards();
        var tindex = 0;

       
       // var test  = 
       // [
       // [0x03, 0x03, 0x03, 0x04, 0x04, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09],
       // [0x08, 0x08, 0x08, 0x09, 0x09, 0x09, 0x01, 0x02, 0x03],
       // [0x01, 0x02, 0x08, 0x08, 0x08],
       //  ];
       //  var ti = 0;

        for (const uid in this.room_players) {
            var onePlayer = this.room_players[uid];
            onePlayer.pais = playerCards.slice(tindex * RUNFAST_PLAYER_MAX_CARD, (tindex + 1) * RUNFAST_PLAYER_MAX_CARD);
            // onePlayer.pais = test[ti++];
            tindex = tindex + 1;
        }

        this.wStartUser = this.wCurrentUser = this.getStarter();
        console.log("wStartUser", this.wStartUser, "wCurrentUser", this.wCurrentUser);

        return (function(room_players, wStartUser, wCurrentUser, lCurRound, lMaxRound) {
            return function() {
                for (const uid in room_players) {
                    var onePlayer        = room_players[uid];

                    var Package          = {};
                    Package.lCurRound    = lCurRound;
                    Package.lMaxRound    = lMaxRound;
                    Package.wStartUser   = wStartUser;
                    Package.wCurrentUser = wCurrentUser;
                    Package.pais         = onePlayer.pais;


                    onePlayer.send("RunFast_GameStartSyn", Package);
                }
            }
        })(this.room_players, this.wStartUser, this.wCurrentUser, this.bureaucounters.length + 1, this.bureaucount);
    }


    /*游戏开始*/
    gameStart(userid) {
        this.gamestate = GameState.GAMING_STATE;
        this.roomstate = 1;
        var dealCardsSendFunc = this.dealCardsSendFunc();
        dealCardsSendFunc();
    }


    isGameFinal() {
        console.log("this.bureaucounters.length++++++++++", this.bureaucounters.length, this.bureaucounters);
        if(this.bureaucounters.length == this.bureaucount) {
            return true;
        }

        if(this.gamestate == GameState.GAME_END) return true;


        return false;
    }

    isPlayerFull(userid) {
        for (const uid in this.room_players) {
            if (this.room_players.hasOwnProperty(uid)) {
                const p = this.room_players[uid];
                if (p.userid == userid) {
                    return false;
                }
            }
        }
        return this.max_player_num <= Object.getOwnPropertyNames(this.room_players).length;
    }


    calculateBureau() {
        var cbhandcarddata = {};        //根据座位号统计

        var lgamescore = {};
        var cbwincount = {};
        var cblosecount = {};
        //记录
        var loggerscore = {};
        var lcurscore   = {};
        var lbombcount = {};
        var playerCount = Object.getOwnPropertyNames(this.room_players).length;

        for (var i = 0; i < playerCount; i++) {
            lgamescore[i]  = 0;
            cbwincount[i]  = 0;
            cblosecount[i] = 0;
            loggerscore[i] = [];
            lcurscore[i]   = 0;
            lbombcount[i]  = 0;
        }

        for (var i = 0; i < this.bureaucounters.length; i++) {
            var onebureau = this.bureaucounters[i];
            var onebureauscores = onebureau.countScore();

            for(var seat in onebureauscores) {
                var onebureauscore = onebureauscores[seat];
                lgamescore[seat] = lgamescore[seat] + onebureauscore;
                loggerscore[seat].push(onebureauscore);
            }

            var winner = onebureau.winner;
            for(var userid in this.room_players) {
                var seat = this.room_players[userid].seat;
                if(winner == seat) {
                    
                    cbwincount[seat] = cbwincount[seat] + 1;
                }
                else {
                    cblosecount[seat] = cblosecount[seat] + 1;
                }
            }
            
        }

        //记录
        for(var userid in this.room_players) {
            var roomplayer = this.room_players[userid];

            var rscores = loggerscore[roomplayer.seat];

            var tologscore = [];
            for(var i = 0; i < rscores.length; i++) {
                tologscore.push({userid:userid, score:rscores[i]});
            }
            

            if(this.bureaucounters.length > 0) {
                glog.logGame(userid, GameConfig.GameType.RUNFAST, tologscore);
            }

            var pais        = roomplayer.pais;
            cbhandcarddata[roomplayer.seat] = pais;
            
            RoomMgr.playerExitRoom(this.roomid, userid);
        }

        //本局赢的玩家
        var lwinner = null;
        //本局炸弹统计
        
        if(this.bureaucounters.length != 0) {
            lbombcount = {};

            lcurscore= this.bureaucounters[this.bureaucounters.length - 1].countScore();
            lwinner  = this.bureaucounters[this.bureaucounters.length - 1].winner;

            //本局炸弹统计
            for (const uid in this.room_players) {
                var room_player                 = this.room_players[uid];
                lbombcount[room_player.seat]    = room_player.bombcount;
            }
        }

        //
        var lastoutcarduser = this.getRoomUserBySeat(this.wOutCardUser);

        var lastoutcarddata = [];
        if(lastoutcarduser) lastoutcarddata = lastoutcarduser.getOutCards();
         
        return {
            lWinner:lwinner,
            lBombCount:lbombcount,
            lCurScore:lcurscore,
            lGameScore:lgamescore,
            cbWinCount:cbwincount,
            cbLoseCount:cblosecount,
            cbHandCardData:cbhandcarddata,
            wOutCardUser:this.wOutCardUser,
            cbCardData: lastoutcarddata
        }
    }

    /*小局结束*/
    gameEnd() {
         // var resultinfo = [];

         //    var cbwincount     = {};                                         //赢的局数
         //    var cblosecount    = {};                                         //输的局数
         //    var lcurscore      = {};                                         //根据座位号统计
         //    var cbhandcarddata = {};                                         //根据座位号统计
         //    var lbombcount     = {};                                         //炸弹统计
         //    var lWinner        = this.room_players[userid].seat;             //赢的玩家

         //    for (const uid in this.room_players) {

         //        var room_player = this.room_players[uid];
         //        var nickname    = room_player.name;
         //        var pais        = room_player.pais;
         //        var score       = room_player.score;

         //        cbhandcarddata[room_player.seat] = pais;
         //        lbombcount[room_player.seat]     = room_player.bombcount;
         //    }

         //    lcurscore = this.bureauCount(lbombcount, cbhandcarddata, lWinner);

         //    this.SetPlayerScore(lcurscore);

         //    for (var i = 0; i < this.bureaucounters.length; i++) {
         //        var onebureau = this.bureaucounters[i];
         //        var winner = onebureau.winner;
         //        for(var userid in this.room_players) {
         //            var seat = this.room_players[userid].seat;
         //            if(winner == seat) {
                        
         //                cbwincount[seat] = cbwincount[seat] + 1;
         //            }
         //            else {
         //                cblosecount[seat] = cblosecount[seat] + 1;
         //            }
         //        }
                
         //    }
        var bureauResult = this.calculateBureau();
         

        var Package = {
            lWinner:bureauResult.lWinner,
            lBombCount:bureauResult.lBombCount,
            lCurScore:bureauResult.lCurScore,
            lGameScore:bureauResult.lGameScore,
            cbWinCount:bureauResult.cbWinCount,
            cbLoseCount:bureauResult.cbLoseCount,
            cbHandCardData:bureauResult.cbHandCardData,
            wOutCardUser:this.wOutCardUser,
            cbCardData: bureauResult.cbCardData
        }

        this.broadcast('RunFast_GameConcludeSyn', Package);
    }

    /*游戏结束*/
    gameFinal(userseat, cboutcarddata) {
        console.log(".......gameFinal");
        super.gameEnd();

        // var lgamescore = {};
        // var cbwincount = {};
        // var cblosecount = {};
        // //记录
        // var loggerscore = {};
        // var lcurscore   = {};
        // var playerCount = Object.getOwnPropertyNames(this.room_players).length;

        // for (var i = 0; i < playerCount; i++) {
        //     lgamescore[i] = 0;
        //     cbwincount[i] = 0;
        //     cblosecount[i] = 0;
        //     loggerscore[i] = [];
        //     lcurscore[i]   = 0;
        // }

        // for (var i = 0; i < this.bureaucounters.length; i++) {
        //     var onebureau = this.bureaucounters[i];
        //     var onebureauscores = onebureau.countScore();

        //     for(var seat in onebureauscores) {
        //         var onebureauscore = onebureauscores[seat];
        //         lgamescore[seat] = lgamescore[seat] + onebureauscore;
        //         loggerscore[seat].push(onebureauscore);
        //     }

        //     var winner = onebureau.winner;
        //     for(var userid in this.room_players) {
        //         var seat = this.room_players[userid].seat;
        //         if(winner == seat) {
                    
        //             cbwincount[seat] = cbwincount[seat] + 1;
        //         }
        //         else {
        //             cblosecount[seat] = cblosecount[seat] + 1;
        //         }
        //     }
            
        // }

        // //记录
        // for(var userid in this.room_players) {
        //     var roomplayer = this.room_players[userid];
        //     var rscores = loggerscore[roomplayer.seat];

        //     var tologscore = [];
        //     for(var i = 0; i < rscores.length; i++) {
        //         tologscore.push({userid:userid, score:rscores[i]});
        //     }
            

        //     if(this.bureaucounters.length > 0) {
        //         glog.logGame(userid, GameConfig.GameType.RUNFAST, tologscore);
        //     }
            
        //     RoomMgr.playerExitRoom(this.roomid, userid);
        // }

        // if(this.bureaucounters.length != 0) {
        //     lcurscore= this.bureaucounters[this.bureaucounters.length - 1].countScore();
        // }

        var bureauResult = this.calculateBureau();
         

        var Package = {
            lWinner:bureauResult.lWinner,
            lBombCount:bureauResult.lBombCount,
            lCurScore:bureauResult.lCurScore,
            lGameScore:bureauResult.lGameScore,
            cbWinCount:bureauResult.cbWinCount,
            cbLoseCount:bureauResult.cbLoseCount,
            cbHandCardData:bureauResult.cbHandCardData,
            wOutCardUser:this.wOutCardUser,
            cbCardData: bureauResult.cbCardData
        }


        this.broadcast('RunFast_GameFinalResultSyn', Package);
        this.gamestate = GameState.GAME_END;

        let self = this;
        this.gameend_timer = setTimeout(() => {
            self.destroy();
        }, 30 * 1000);
    }

    isNewTurn() {
        for (const userid in this.room_players) {
            var onePlayer = this.room_players[userid];
            if (onePlayer.hasOutCards) return false;
        }
        return true;

        return false;
    }

    getRoomUserBySeat(seat) {
        for (const userid in this.room_players) {
            var onePlayer = this.room_players[userid];
            if (onePlayer.seat == seat) return onePlayer;
        }

        return null;
    }

    /*用户出牌*/
    RunFast_OutCardReq(userid, cbCardData) {
        console.log("RunFast_OutCardReq......", userid, cbCardData);
        //To-do 逻辑判断
        var userseat = this.room_players[userid].seat;

        if (this.wCurrentUser != userseat) {
            console.log("不是当前玩家出牌,错误!!");
            return;
        }

        var cboutcarddata = cbCardData.slice(0);

        var cardType = RunFastCardLogic.GetCardType(cboutcarddata);

        if (cardType == RunFastConfig.RUNFAST_INVALIDE) {
            console.log("牌型不对,错误!!");
            return;
        }


        if (this.wOutCardUser == INVALID_USER) {
            this.room_players[userid].pushOutCards(cboutcarddata);
        } else if (this.wOutCardUser == userseat) {
            this.room_players[userid].pushOutCards(cboutcarddata);
        } else {
            var lastoutcarduser = this.getRoomUserBySeat(this.wOutCardUser);
            var lastoutcarddata = lastoutcarduser.getOutCards();

            var cardType  = RunFastCardLogic.CompareCard(this.disarmbomb, cboutcarddata, lastoutcarddata, this.room_players[userid].pais);
           
            if (cardType != RunFastConfig.COMPARE_LEFT_BIG) {
                console.log("出牌错误,没有大于上家的牌", cardType);
                return;
            }

            this.room_players[userid].pushOutCards(cboutcarddata);
        }


        if(this.room_players[userid].pais.length == 1) this.bOnlyOnecard = true;

        if(cardType == RunFastConfig.RUNFAST_BOMB) {
            this.room_players[userid].bombcount = this.room_players[userid].bombcount + 1;
        }

        this.wOutCardUser = userseat;

        //To-do 最后一手牌,游戏结束
        if (this.room_players[userid].pais.length <= 0) {
           
            var lbombcount     = {};                                         //炸弹统计
            var lWinner        = this.room_players[userid].seat;             //赢的玩家
            var cbhandcarddata = {};

            for (const uid in this.room_players) {

                var room_player = this.room_players[uid];
                var nickname    = room_player.name;
                var pais        = room_player.pais;
                var score       = room_player.score;

                cbhandcarddata[room_player.seat] = pais;
                lbombcount[room_player.seat]     = room_player.bombcount;
            }

            
            var lcurscore = this.bureauCount(lbombcount, cbhandcarddata, lWinner);
            
            this.SetPlayerScore(lcurscore);

            if(this.isGameFinal()) {
                this.gameFinal(userseat, cboutcarddata);
                return;
            }
            else {
                this.gameEnd();
                this.roundStartInit();
            }

            return;
        }

        
        this.wCurrentUser = ((userseat + 1) % (Object.getOwnPropertyNames(this.room_players).length));

        var Package = {
            wCurrentUser: this.wCurrentUser,
            wOutCardUser: this.wOutCardUser,
            cbCardData: cboutcarddata,
            bOnlyOnecard:this.bOnlyOnecard,
        };

       
        this.broadcast('RunFast_OutCardSyn', Package);
    }

    SetPlayerScore(lgamescore) {
        console.log("lgamescore", lgamescore);
        for(var userid in this.room_players) {
            var roomplayer = this.room_players[userid];
            var seat = roomplayer.seat;
            var score = lgamescore[seat];
            roomplayer.score = roomplayer.score + score;

            console.log(userid, seat, roomplayer.score);
        }


        this.sendPlayerScoreChange();
    }

    /*用户放弃*/
    RunFast_PassCardReq(userid) {
        console.log("RunFast_PassCardReq", userid);

        var userseat = this.room_players[userid].seat;
        console.log("this.wCurrentUser", this.wCurrentUser, userseat, userid);
        if (this.wCurrentUser != userseat) {
            console.log("不是当前玩家出牌,不能放弃!!");
            return;
        }
        
        var cbHandCardData = this.room_players[userid].pais;

        if(this.wOutCardUser != INVALID_USER) {
            
            var lastoutcarduser = this.getRoomUserBySeat(this.wOutCardUser);
            var lastoutcarddata = lastoutcarduser.getOutCards();

            var promptresult = RunFastCardLogic.PromptOutCard(this.disarmbomb, cbHandCardData, lastoutcarddata);
            if(promptresult != null) {
                console.log("你有大于上家的牌,不能放弃!!");
                return;
            }
        }


        this.room_players[userid].clearOutCards();
        this.wCurrentUser  = ((userseat + 1) % (Object.getOwnPropertyNames(this.room_players).length));
        this.wPassCardUser = userseat;

        var cbTurnOver = 0;
        if (this.wCurrentUser == this.wOutCardUser) cbTurnOver = 1;

        var Package = {
            cbTurnOver: cbTurnOver,
            wCurrentUser: this.wCurrentUser,
            wPassCardUser: this.wPassCardUser
        }
        this.broadcast("RunFast_PassCardSyn", Package);
    }


    /**
     * 发送玩家积分变化
     * @param {*玩家id} userid 
     */
    sendPlayerScoreChange() {
        console.log("    sendPlayerScoreChange(userid)", userid);

        var cbscore = [];


        for(var userid in this.room_players) {
            var onescore = {};
            var roomplayer = this.room_players[userid];
            var seat = roomplayer.seat;

            onescore.wScoreUser = seat;
            onescore.lScore = roomplayer.score;
            cbscore.push(onescore);
        }

        let senddata = {
            cbScore:cbscore
        };

        this.broadcast('RunFast_ScoreChange', senddata);
    }


    isPlayerAllDisband() {
        var disbandusers = this.getPlayerAllDisband();
        if(disbandusers.length == Object.getOwnPropertyNames(this.room_players).length) {
            return true;
        }
        return false;
    }

    getPlayerAllDisband() {
        var disbandusers = [];

        for (const userid in this.room_players) {
            if (this.room_players.hasOwnProperty(userid)) {
                let roomplayer = this.room_players[userid];
               
                if (roomplayer && roomplayer.isdisband == DisbandState.AGREE) {
                    disbandusers.push(roomplayer.seat);
                }
            }
        }

        return disbandusers;
    }

    RunFast_DisbandQueryReq(userid, data) {
        
        var bIsAgree = data.bIsAgree;

        if(this.room_players[userid].isdisband != DisbandState.NONE) {
            return;
        }
        else if(!bIsAgree) {
            for (const userid in this.room_players) {
                var roomplayer = this.room_players[userid];
                roomplayer.isdisband = DisbandState.NONE;
            }

            var Package = {
                bNoDisbandUser: this.room_players[userid].seat
            }

            this.broadcast('RunFast_NoDisbandSyn', Package);

            return;
        }

        this.room_players[userid].isdisband = bIsAgree? DisbandState.AGREE : DisbandState.NOAGREE;


        
        if(this.isPlayerAllDisband()) {
            this.gameFinal();
        }
        else {
            var cbdisbanduser = this.getPlayerAllDisband();

            var Package = {
                cbDisbandUser:cbdisbanduser
            }

            this.broadcast('RunFast_DisbandSyn', Package);
        }

    }

    RunFast_ChatReq(userid, data) {
        var roomplayer = this.room_players[userid];
        if(!roomplayer) return;

        var Package = {
            seat:roomplayer.seat,
            idx:data.idx,
        }
        this.broadcast('RunFast_ChatSyn', Package);
    }

    RunFast_ExpressionReq(userid, data) {
        var roomplayer = this.room_players[userid];
        if(!roomplayer) return;

        var Package = {
            seat:roomplayer.seat,
            idx:data.idx,
        }
        this.broadcast('RunFast_ExpressionSyn', Package);
    }
}

module.exports = RunfastRoom;