var RunFastConfig = module.exports;
RunFastConfig.RUNFAST_GAME_PLAYER_MAX = 3;
RunFastConfig.RUNFAST_MAX_CARD = 48;
RunFastConfig.RUNFAST_PLAYER_MAX_CARD = 16;

RunFastConfig.GameState = 
{
	FREE_STATE:0,
	GAMING_STATE:1
}

RunFastConfig.COMPARE_INVALIDE = -1;
RunFastConfig.COMPARE_LEFT_BIG = 0;
RunFastConfig.COMPARE_RIGHT_BIG = 1;


RunFastConfig.INVALID_NUM = -1;
//牌型
RunFastConfig.RUNFAST_INVALIDE = -1;
RunFastConfig.RUNFAST_SINGLE = 0;               /*单张*/
RunFastConfig.RUNFAST_DOUBLE = 1;               /*对*/
RunFastConfig.RUNFAST_SINGLE_LINE = 2;          /*顺子，五张或五张以上牌点连续的牌*/
RunFastConfig.RUNFAST_DOUBLE_LINE = 3;          /*连对，两对或两对以上相连的牌*/
RunFastConfig.RUNFAST_THREE_LINE  = 4;			/*连三张*/
RunFastConfig.RUNFAST_THREE = 5;                /*三张*/
RunFastConfig.RUNFAST_THREE_ADD_ONE = 6;        /*三带一*/
RunFastConfig.RUNFAST_THREE_ADD_TWO = 7;        /*三带二*/

RunFastConfig.RUNFAST_BOMB = 8;                 /*炸弹，四张或四张以上牌点相同的牌*/
RunFastConfig.RUNFAST_THREE_ADD_TWO_BELOW = 9;	/*六带三*/

RunFastConfig.PROMPT_CARD_ALL = -1;

RunFastConfig.ONLYONE_CARD_INVALIDE = -1;

RunFastConfig.BureauConsume = 
{
	[4]: 1,
	[8]: 2
}
