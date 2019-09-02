var RunFastConfig = require('./RunFastConfig');
var RUNFAST_MAX_COUNT = 48
var RUNFAST_PLAYER_MAX_CARD = RunFastConfig.RUNFAST_PLAYER_MAX_CARD
var RUNFAST_MAX_CARD = RunFastConfig.RUNFAST_MAX_CARD
var COMPARE_INVALIDE = RunFastConfig.COMPARE_INVALIDE
var COMPARE_LEFT_BIG = RunFastConfig.COMPARE_LEFT_BIG
var COMPARE_RIGHT_BIG = RunFastConfig.COMPARE_RIGHT_BIG
var PROMPT_CARD_ALL = RunFastConfig.PROMPT_CARD_ALL


var __testPrint = function(obj, str) {

    if(obj == null) return;

    if(typeof(obj) == 'number') {
        str += obj.toString();
    }
    else if(typeof(obj) == 'boolean') {
        str += obj.toString();
    }
    else if(typeof(obj) == 'string') {
        str += '"';
        str += obj.toString();
        str += '"';
    }
    else if(typeof(obj) == 'function') {
        str += 'function:';
        str += obj.toString();
    }
    else if(typeof(obj) == 'object') {
        if(obj instanceof Array) {
            str += '[';
            for (var i = 0; i < obj.length; i++) {
                
                if(obj[i] == null) {
                	str += "null";
                }
                else if(typeof(obj[i]) == "undefined") {
                    str += obj[i].toString() + ":undefined";
                }
                else
                {

                    str = __testPrint(obj[i], str);
                }
                
                str += ',';
            }
            str += ']';
        }
        else {
            str += '{';
            for (var id in obj) {
                str += id.toString() + ':';
                if(obj[id] == null) {
                	str += "null";
                }
                else if(typeof(obj[id]) == "undefined") {
                    str += "undefined";
                }
                else
                {
                    str = __testPrint(obj[id], str);
                }
                
                str += ',';
            }
            str += '}';
        }
    }
    else if(typeof(obj) == 'undefined') {
        
    }


    
    return str;
}


var testPrint = function (obj) {
    console.log('[Printer]:' + __testPrint(obj, ""));
}


var RunFastCardLogic = function() {}

Array.prototype.max = function() {
	return Math.max.apply({}, this)
}


Array.prototype.min = function() {
	return Math.min.apply({}, this)
}

Array.prototype.random = function(num) {

	var result = [];

	while (result.length < num) {
		var rnum = this[Math.floor(Math.random() * (this.length - 1))];
		while (result.indexOf(rnum) != -1) {
			rnum = this[Math.floor(Math.random() * (this.length - 1))];
		}
		result.push(rnum);
	}

	return result;
}

Array.prototype.unique = function(){

	var res = [];
	var json = {};

	for (var i = 0; i < this.length; i++) {
		if (!json[this[i]]) {

			res.push(this[i]);
			json[this[i]] = 1;
		}
	}

	return res;
}

Array.prototype.touniquearray = function(){

	var res = [];
	var json = {};

	for (var i = 0; i < this.length; i++) {
		for(var j = 0; j < this[i].length; j++) {
			res.push(this[i][j]);
		}
	}

	return res;
}

RunFastCardLogic.pais = [
	0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, //方块 A - K
	0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, //梅花 A - K
	0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2D, //红桃 A - K
	0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D, //黑桃 A - K
	//0x41,0x42, 大小王乱入
];


RunFastCardLogic.pais2 = [
	0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, //方块 A - K
	0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x1B, 0x1C, 0x1D, //梅花 A - K
	0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x2B, 0x2C, 0x2D, //红桃 A - K
	0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x3B, 0x3C, 0x3D, //黑桃 A - K
	//0x41,0x42, 大小王乱入
];



var INVALID_NUM                 = RunFastConfig.INVALID_NUM;
var RUNFAST_INVALIDE            = RunFastConfig.RUNFAST_INVALIDE;
var RUNFAST_SINGLE              = RunFastConfig.RUNFAST_SINGLE;                 /*单张*/
var RUNFAST_DOUBLE              = RunFastConfig.RUNFAST_DOUBLE;                 /*对*/
var RUNFAST_THREE               = RunFastConfig.RUNFAST_THREE;                  /*三张*/
var RUNFAST_SINGLE_LINE         = RunFastConfig.RUNFAST_SINGLE_LINE;            /*顺子，五张或五张以上牌点连续的牌*/
var RUNFAST_DOUBLE_LINE         = RunFastConfig.RUNFAST_DOUBLE_LINE;            /*连对，两对或两对以上相连的牌*/
var RUNFAST_THREE_LINE          = RunFastConfig.RUNFAST_THREE_LINE;             /*三连，两对或两对以上相连的牌*/
var RUNFAST_THREE_ADD_ONE       = RunFastConfig.RUNFAST_THREE_ADD_ONE;          /*三带*/
var RUNFAST_THREE_ADD_TWO       = RunFastConfig.RUNFAST_THREE_ADD_TWO;          /*三带*/
var RUNFAST_BOMB                = RunFastConfig.RUNFAST_BOMB;                   /*炸弹，四张或四张以上牌点相同的牌*/
var RUNFAST_THREE_ADD_TWO_BELOW = RunFastConfig.RUNFAST_THREE_ADD_TWO_BELOW;    /*六带三*/

RunFastCardLogic.__getAllCards = function() {
	var card2 = [0x02, 0x12, 0x22, 0x32].random(1);
	var card1 = [0x01, 0x11, 0x21, 0x31].random(3);

	var cards = RunFastCardLogic.pais2.slice(0);
	return cards.concat(card2, card1);
}

RunFastCardLogic.getRandomCards = function() {
	var pais = RunFastCardLogic.__getAllCards();

	var nums = RUNFAST_MAX_CARD;

	var pIndexs = [];

	while (pIndexs.length < nums) {
		var tindex = Math.floor(Math.random() * (pais.length));

		while (pIndexs.indexOf(tindex) != -1) {
			tindex = Math.floor(Math.random() * (pais.length));
		}
		pIndexs.push(tindex);
	}

	var retCards = [];

	for (var i = 0; i < nums; i++) {
		retCards.push(pais[pIndexs[i]]);
	}

	return retCards;
}

RunFastCardLogic.GetLogicVal = function(onecardval) {
	var val = (onecardval & 0x0f);
	if (val < 3) return val + 13;
	return val;
}

RunFastCardLogic.GetLocalVal = function(onecardval) {
	var val = (onecardval & 0x0f);
	if (val > 13) return val - 13;
	return val;
}

RunFastCardLogic.GetCardVal = function(onecardval) {
	var val = (onecardval & 0x0f);
	return val;
}

RunFastCardLogic.ToLogicCards = function(cbCardData) {
	var logicVal = [];
	for (var i = 0; i < cbCardData.length; i++) {
		var val = RunFastCardLogic.GetLogicVal(cbCardData[i]);
		logicVal.push(val);
	}
	return logicVal;
}

RunFastCardLogic.LogicCardsToLocal = function(cbCardData) {
	var logicVal = [];
	for (var i = 0; i < cbCardData.length; i++) {
		var val = RunFastCardLogic.GetLocalVal(cbCardData[i]);
		logicVal.push(val);
	}
	return logicVal;
}


RunFastCardLogic.SortCardByVal = function(cbCardData) {
	if(!cbCardData) return;
	cbCardData.sort(function(a, b) {
		var ta = (a & 0x0f);
		var tb = (b & 0x0f);

		if (ta < 3 && ta > 0) ta = ta + 13;
		if (ta == 0) ta = 16;

		
		if (tb < 3 && tb > 0) tb = tb + 13;
		if (tb == 0) tb = 16;

		if (ta > tb) {
			return 1;
		}
		else {
			return -1;
		}

	});

}

RunFastCardLogic.GroupCardByVal = function(cbCardData) {
	if (cbCardData.length == 0) return null;

	var tcbCardData = cbCardData.slice(0);

	var groups = {};


	for (var i = 0; i < tcbCardData.length; i++) {
		var val = tcbCardData[i];

		if (groups[val]) {
			groups[val]++;
		} else {
			groups[val] = 1;
		}
	}

	return groups;
}

function AnalyseResult() {
	var cbBlockCount = [0, 0, 0, 0];
	var cbCardData = [
		[],
		[],
		[],
		[]
	];

	for (var i = 0; i < 4; i++) {
		for (var j = 0; j < RUNFAST_MAX_CARD; j++) {
			cbCardData[i][j] = 0;
		}
	}
	return {
		cbBlockCount: cbBlockCount,
		cbCardData: cbCardData
	}
}

//分析扑克
RunFastCardLogic.AnalysebCardData = function(cbCardData) {
	//设置结果
	var analyseresult = AnalyseResult();
	var cbCardCount = cbCardData.length;

		//扑克分析
	for (var i = 0; i < cbCardCount; i++) {
		//变量定义
		var cbSameCount = 1, cbCardValueTemp = 0;
		var cbLogicValue = RunFastCardLogic.GetLogicVal(cbCardData[i]);

		//搜索同牌
		for (var j = i + 1; j < cbCardCount; j++) {
			if (RunFastCardLogic.GetLogicVal(cbCardData[j]) != cbLogicValue) break;
			cbSameCount++;
		}
		var cbIndex = analyseresult.cbBlockCount[cbSameCount - 1]++;
		for (var j = 0; j < cbSameCount; j++) analyseresult.cbCardData[cbSameCount - 1][cbIndex * cbSameCount + j] = cbCardData[i + j];
		i += cbSameCount - 1;
	}

	for (var i = 0; i < 4; i++) RunFastCardLogic.SortCardByVal(analyseresult.cbCardData[i]);
	return analyseresult;
}

RunFastCardLogic.GetCardType = function(cbCardData) {
	RunFastCardLogic.SortCardByVal(cbCardData);
	var cbCardCount = cbCardData.length;

	//简单牌型
	if (cbCardCount == 0) {
		return RUNFAST_INVALIDE;
	} else if (cbCardCount == 1) {
		return RUNFAST_SINGLE;
	} else if (cbCardCount == 2) {
		//牌型判断
		if (RunFastCardLogic.GetLogicVal(cbCardData[0]) == RunFastCardLogic.GetLogicVal(cbCardData[1])) return RUNFAST_DOUBLE;

		return RUNFAST_INVALIDE;
	}

	//分析扑克
	var analyseresult = RunFastCardLogic.AnalysebCardData(cbCardData);

	//四牌判断
	if (analyseresult.cbBlockCount[3] > 0) {

		//牌型判断
		if ((analyseresult.cbBlockCount[3] == 1) && (cbCardCount == 4)) return RUNFAST_BOMB;
		if ((analyseresult.cbBlockCount[3] == 1) && (cbCardCount == 6)) return RUNFAST_THREE_ADD_ONE;
		//四带二,抄不?
		//if((analyseresult.cbBlockCount[3] == 1) && (cbCardCount == 8) && (analyseresult.cbBlockCount[1] == 2)) return RUNFAST_

		return RUNFAST_INVALIDE;
	}

	
	//三牌判断
	if (analyseresult.cbBlockCount[2] > 0) {

		//连牌判断
		if (analyseresult.cbBlockCount[2] > 1) {
			//变量定义

			var cbCardData = analyseresult.cbCardData[2][0];
			
			var cbFirstLogicValue = RunFastCardLogic.GetLogicVal(cbCardData);

			//错误过虑
			if(cbFirstLogicValue >= 15) return RUNFAST_INVALIDE;

			//连牌判断
			for (var i = 1; i < analyseresult.cbBlockCount[2]; i++) {

				var cbCardData = analyseresult.cbCardData[2][i * 3];

				if (cbFirstLogicValue != (RunFastCardLogic.GetLogicVal(cbCardData) - i)) return RUNFAST_INVALIDE;
			}
		} else if (cbCardCount == 3) return RUNFAST_THREE;

		
		//牌形判断
		if (analyseresult.cbBlockCount[2] * 3 == cbCardCount) return RUNFAST_THREE_LINE;
		if (analyseresult.cbBlockCount[2] * 4 == cbCardCount) return RUNFAST_THREE_ADD_ONE;
		if (analyseresult.cbBlockCount[2] * 5 == cbCardCount) return RUNFAST_THREE_ADD_TWO;
		if (analyseresult.cbBlockCount[2] * 5 >  cbCardCount) return RUNFAST_THREE_ADD_TWO_BELOW;
		return RUNFAST_INVALIDE;
	}

	//两张类型
	if (analyseresult.cbBlockCount[1] >= 2) {

		//变量定义
		var cbCardData = analyseresult.cbCardData[1][0];
		var cbFirstLogicValue = RunFastCardLogic.GetLogicVal(cbCardData);

		//错误过虑
		if (cbFirstLogicValue >= 15) return RUNFAST_INVALIDE;

		//连牌判断
		for (var i = 1; i < analyseresult.cbBlockCount[1]; i++) {
			var cbCardData = analyseresult.cbCardData[1][i * 2];
			
			if (cbFirstLogicValue != (RunFastCardLogic.GetLogicVal(cbCardData) - i)) return RUNFAST_INVALIDE;
		}

		//二连判断
		if ((analyseresult.cbBlockCount[1] * 2) == cbCardCount) return RUNFAST_DOUBLE_LINE;

		return RUNFAST_INVALIDE;
	}

	if ((analyseresult.cbBlockCount[0] >= 5) && (analyseresult.cbBlockCount[0] == cbCardCount)) {
		var cbCardData = analyseresult.cbCardData[0][0];
		var cbFirstLogicValue = RunFastCardLogic.GetLogicVal(cbCardData);

		//错误过虑
		if (cbFirstLogicValue >= 15) return RUNFAST_INVALIDE;
		
		for (var i = 1; i < analyseresult.cbBlockCount[0]; i++) {
			var cbCardData = analyseresult.cbCardData[0][i];

			
			if (cbFirstLogicValue != (RunFastCardLogic.GetLogicVal(cbCardData) - i)) return RUNFAST_INVALIDE;
		}

		return RUNFAST_SINGLE_LINE;
	}

	return RUNFAST_INVALIDE;
}


RunFastCardLogic.SortOutCardList = function(cbCardData) {
	var cbCardCount = cbCardData.length;

	if (cbCardType == RUNFAST_THREE_ADD_ONE || cbCardType == RUNFAST_THREE_ADD_TWO) {
		var analyseresult = RunFastCardLogic.AnalyseResult(cbCardData);

	}
}



RunFastCardLogic.IsThreeCommonCardType = function (cardType) {
	if((cardType == RUNFAST_THREE) || (cardType == RUNFAST_THREE_ADD_ONE) || (cardType == RUNFAST_THREE_LINE) || (cardType == RUNFAST_THREE_ADD_TWO) || (cardType == RUNFAST_THREE_ADD_TWO_BELOW)) return true;
	return false;
}

RunFastCardLogic.IsUpCardValid = function (cbUpCard, cbHandCardData) {
	var cbUpCardType = RunFastCardLogic.GetCardType(cbUpCard);
	if(cbUpCardType == RUNFAST_INVALIDE) return false;


	if(cbUpCardType != RUNFAST_THREE_ADD_TWO && RunFastCardLogic.IsThreeCommonCardType(cbUpCardType) && cbHandCardData.length != cbUpCard.length) return false;

	return true;
}

RunFastCardLogic.CompareCard = function(isdisarmbomb, cbUpCard, cbOutCardData, cbHandCardData) {
	
	var cbFirstCard = cbUpCard;
	var cbNextCard  = cbOutCardData;
	var cbHandCardData = cbHandCardData;
		//获取类型
	var cbFirstCount = cbFirstCard.length;
	var cbFirstType = RunFastCardLogic.GetCardType(cbFirstCard);

	var cbNextCount = cbNextCard.length;
	var cbNextType = RunFastCardLogic.GetCardType(cbNextCard);


	//类型判断
	if (cbFirstType == RUNFAST_INVALIDE) return COMPARE_INVALIDE;
	if (cbNextType == RUNFAST_INVALIDE) return COMPARE_INVALIDE;

	//炸弹判断
	if ((cbFirstType != RUNFAST_BOMB) && (cbNextType == RUNFAST_BOMB)) return COMPARE_RIGHT_BIG;
	if ((cbFirstType == RUNFAST_BOMB) && (cbNextType != RUNFAST_BOMB)) return COMPARE_LEFT_BIG;
	
	//规则判断
	if(!RunFastCardLogic.IsThreeCommonCardType(cbFirstType) || !RunFastCardLogic.IsThreeCommonCardType(cbNextType)) {
		if((cbFirstType != cbNextType) || (cbFirstCount != cbNextCount)) {
			return COMPARE_INVALIDE;
		}
	}

	//判断不能拆炸弹
	if(isdisarmbomb == 0) {

		var exists = false;
		//不可以拆 
		var results = RunFastCardLogic.PromptOutCardNullByType(cbHandCardData, RUNFAST_BOMB);
		if(results && cbFirstType != RUNFAST_BOMB) {
			for(var i = 0; i < results.length; i++) {
				if(cbFirstCard.indexOf(results[i][0]) != -1 )  return  COMPARE_INVALIDE;
			}	
		}
		
	}
	
	
	//开始对比
	switch(cbNextType) 
	{
		case RUNFAST_SINGLE:
		case RUNFAST_DOUBLE:
		case RUNFAST_SINGLE_LINE:
		case RUNFAST_DOUBLE_LINE:
		case RUNFAST_THREE_LINE:
		case RUNFAST_BOMB:
		{

			var cbNextLogicValue = RunFastCardLogic.GetLogicVal(cbNextCard[0]);
			var cbFirstLogicValue = RunFastCardLogic.GetLogicVal(cbFirstCard[0]);
			
			if(cbNextLogicValue > cbFirstLogicValue) return COMPARE_RIGHT_BIG;
			if(cbNextLogicValue < cbFirstLogicValue) return COMPARE_LEFT_BIG;
			return COMPARE_INVALIDE;
		}

		case RUNFAST_THREE:
		case RUNFAST_THREE_ADD_ONE:
		case RUNFAST_THREE_ADD_TWO:
		// {
		// 	//分析扑克
		// 	var NextResult = RunFastCardLogic.AnalysebCardData(cbNextCard);
		// 	var FirstResult = RunFastCardLogic.AnalysebCardData(cbFirstCard);

		// 	//获取数值
		// 	var cbNextLogicValue = RunFastCardLogic.GetLogicVal(NextResult.cbCardData[2][0]);
		// 	var cbFirstLogicValue = RunFastCardLogic.GetLogicVal(FirstResult.cbCardData[2][0]);

		// 	//对比扑克
		// 	if(cbNextLogicValue > cbFirstLogicValue) return COMPARE_RIGHT_BIG;
		// 	if(cbNextLogicValue < cbFirstLogicValue) return COMPARE_LEFT_BIG;
		// 	return COMPARE_INVALIDE;
		// }
		case RUNFAST_THREE_ADD_TWO_BELOW:
		{
			//这里数量判断

			//分析扑克
			var NextResult = RunFastCardLogic.AnalysebCardData(cbNextCard);
			var FirstResult = RunFastCardLogic.AnalysebCardData(cbFirstCard);

			if(NextResult.cbBlockCount[2] != FirstResult.cbBlockCount[2]) return COMPARE_INVALIDE;

			//获取数值
			var cbNextLogicValue = RunFastCardLogic.GetLogicVal(NextResult.cbCardData[2][0]);
			var cbFirstLogicValue = RunFastCardLogic.GetLogicVal(FirstResult.cbCardData[2][0]);

			//对比扑克
			// if(handleFirstAndNextCallback) {
			// 	if(handleFirstAndNextCallback(cbFirstCard, cbNextCard)) return COMPARE_INVALIDE;
			// }
			if(cbHandCardData && cbHandCardData.length != cbFirstCount) return COMPARE_INVALIDE;
			if(cbNextLogicValue > cbFirstLogicValue) return COMPARE_RIGHT_BIG;
			if(cbNextLogicValue < cbFirstLogicValue) return COMPARE_LEFT_BIG;
		}
	}

	return COMPARE_INVALIDE
}

var cloneObj = function(obj){
    var str, newobj = obj.constructor === Array ? [] : {};
    if(typeof obj !== 'object'){
        return;
    } else if(JSON){
        str = JSON.stringify(obj), //系列化对象
        newobj = JSON.parse(str); //还原
    } else {
        for(var i in obj){
            newobj[i] = typeof obj[i] === 'object' ? 
            cloneObj(obj[i]) : obj[i]; 
        }
    }
    return newobj;
};


RunFastCardLogic.PromptCards = function(cbCardData, cardType, cardCount) {

}

RunFastCardLogic.AnalysebCardData3 = function (cbCardData, isdisarmbomb) {
	//设置结果
	var analyseresult = AnalyseResult();
	var cbCardCount = cbCardData.length;

	//扑克分析
	for (var i = 0; i < cbCardCount; i++) {
		//变量定义
		var cbSameCount = 1, cbCardValueTemp = 0;
		var cbLogicValue = RunFastCardLogic.GetLogicVal(cbCardData[i]);

		//搜索同牌
		for (var j = i + 1; j < cbCardCount; j++) {
			if (RunFastCardLogic.GetLogicVal(cbCardData[j]) != cbLogicValue) break;
			cbSameCount++;
		}


		for(var k = 1; k <= cbSameCount; k++) {
			if(isdisarmbomb == 0 && k < 4 && cbSameCount == 4) continue;
			var cbIndex = analyseresult.cbBlockCount[k - 1]++;

			for (var j = 0; j < k; j++) analyseresult.cbCardData[k - 1][cbIndex * k + j] = cbCardData[i + j];
		}
		
		i += cbSameCount - 1;
	}

	for (var i = 0; i < 4; i++) RunFastCardLogic.SortCardByVal(analyseresult.cbCardData[i]);
	
	return analyseresult;
}

RunFastCardLogic.Remove2 = function (array) {
	for(var i = 0; i < array.length; i++) {
		if((array[i] & 0x0f) == 2) {
			array.splice(i,1);
		}
	}

}

RunFastCardLogic.GetSeries = function (array, limit) {

	var serarray = cloneObj(array);
	RunFastCardLogic.Remove2(serarray);

	if(!serarray) return null;
	
	function _GetSeries (serarray, index, num, result) {
		if(serarray.length <= index ) return;

		var anum = num;
		if(serarray[index] == 0) return;
		
		if(RunFastCardLogic.GetLogicVal(serarray[index]) == RunFastCardLogic.GetLogicVal(num) + 1) {
			anum = num + 1;
			result.push(serarray[index]);
		}
		else if(RunFastCardLogic.GetLogicVal(serarray[index]) == RunFastCardLogic.GetLogicVal(num)) {
			result.push(serarray[index]);
		}

		_GetSeries(serarray, index + 1, anum, result);
	}

	
	var retResult = [];
	for (var i = 1; i < serarray.length;) {
		var result = [serarray[i - 1]] ;
		_GetSeries(serarray, i, serarray[i - 1], result);
		if(result.length >= limit) {
			retResult.push(result);
			i = i + result.length;
		}
		else {
			i++;
		}
	}

	if(retResult.length == 0) return null;

	return retResult;
}

RunFastCardLogic.PromptOutCardNullByType = function(cbHandCardData, cardType) {

	var result = [];

	//分析扑克
	var HandAnalyseresult = RunFastCardLogic.AnalysebCardData(cbHandCardData);

	//开始对比
	switch(cardType) 
	{
		case RUNFAST_SINGLE:
		case RUNFAST_DOUBLE:
		case RUNFAST_THREE:
		case RUNFAST_BOMB:
		{
			var tempMap = {
				[RUNFAST_SINGLE]:0,
				[RUNFAST_DOUBLE]:1,
				[RUNFAST_THREE]:2,
				[RUNFAST_BOMB]:3,
			}
			
			var index = tempMap[cardType];
			for (var j = 0; j < HandAnalyseresult.cbBlockCount[index]; j++) {
				
				var oneresult = [];

				for(var k = 0; k <= index; k++) {
					oneresult.push(HandAnalyseresult.cbCardData[index][j*(index+1) + k]);
				}


				result.push(oneresult);
			}
			break;
		}
		case RUNFAST_SINGLE_LINE:
		case RUNFAST_DOUBLE_LINE:
		case RUNFAST_THREE_LINE:
		{
			var tempMap = {
				[RUNFAST_SINGLE_LINE]:0,
				[RUNFAST_DOUBLE_LINE]:1,
				[RUNFAST_THREE_LINE]:2,
			};

			var limits = {
				[RUNFAST_SINGLE_LINE]:5,
				[RUNFAST_DOUBLE_LINE]:4,
				[RUNFAST_THREE_LINE]:6,
			};
		
			var index = tempMap[cardType];

			var HandAnalyseresult3 = RunFastCardLogic.AnalysebCardData3(cbHandCardData, false);
			var rresult = RunFastCardLogic.GetSeries(HandAnalyseresult3.cbCardData[index], limits[cardType]);

			if(rresult) result = result.concat(rresult);
			break;
		}
		case RUNFAST_THREE_ADD_ONE:
		{
			var promptThreeResult = null;

			var promptThreeResult1 = RunFastCardLogic.PromptOutCardNullByType(cbHandCardData, RUNFAST_THREE);
			
			if(promptThreeResult1) {
				var HandResult = RunFastCardLogic.AnalysebCardData(cbHandCardData);
				var singles = RunFastCardLogic.GetSingles(HandResult, promptThreeResult1, 2, 1);
				
				
				for (var i = 0; i < promptThreeResult1.length; i++) {
					
					if(singles[i].length >= Math.floor(1)) {
						for(var j = 0; j < Math.floor(1); j++) {
							promptThreeResult1[i].push(singles[i][j]);
						}
						
						result.push(promptThreeResult1[i]);
					}
				}
			}

			var promptThreeResult2 = RunFastCardLogic.PromptOutCardNullByType(cbHandCardData, RUNFAST_THREE_LINE);

			if(promptThreeResult2) {

				var HandResult = RunFastCardLogic.AnalysebCardData(cbHandCardData);

				var singles = RunFastCardLogic.GetSingles(HandResult, promptThreeResult2, 2, Math.floor(promptThreeResult2[0].length/3));
				
				for (var i = 0; i < promptThreeResult2.length; i++) {
					
					if(singles[i].length >= Math.floor(promptThreeResult2[i].length/3)) {
						for(var j = 0; j < Math.floor(promptThreeResult2[i].length/3); j++) {
							promptThreeResult2[i].push(singles[i][j]);
						}
						
						result.push(promptThreeResult2[i]);
					}
				}
			}



			break;
		}
		case RUNFAST_THREE_ADD_TWO:
		{
			
			var promptThreeResult = RunFastCardLogic.PromptOutCardNullByType(cbHandCardData, RUNFAST_THREE);
			
			if(promptThreeResult) {
				var HandResult = RunFastCardLogic.AnalysebCardData(cbHandCardData);
				var singles = RunFastCardLogic.GetSingles(HandResult, promptThreeResult, 2, 2);
				for (var i = 0; i < promptThreeResult.length; i++) {
					
					if(singles[i].length >= Math.floor(1) * 2) {
						for(var j = 0; j < Math.floor(1); j++) {
							for(var k = 0; k < 2; k++) promptThreeResult[i].push(singles[i][j + k]);	
						}
						
						result.push(promptThreeResult[i]);
					}
				}
			}


			var promptThreeResult2 = RunFastCardLogic.PromptOutCardNullByType(cbHandCardData, RUNFAST_THREE_LINE);

			if(promptThreeResult2) {

				var HandResult = RunFastCardLogic.AnalysebCardData(cbHandCardData);

				var singles = RunFastCardLogic.GetSingles(HandResult, promptThreeResult2, 2, Math.floor(promptThreeResult2[0].length/3) * 2);
				
				for (var i = 0; i < promptThreeResult2.length; i++) {
					if(singles[i].length >= Math.floor(promptThreeResult2[i].length/3) * 2) {
						var len = Math.floor(promptThreeResult2[i].length/3) * 2;

						for(var k = 0; k < len; k++) {
							promptThreeResult2[i].push(singles[i][k]);
						}
						
						result.push(promptThreeResult2[i]);
					}
				}
			}
			
			break;
		}
	}
	
	if(result.length == 0) return null;
	
	return result;
}

// RunFastCardLogic.PromptOutCardNullOnlyRUNFAST_THREE_ADD_TWO = function(cbHandCardData) {
// 		var result = [];

// 	// var cardTypes = [RUNFAST_INVALIDE,RUNFAST_SINGLE,RUNFAST_DOUBLE,RUNFAST_THREE,RUNFAST_SINGLE_LINE,RUNFAST_DOUBLE_LINE,RUNFAST_THREE_LINE,RUNFAST_THREE_ADD_ONE,RUNFAST_THREE_ADD_TWO,RUNFAST_BOMB];
// 	var cardTypes = [RUNFAST_INVALIDE,RUNFAST_SINGLE,RUNFAST_DOUBLE, RUNFAST_SINGLE_LINE,RUNFAST_DOUBLE_LINE,RUNFAST_THREE_ADD_TWO,RUNFAST_BOMB];

// 	for (var i = 0; i < cardTypes.length; i++) {
// 		var cardType = cardTypes[i];
// 		var ret = RunFastCardLogic.PromptOutCardNullByType(cbHandCardData,cardType);
// 		if(ret) {
// 			result = result.concat(ret);
// 		}
// 	}

// 	if(result.length != 0) {
// 				return result;
// 	}
// 	return null;
// }

// RunFastCardLogic.PromptOutCardNull = function(cbHandCardData) {

// 	var result = [];

// 	// var cardTypes = [RUNFAST_INVALIDE,RUNFAST_SINGLE,RUNFAST_DOUBLE,RUNFAST_THREE,RUNFAST_SINGLE_LINE,RUNFAST_DOUBLE_LINE,RUNFAST_THREE_LINE,RUNFAST_THREE_ADD_ONE,RUNFAST_THREE_ADD_TWO,RUNFAST_BOMB];
// 	var cardTypes = [RUNFAST_INVALIDE,RUNFAST_SINGLE,RUNFAST_DOUBLE,RUNFAST_THREE,RUNFAST_SINGLE_LINE,RUNFAST_DOUBLE_LINE,RUNFAST_THREE_ADD_ONE,RUNFAST_THREE_ADD_TWO,RUNFAST_BOMB];

// 	for (var i = 0; i < cardTypes.length; i++) {
// 		var cardType = cardTypes[i];
// 		var ret = RunFastCardLogic.PromptOutCardNullByType(cbHandCardData,cardType);
// 		if(ret) result = result.concat(ret);
// 	}

// 	if(result.length != 0) {
// 				return result;
// 	}
// 	return null;
// }


RunFastCardLogic.PromptOutCardNull = function (cbHandCardData) {
	var result = [];

	var cardTypes = [RUNFAST_INVALIDE,RUNFAST_SINGLE,RUNFAST_DOUBLE,RUNFAST_SINGLE_LINE,RUNFAST_DOUBLE_LINE,RUNFAST_THREE_ADD_TWO,RUNFAST_BOMB];

	for(var i = 0; i < cardTypes.length; i++) {
		var cardType = cardTypes[i];
		var ret = RunFastCardLogic.PromptOutCardNullByType(cbHandCardData,cardType);
		if(ret) result = result.concat(ret);
	}


	
	var threeCardTypes = [RUNFAST_THREE, RUNFAST_THREE_ADD_ONE];
	for(var i = 0; i < threeCardTypes.length; i++) {
		var cardType = threeCardTypes[i];
		var ret = RunFastCardLogic.PromptOutCardNullByType(cbHandCardData,cardType);
		
		if(!ret) continue;
		for(var j = 0; j < ret.length; j++) {
			var oneRet = ret[j];
			if(oneRet.length == cbHandCardData.length) {
				result.push(oneRet);
			}
		}
	}

	return result;
}

//从连续数组中取数组
RunFastCardLogic.GetSeriesArray = function (array, numofarray, num) {
		if(!array || !numofarray || !num) return null;


	if(array.length < numofarray * num) return null;

	var result = [];

	for(var i = 0; i < Math.floor(array.length/num) - numofarray + 1; i++) {
		var oneresult = [];
		for(var j = i; j < i + numofarray; j++) {
			for(var k = 0; k < num; k++) {
				oneresult.push(array[j * num]);
			}
		}
		result.push(oneresult);
	}

	if(result.length == 0) return null;
	return result;
}

//取单
RunFastCardLogic.GetSingles = function (analyseresult, cards, cardindexofanalyse,  singlenum) {
	var result = [];

	var singles = [];
	for (var j = 0; j < analyseresult.cbBlockCount[0]; j++) {
		singles.push(analyseresult.cbCardData[0][j]);

	}
	
	RunFastCardLogic.SortCardByVal(singles);

	for(var i = 0; i < cards.length; i++) {
		result[i] = cloneObj(singles);
	}

	
	if(result[0] && result[0].length < singlenum && cardindexofanalyse != 0) {

		var cardindexofanalyseresult = [];
		
		for(var i = 0; i < cards.length; i++) {
			cardindexofanalyseresult[i] = [];
		}

		for(var k = 0; k < analyseresult.cbBlockCount[cardindexofanalyse] * (cardindexofanalyse + 1); k++) {

			if(analyseresult.cbCardData[cardindexofanalyse][k] == 0) break;

			
			for(var i = 0; i < cards.length; i++) {
				
				var exists = false;
				for(var j = 0; j < cards[i].length; j++) {
					
					if(cards[i][j] == analyseresult.cbCardData[cardindexofanalyse][k]) {
						exists = true;
						break;
					}
				}
				if(!exists) cardindexofanalyseresult[i].push(analyseresult.cbCardData[cardindexofanalyse][k]);
			}
		}
			
		var leftresult = [];

		for(var iindex = 1; iindex < cardindexofanalyse; iindex++) {

			for (var j = 0; j < analyseresult.cbBlockCount[iindex] * (iindex + 1); j++) {
			
				leftresult.push(analyseresult.cbCardData[iindex][j]);
			}	
		}

		
		var rightresult = [];

		for(var iindex = cardindexofanalyse + 1; iindex < 4; iindex++) {

			for (var j = 0; j < analyseresult.cbBlockCount[iindex] * (iindex + 1); j++) {
			
				rightresult.push(analyseresult.cbCardData[iindex][j]);

			}	
		}

		for(var i = 0; i < cards.length; i++) {
			result[i] = result[i].concat(leftresult);
			result[i] = result[i].concat(rightresult);
			result[i] = result[i].concat(cardindexofanalyseresult[i]);
			RunFastCardLogic.SortCardByVal(result[i]);
		}
		
	}

	return result;
}


RunFastCardLogic.PromptOutCardNotNullByType = function(cbHandCardData, cardType, cardLen, isdisarmbomb) {
	console.log("PromptOutCardNotNullByType", cbHandCardData, cardType, cardLen);
	var result = [];

	//分析扑克
	var HandAnalyseresult = RunFastCardLogic.AnalysebCardData3(cbHandCardData, isdisarmbomb);
	
	//开始对比
	switch(cardType) 
	{
		case RUNFAST_SINGLE:
		case RUNFAST_DOUBLE:
		case RUNFAST_THREE:
		case RUNFAST_BOMB:
		{
			var tempMap = {
				[RUNFAST_SINGLE]:0,
				[RUNFAST_DOUBLE]:1,
				[RUNFAST_THREE]:2,
				[RUNFAST_BOMB]:3,
			}
			
			var index = tempMap[cardType];
			
			for (var j = 0; j < HandAnalyseresult.cbBlockCount[index]; j++) {
				
				var oneresult = [];

				for(var k = 0; k < index + 1; k++) {
					oneresult.push(HandAnalyseresult.cbCardData[index][j*(index+1) + k]);
				}
				if(oneresult.length != 0)result.push(oneresult);
			}
			break;
		}
		case RUNFAST_SINGLE_LINE:
		case RUNFAST_DOUBLE_LINE:
		case RUNFAST_THREE_LINE:
		{
			var tempMap = {
				[RUNFAST_SINGLE_LINE]:0,
				[RUNFAST_DOUBLE_LINE]:1,
				[RUNFAST_THREE_LINE]:2,
			};
			var limits = {
				[RUNFAST_SINGLE_LINE]:5,
				[RUNFAST_DOUBLE_LINE]:4,
				[RUNFAST_THREE_LINE]:6,
			};
			var index = tempMap[cardType];
			
			var rresult = RunFastCardLogic.GetSeries(HandAnalyseresult.cbCardData[index], limits[cardType]);
			
			if(rresult) {
				for(var i = 0; i < rresult.length; i++) {
					var orresult = rresult[i];
				
					var aresult = RunFastCardLogic.GetSeriesArray(orresult, Math.floor(cardLen/(index + 1)), index + 1);
					
					if(aresult) {
						result = result.concat(aresult);
					}
									}
			}
			
			break;
		}
		case RUNFAST_THREE_ADD_ONE:
		{	
			var promptThreeResult;
			if(cardLen == 4) {
				promptThreeResult = RunFastCardLogic.PromptOutCardNotNullByType(cbHandCardData, RUNFAST_THREE, cardLen, isdisarmbomb);
			}
			else {
				promptThreeResult = RunFastCardLogic.PromptOutCardNotNullByType(cbHandCardData, RUNFAST_THREE_LINE, cardLen, isdisarmbomb);
			}

			if(promptThreeResult) {
				var HandResult = RunFastCardLogic.AnalysebCardData(cbHandCardData);
				var singles = RunFastCardLogic.GetSingles(HandResult, promptThreeResult, 2, Math.floor(cardLen/3));
				
				
				for (var i = 0; i < promptThreeResult.length; i++) {
					
					if(singles[i].length >= Math.floor(cardLen/3)) {
						for(var j = 0; j < Math.floor(cardLen/3); j++) {
							promptThreeResult[i].push(singles[i][j]);
						}
						
						result.push(promptThreeResult[i]);
					}
				}
			}
			
			

			break;
		}
		case RUNFAST_THREE_ADD_TWO:
		{
			
			var promptThreeResult;
			if(cardLen == 4) {
				promptThreeResult = RunFastCardLogic.PromptOutCardNotNullByType(cbHandCardData, RUNFAST_THREE, cardLen, isdisarmbomb);
			}
			else {
				promptThreeResult = RunFastCardLogic.PromptOutCardNotNullByType(cbHandCardData, RUNFAST_THREE_LINE, cardLen, isdisarmbomb);
			}
			if(promptThreeResult) {
				var HandResult = RunFastCardLogic.AnalysebCardData(cbHandCardData);
				var singles = RunFastCardLogic.GetSingles(HandResult, promptThreeResult, 2, 2);
				
				
				for (var i = 0; i < promptThreeResult.length; i++) {
					
					if(singles[i].length >= Math.floor(cardLen/3) * 2) {
						for(var j = 0; j < Math.floor(cardLen/3); j++) {
							for(var k = 0; k < 2; k++) {
								promptThreeResult[i].push(singles[i][j + k]);	
							}
							
						}
						
						result.push(promptThreeResult[i]);
					}
				}

			}
			break;
		}
		
	}

	if(result.length == 0) return null;
	
	return result;
}

RunFastCardLogic.CompareCardAndSet = function(isdisarmbomb, cbOutCardData, cbPromptCards, cbHandCardData) {
	var result = [];

	if(cbPromptCards) {
		for (var i = 0; i < cbPromptCards.length; i++) {
			var retResult = cbPromptCards[i];
			
			var compareResult = RunFastCardLogic.CompareCard(isdisarmbomb, retResult, cbOutCardData, cbHandCardData);
			
			if(compareResult == COMPARE_LEFT_BIG) {
				result.push(retResult);
			}
		}
	}

	if(result.length != 0) {
		return result;
	}

	return null;
}


RunFastCardLogic.PromptOutCardNotNull = function(isdisarmbomb, cbHandCardData, cbOutCardData) {
	var HandResult = RunFastCardLogic.AnalysebCardData(cbHandCardData);
	//获取牌型
	var cbOutCardDataType = RunFastCardLogic.GetCardType(cbOutCardData);
	
	//首先分析空的
	//
	var cbPromptCards = null;
	var promptResult = null;

	cbPromptCards = RunFastCardLogic.PromptOutCardNullByType(cbHandCardData, cbOutCardDataType);
	if(cbPromptCards) promptResult = RunFastCardLogic.CompareCardAndSet(isdisarmbomb, cbOutCardData, cbPromptCards, cbHandCardData);

	if(cbOutCardDataType != RUNFAST_BOMB) {
		var ret = RunFastCardLogic.PromptOutCardNullByType(cbHandCardData, RUNFAST_BOMB);
		if(ret) {
			if(promptResult) {
				promptResult = promptResult.concat(ret);
			}
			else {
				promptResult = ret;
			}
		}
	}

	//分析不为空的


	cbPromptCards = RunFastCardLogic.PromptOutCardNotNullByType(cbHandCardData, cbOutCardDataType, cbOutCardData.length, isdisarmbomb);
	if(cbPromptCards) promptResult = RunFastCardLogic.CompareCardAndSet(isdisarmbomb, cbOutCardData, cbPromptCards, cbHandCardData);

	var cbHandCardDataCardType = RunFastCardLogic.GetCardType(cbHandCardData);
	if(RunFastCardLogic.IsThreeCommonCardType(cbOutCardDataType) && cbOutCardDataType != cbHandCardDataCardType) {
		
		promptResult == null? promptResult = [cbHandCardData]:(promptResult.push(cbHandCardData));
	}

	return promptResult;
}


RunFastCardLogic.PromptOutCard = function(isdisarmbomb, cbHandCardData, cbOutCardData) {

	RunFastCardLogic.SortCardByVal(cbHandCardData);
	RunFastCardLogic.SortCardByVal(cbOutCardData);
	if(cbOutCardData == null) {
		// if(result) {
		// 	return RunFastCardLogic.PromptOutCardNullOnlyRUNFAST_THREE_ADD_TWO(cbHandCardData);	
		// }
		// else {
		// 	return RunFastCardLogic.PromptOutCardNull(cbHandCardData);	
		// }
		return RunFastCardLogic.PromptOutCardNull(cbHandCardData);	
	}
	else {
		
		return RunFastCardLogic.PromptOutCardNotNull(isdisarmbomb, cbHandCardData, cbOutCardData);
	}
}



module.exports = RunFastCardLogic;
