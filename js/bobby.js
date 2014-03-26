/*
***************************************
*  designed by MATTHEW ZIPKIN 2012    *
* matthew(dot)zipkin(at)gmail(dot)com *
***************************************
*/

// based on knowledge at http://chessprogramming.wikispaces.com/Simplified+evaluation+function

// Evalutaion weights
var pValueWeight = 0.7;
var pPositionWeight = 0.6;
var oldPosWeight = 0.5;
var pMobilityWeight = 1;
var pOppWeight = -1;
// check weight not a multiplier but nominal point bonus (checkmate move is automatic best hero)
var pCheckWeight = 8;

// globals
var pValue = {p: 10, n: 32, b: 33, r: 50, q: 90, k: 2000};

var pPosition = {
p:
[[0,  0,  0,  0,  0,  0,  0,  0],
[50, 50, 50, 50, 50, 50, 50, 50],
[10, 10, 20, 30, 30, 20, 10, 10],
[5,  5, 10, 25, 25, 10,  5,  5],
[0,  0,  0, 20, 20,  0,  0,  0],
[5, -5,-10,  0,  0,-10, -5,  5],
[5, 10, 10,-20,-20, 10, 10,  5],
[0,  0,  0,  0,  0,  0,  0,  0]],

n:
[[-50,-40,-30,-30,-30,-30,-40,-50],
[-40,-20,  0,  0,  0,  0,-20,-40],
[-30,  0, 10, 15, 15, 10,  0,-30],
[-30,  5, 15, 20, 20, 15,  5,-30],
[-30,  0, 15, 20, 20, 15,  0,-30],
[-30,  5, 10, 15, 15, 10,  5,-30],
[-40,-20,  0,  5,  5,  0,-20,-40],
[-50,-40,-30,-30,-30,-30,-40,-50]],

b:
[[-20,-10,-10,-10,-10,-10,-10,-20],
[-10,  0,  0,  0,  0,  0,  0,-10],
[-10,  0,  5, 10, 10,  5,  0,-10],
[-10,  5,  5, 10, 10,  5,  5,-10],
[-10,  0, 10, 10, 10, 10,  0,-10],
[-10, 10, 10, 10, 10, 10, 10,-10],
[-10,  5,  0,  0,  0,  0,  5,-10],
[-20,-10,-10,-10,-10,-10,-10,-20]],

r:
[[0,  0,  0,  0,  0,  0,  0,  0],
[5, 10, 10, 10, 10, 10, 10,  5],
[-5,  0,  0,  0,  0,  0,  0, -5],
[-5,  0,  0,  0,  0,  0,  0, -5],
[-5,  0,  0,  0,  0,  0,  0, -5],
[-5,  0,  0,  0,  0,  0,  0, -5],
[-5,  0,  0,  0,  0,  0,  0, -5],
[ 0,  0,  0,  5,  5,  0,  0,  0]],

q:
[[-20,-10,-10, -5, -5,-10,-10,-20],
[-10,  0,  0,  0,  0,  0,  0,-10],
[-10,  0,  5,  5,  5,  5,  0,-10],
[-5,  0,  5,  5,  5,  5,  0, -5],
[0,  0,  5,  5,  5,  5,  0, -5],
[-10,  5,  5,  5,  5,  5,  0,-10],
[-10,  0,  5,  0,  0,  0,  0,-10],
[-20,-10,-10, -5, -5,-10,-10,-20]],

k:
[[-30,-40,-40,-50,-50,-40,-40,-30],
[-30,-40,-40,-50,-50,-40,-40,-30],
[-30,-40,-40,-50,-50,-40,-40,-30],
[-30,-40,-40,-50,-50,-40,-40,-30],
[-20,-30,-30,-40,-40,-30,-30,-20],
[-10,-20,-20,-20,-20,-20,-20,-10],
[20, 20,  0,  0,  0,  0, 20, 20],
[20, 30, 10,  0,  0, 10, 30, 20]],

kend:
[[-50,-40,-30,-20,-20,-30,-40,-50],
[-30,-20,-10,  0,  0,-10,-20,-30],
[-30,-10, 20, 30, 30, 20,-10,-30],
[-30,-10, 30, 40, 40, 30,-10,-30],
[-30,-10, 30, 40, 40, 30,-10,-30],
[-30,-10, 20, 30, 30, 20,-10,-30],
[-30,-30,  0,  0,  0,  0,-30,-30],
[-50,-30,-30,-30,-30,-30,-30,-50]]
}

/*
And of course "These values are for white, for black I use mirrored values." Additionally we should define where the ending begins. For me it might be either if:
Both sides have no queens or
Every side which has a queen has additionally no other pieces or one minorpiece maximum.
*/

// **** makes the best move for computer opponent
function bobbyGo(gamestate, team){
	// function can operate on imaginary boards to calculate possible check, etc.
	var board = gamestate.board;
	var pieces = gamestate.pieces;
	var jail0 = gamestate.jail0;
	var jail1 = gamestate.jail1;
	var ME = team;

	// teams
	var YOU = ((ME == 0) ? 1 : 0);

// console.log("********** STARTING MOVE **********");

	// get best move
	var bestFirstMove = evalBoard(gamestate, ME);

	// Make the hero move - triggered by the gui DIVs not by data objects (sorry)
	var goPiece = $("#piece_" + bestFirstMove.pc.i);
	ghostMove(goPiece, bestFirstMove.sq);
}


// ***** evaluates game board and returns object containing piece and where to move it
function evalBoard(gamestate, team, iteration){
	iteration = (iteration ? iteration : 0);

// console.log("********** ITERATION " + iteration + " **********");

	// function can operate on imaginary boards to calculate possible check, etc.
	var board = gamestate.board;
	var pieces = gamestate.pieces;
	var jail0 = gamestate.jail0;
	var jail1 = gamestate.jail1;
	var ME = team;

	// teams
	var YOU = ((ME == 0) ? 1 : 0);

	// initialize best move variable
	var hero = {pc: null, sq: null, score: 0};

	// go through each living piece
	var first = (ME * 16);
	var last = (first + 15);
	for (var i = first; i <= last; i++){
		if (!pieces[i].alive) {continue;}

// console.log(pieces[i].i, pieces[i].type);

		// get avail moves for this piece
		var pmoves = scrubMoves(pieces[i], legalmove(pieces[i], gamestate), gamestate);
		var pnumber = pmoves[0].length;
		if (pnumber == 0) {continue;}
		
		// try each move and see how many moves i would then have
		for (var j = 0; j < pnumber; j++){

// console.log("   trying move", pmoves[0][j], pmoves[1][j]);

			// make imaginary move and retrieve captured piece if any
			var moveGame = new Game(JSON.stringify(gamestate.pieces));
			var captured = move(moveGame.pieces[i], {xpos: pmoves[0][j], ypos: pmoves[1][j]}, moveGame);
			captured = ((captured) ? (pValueWeight * pValue[captured]) : 0);			

// console.log("      captured piece",captured);

			// get NEW avail moves for this piece AFTER original potential move
			var checkTest = checkforcheck(ME, moveGame, true);
			var pmovesAfter = (pMobilityWeight * checkTest[1]);

// console.log("      avail moves after",pmovesAfter);

			// and add bonus points for putting opponent in check
			var pCheck = (checkTest[0] ? pCheckWeight : 0);

			// checkmate means your search is over, end immedeately.
			if (checkTest[0])
				if (checkForCheckmate(ME, moveGame))
					return {pc: pieces[i], sq: {xpos: pmoves[0][j], ypos: pmoves[1][j]}, score: 20000, gamestate: gamestate};

// console.log("      check bonus", pCheck);

			// calculate board position bonus for target piece and square
			var newRank = (ME ? pmoves[1][j] : (7 - pmoves[1][j]));
			var oldRank = (ME ? pieces[i].ypos : (7 - pieces[i].ypos));
			var pieceType = ( (!gamestate.pieces[3].alive && !gamestate.pieces[27].alive && (pieces[i].type == 'k')) ? 'kend' : pieces[i].type);
			var oldPosition = pPosition[pieceType][oldRank][pieces[i].xpos];
			var newPosition = pPosition[pieceType][newRank][pmoves[0][j]];
			var position = (pPositionWeight * (newPosition - (oldPosWeight * oldPosition)));
			
// console.log("      position bonus",position);

			// DEPENDING ON DEPTH OF SEARCH, calculate best next move for opponent if target move were to occur
			var opponentScore = 0;
			if (iteration < iterationMAX){
				var opponentBest = evalBoard(moveGame, YOU, (iteration + 1));
				opponentScore = (pOppWeight * opponentBest.score);

// console.log("*********** opponent best move penalty", opponentScore);
// console.log("*********** opponent best move", opponentBest.pc.type, opponentBest.sq.xpos, opponentBest.sq.ypos);
			}

			// THE SCORING FORMULA
			var moveScore = pmovesAfter + captured + position + pCheck + opponentScore;

// console.log("         score",moveScore);

			// check for a winner (catch possible negative score error on first iteration)
			if ((hero.pc === null) || (moveScore > hero.score)){
				hero.pc = g.pieces[i];
				hero.sq = {xpos: pmoves[0][j], ypos: pmoves[1][j]};
				hero.score = moveScore;
			}
			else if (moveScore == hero.score){
				// randomly break tie on hero move
				if (Math.floor((Math.random()*2)+1)){
					hero.pc = g.pieces[i];
					hero.sq = {xpos: pmoves[0][j], ypos: pmoves[1][j]};
					hero.score = moveScore;
				}
			}


// console.log("         hero",hero.pc.type,hero.sq.xpos,hero.sq.ypos,hero.score);

		} // each move - index j
	} // each piece - index i

	return {pc: hero.pc, sq: hero.sq, score: hero.score, gamestate: gamestate};

}