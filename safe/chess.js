/*
***************************************
*  designed by MATTHEW ZIPKIN 2012    *
* matthew(dot)zipkin(at)gmail(dot)com *
***************************************
*/

// initialize globals
var g = null;
var squaresize = 80;
var startingPosition = 
[{ team: 0, type: "r", alive: true, xpos: 0, ypos: 0},
{ team: 0, type: "n", alive: true, xpos: 1, ypos: 0},
{ team: 0, type: "b", alive: true, xpos: 2, ypos: 0},
{ team: 0, type: "q", alive: true, xpos: 3, ypos: 0},
{ team: 0, type: "k", alive: true, xpos: 4, ypos: 0},
{ team: 0, type: "b", alive: true, xpos: 5, ypos: 0},
{ team: 0, type: "n", alive: true, xpos: 6, ypos: 0},
{ team: 0, type: "r", alive: true, xpos: 7, ypos: 0},
{ team: 0, type: "p", alive: true, xpos: 0, ypos: 1},
{ team: 0, type: "p", alive: true, xpos: 1, ypos: 1},
{ team: 0, type: "p", alive: true, xpos: 2, ypos: 1},
{ team: 0, type: "p", alive: true, xpos: 3, ypos: 1},
{ team: 0, type: "p", alive: true, xpos: 4, ypos: 1},
{ team: 0, type: "p", alive: true, xpos: 5, ypos: 1},
{ team: 0, type: "p", alive: true, xpos: 6, ypos: 1},
{ team: 0, type: "p", alive: true, xpos: 7, ypos: 1},
{ team: 1, type: "p", alive: true, xpos: 0, ypos: 6},
{ team: 1, type: "p", alive: true, xpos: 1, ypos: 6},
{ team: 1, type: "p", alive: true, xpos: 2, ypos: 6},
{ team: 1, type: "p", alive: true, xpos: 3, ypos: 6},
{ team: 1, type: "p", alive: true, xpos: 4, ypos: 6},
{ team: 1, type: "p", alive: true, xpos: 5, ypos: 6},
{ team: 1, type: "p", alive: true, xpos: 6, ypos: 6},
{ team: 1, type: "p", alive: true, xpos: 7, ypos: 6},
{ team: 1, type: "r", alive: true, xpos: 0, ypos: 7},
{ team: 1, type: "n", alive: true, xpos: 1, ypos: 7},
{ team: 1, type: "b", alive: true, xpos: 2, ypos: 7},
{ team: 1, type: "q", alive: true, xpos: 3, ypos: 7},
{ team: 1, type: "k", alive: true, xpos: 4, ypos: 7},
{ team: 1, type: "b", alive: true, xpos: 5, ypos: 7},
{ team: 1, type: "n", alive: true, xpos: 6, ypos: 7},
{ team: 1, type: "r", alive: true, xpos: 7, ypos: 7}];
startingPosition = JSON.stringify(startingPosition);

// contains offsets for image sprites
var piecepic = { p: 0, n: 75, r: 150, b: 225, q: 300, k: 375, y: 75};

// ***** runs on page load
$(window).load(function(){
	// get this browsers transform method
	transformMethod = getTransformMethod();
	
	drawboard();
	// global instance of gamestate object is the "actual" game board
	g = new Game(startingPosition, true);
});

// ***** object constructor for storing game data
function Game(config, master)
{
	// pieces array loaded from constructor arg
	this.pieces = eval(config);

	// only master board interacts with GUI
	this.master = (master ? true : false);

	// board matrix built from pieces array
	this.board = new Array();
	for (var i = 0; i < 8; i++)
		this.board[i] = [null, null, null, null, null, null, null, null];
	
	// arrays for captured pieces
	this.jail0 = new Array();
	this.jail1 = new Array();

	// EN PASSANT one chance only per move! ************ implement this shit!! *********
	this.enpassant = false;

	// put pieces in their locations in the matrix
	for (var i = 0; i < this.pieces.length ; i++)
	{	
		// create div for each piece
		var divname = "piece_" + i;
		var newdiv = "<div id=" + divname + " class='piece'></div>";

		// smart piece knows which object it is, and vice versa
		this.pieces[i].name = divname;
		this.pieces[i].moves = 0;
		this.pieces[i].i = i;

		// update board matrix for pieces in play
		if (this.pieces[i].alive)
			this.board[this.pieces[i].xpos][this.pieces[i].ypos] = this.pieces[i];

		// only master board interacts with GUI
		if (master)
		{
			$("#board").append(newdiv);
			$("#" + divname).data('iam', this.pieces[i]);

			// move to location and set background image offset
			$("#" + divname).css({
				'left' : (this.pieces[i].xpos * squaresize),
				'top' : (this.pieces[i].ypos * squaresize),
				'background-position' : (piecepic[this.pieces[i].type] * -1) + "px " + (this.pieces[i].team * -1 * piecepic['y']) + "px"
			});

			// draggable properties
			$("#" + divname).draggable({ containment: "#board", scroll: false});
			$("#" + divname).draggable({ snap: ".legal", snapMode: "inner"});
			$("#" + divname).draggable({ cursor: "pointer"});
			$("#" + divname).draggable({ revert: "invalid"});
	
			// trigger hints when piece is selected by sending piece object to function
			$("#" + divname).mousedown(function(){ showlegalmove($(this).data('iam'), g) }).mouseup(function(){ clearlegalmove(); });
		}
	}
}

// ***** draw board
function drawboard()
{
	var color = true;

	// add squares, alternating color
	for (var i = 0; i < 8; i++)
	{
		for(var j = 0; j < 8; j++)
		{
			var divname = "square_" + j + i;
			var newdiv = "<div id=" + divname + " class='square'></div>";
			$("#board").append(newdiv);
			if (color)
				$("#" + divname).addClass('white');
			else
				$("#" + divname).addClass('black');
			
			// "samrt" board squares know their own position
			$("#" + divname).data({xpos: j, ypos: i});
			
			color = color ? false : true;
		}
		color = color ? false : true;
	}

	// initialize all droppable squares
	$(".square").droppable({disabled: true});
	$(".square").droppable({accept: ".piece"});
	$(".square").droppable({tolerance: "fit"});
	$(".square").droppable({drop: function(event, ui){
			move(ui.draggable.data('iam'), $(this).data(), g)
	}});

}

// ***** returns array of legal moves for selected piece
function legalmove(pc, gamestate)
{
	// fail safe
	if (!pc.alive){console.log("FAILSAFE legalmove"); return false;}

	// function can operate on imaginary boards to calculate possible check, etc.
	var board = gamestate.board;
	var pieces = gamestate.pieces;
	var jail0 = gamestate.jail0;
	var jail1 = gamestate.jail1;

	var x = pc.xpos;
	var y = pc.ypos;
	var xlist = new Array();
	var ylist = new Array();

	switch (pc.type)
	{
	case 'p':
		// pawns only move forward
		var dir = (pc.team ? -1 : 1);
		// chceck if pawn has been moved yet 1 or 2 spaces
		var lim = ((pc.team && (pc.ypos == 6)) || (!pc.team && (pc.ypos == 1))) ? 2 : 1;
		// up moves
		for (var i=1; i<=lim; i++)
		{
			if (board[x][(y + (i * dir))] == null){xlist.push(x);ylist.push((y + (i * dir)));}
			else break;
		}
		// diagonal moves and EN PASSANT
		if ((x < 7) && 
			( (board[(x + 1)][(y + dir)] != null) && (board[(x + 1)][(y + dir)].team != pc.team) ||
			(board[(x + 1)][y] != null) && (board[(x + 1)][y].enpassant == true) )
		){xlist.push(x + 1);ylist.push(y + dir);}
		if ((x > 0) && 
			( (board[(x - 1)][(y + dir)] != null) && (board[(x - 1)][(y + dir)].team != pc.team) ||
			(board[(x - 1)][y] != null) && (board[(x - 1)][y].enpassant == true) )
		){xlist.push(x - 1);ylist.push(y + dir);}
		break;
	case 'r':
		// down
		for (var i = (y + 1); i <= 7; i++)
		{
			if (board[x][i] == null){xlist.push(x);	ylist.push(i);}
			else if (board[x][i].team != pc.team){xlist.push(x);ylist.push(i);break;}
			else break;
		}
		// up
		for (var i = (y - 1); i >= 0; i--)
		{
			if (board[x][i] == null){xlist.push(x);	ylist.push(i);}
			else if (board[x][i].team != pc.team){xlist.push(x);ylist.push(i);break;}
			else break;
		}
		// right
		for (var i = (x + 1); i <= 7; i++)
		{
			if (board[i][y] == null){xlist.push(i);	ylist.push(y);}
			else if (board[i][y].team != pc.team){xlist.push(i);ylist.push(y);break;}
			else break;
		}
		// left
		for (var i = (x - 1); i >= 0; i--)
		{
			if (board[i][y] == null){xlist.push(i);	ylist.push(y);}
			else if (board[i][y].team != pc.team){xlist.push(i);ylist.push(y);break;}
			else break;
		}
		break;
	case 'b':
		// down-right
		for (var i = (x + 1), j = (y + 1); (i <= 7) && (j <= 7); i++, j++)
		{
			if (board[i][j] == null){xlist.push(i);	ylist.push(j);}
			else if (board[i][j].team != pc.team){xlist.push(i);ylist.push(j);break;}
			else break;
		}
		// up-right
		for (var i = (x + 1), j = (y - 1); (i <= 7) && (j >= 0); i++, j--)
		{
			if (board[i][j] == null){xlist.push(i);	ylist.push(j);}
			else if (board[i][j].team != pc.team){xlist.push(i);ylist.push(j);break;}
			else break;
		}
		// down-left
		for (var i = (x - 1), j = (y + 1); (i >= 0) && (j <= 7); i--, j++)
		{
			if (board[i][j] == null){xlist.push(i);	ylist.push(j);}
			else if (board[i][j].team != pc.team){xlist.push(i);ylist.push(j);break;}
			else break;
		}
		// up-left
		for (var i = (x - 1), j = (y - 1); (i >= 0) && (j >= 0); i--, j--)
		{
			if (board[i][j] == null){xlist.push(i);	ylist.push(j);}
			else if (board[i][j].team != pc.team){xlist.push(i);ylist.push(j);break;}
			else break;
		}
		break;
	case 'q':
		// down
		for (var i = (y + 1); i <= 7; i++)
		{
			if (board[x][i] == null){xlist.push(x);	ylist.push(i);}
			else if (board[x][i].team != pc.team){xlist.push(x);ylist.push(i);break;}
			else break;
		}
		// up
		for (var i = (y - 1); i >= 0; i--)
		{
			if (board[x][i] == null){xlist.push(x);	ylist.push(i);}
			else if (board[x][i].team != pc.team){xlist.push(x);ylist.push(i);break;}
			else break;
		}
		// right
		for (var i = (x + 1); i <= 7; i++)
		{
			if (board[i][y] == null){xlist.push(i);	ylist.push(y);}
			else if (board[i][y].team != pc.team){xlist.push(i);ylist.push(y);break;}
			else break;
		}
		// left
		for (var i = (x - 1); i >= 0; i--)
		{
			if (board[i][y] == null){xlist.push(i);	ylist.push(y);}
			else if (board[i][y].team != pc.team){xlist.push(i);ylist.push(y);break;}
			else break;
		}
		// down-right
		for (var i = (x + 1), j = (y + 1); (i <= 7) && (j <= 7); i++, j++)
		{
			if (board[i][j] == null){xlist.push(i);	ylist.push(j);}
			else if (board[i][j].team != pc.team){xlist.push(i);ylist.push(j);break;}
			else break;
		}
		// up-right
		for (var i = (x + 1), j = (y - 1); (i <= 7) && (j >= 0); i++, j--)
		{
			if (board[i][j] == null){xlist.push(i);	ylist.push(j);}
			else if (board[i][j].team != pc.team){xlist.push(i);ylist.push(j);break;}
			else break;
		}
		// down-left
		for (var i = (x - 1), j = (y + 1); (i >= 0) && (j <= 7); i--, j++)
		{
			if (board[i][j] == null){xlist.push(i);	ylist.push(j);}
			else if (board[i][j].team != pc.team){xlist.push(i);ylist.push(j);break;}
			else break;
		}
		// up-left
		for (var i = (x - 1), j = (y - 1); (i >= 0) && (j >= 0); i--, j--)
		{
			if (board[i][j] == null){xlist.push(i);	ylist.push(j);}
			else if (board[i][j].team != pc.team){xlist.push(i);ylist.push(j);break;}
			else break;
		}
		break;
	case 'k':
		// down
		i = (y + 1);
		if (i <= 7)
			if ((board[x][i] == null) || (board[x][i].team != pc.team)){xlist.push(x);ylist.push(i);}
		// up
		i = (y - 1);
		if (i >= 0)
			if ((board[x][i] == null) || (board[x][i].team != pc.team)){xlist.push(x);ylist.push(i);}
		// right
		i = (x + 1);
		if (i <= 7)
			if ((board[i][y] == null) || (board[i][y].team != pc.team)){xlist.push(i);ylist.push(y);}
		// left
		i = (x - 1);
		if (i >= 0)
			if ((board[i][y] == null) || (board[i][y].team != pc.team)){xlist.push(i);ylist.push(y);}
		// down-right
		i = (x + 1);
		j = (y + 1);
		if ((i <= 7) && (j <= 7))
			if ((board[i][j] == null) || (board[i][j].team != pc.team)){xlist.push(i);ylist.push(j);}
		// up-right
		i = (x + 1);
		j = (y - 1);
		if ((i <= 7) && (j >= 0))
			if ((board[i][j] == null) || (board[i][j].team != pc.team)){xlist.push(i);ylist.push(j);}
		// down-left
		i = (x - 1);
		j = (y + 1);
		if ((i >= 0) && (j <= 7))
			if ((board[i][j] == null) || (board[i][j].team != pc.team)){xlist.push(i);ylist.push(j);}
		// up-left
		i = (x - 1);
		j = (y - 1); 
		if ((i >= 0) && (j >= 0))
			if ((board[i][j] == null) || (board[i][j].team != pc.team)){xlist.push(i);ylist.push(j);}
		// CASTLE king side
		if (((pc.moves == 0) && (pieces[pc.i + 3].moves == 0)) && (board[x + 1][y] == null) && (board[x + 2][y] == null))
			{xlist.push(x + 2);ylist.push(y);}
		// CASTLE queen side
		if (((pc.moves == 0) && (pieces[pc.i - 4].moves == 0)) && (board[x - 1][y] == null) && (board[x - 2][y] == null) && (board[x - 3][y] == null))
			{xlist.push(x - 2);ylist.push(y);}
		break;
	case 'n':
		// 2oclock
		i = (x + 1);
		j = (y - 2);
		if ((i <= 7) && (j >= 0))
			if ((board[i][j] == null) || (board[i][j].team != pc.team)){xlist.push(i);ylist.push(j);}
		// 3oclock
		i = (x + 2);
		j = (y - 1);
		if ((i <= 7) && (j >= 0))
			if ((board[i][j] == null) || (board[i][j].team != pc.team)){xlist.push(i);ylist.push(j);}
		// 4oclock
		i = (x + 2);
		j = (y + 1);
		if ((i <= 7) && (j <= 7))
			if ((board[i][j] == null) || (board[i][j].team != pc.team)){xlist.push(i);ylist.push(j);}
		// 5oclock
		i = (x + 1);
		j = (y + 2); 
		if ((i <= 7) && (j <= 7))
			if ((board[i][j] == null) || (board[i][j].team != pc.team)){xlist.push(i);ylist.push(j);}
		// 7oclock
		i = (x - 1);
		j = (y + 2);
		if ((i >= 0) && (j <= 7))
			if ((board[i][j] == null) || (board[i][j].team != pc.team)){xlist.push(i);ylist.push(j);}
		// 8oclock
		i = (x - 2);
		j = (y + 1);
		if ((i >= 0) && (j <= 7))
			if ((board[i][j] == null) || (board[i][j].team != pc.team)){xlist.push(i);ylist.push(j);}
		// 10oclock
		i = (x - 2);
		j = (y - 1);
		if ((i >= 0) && (j >= 0))
			if ((board[i][j] == null) || (board[i][j].team != pc.team)){xlist.push(i);ylist.push(j);}
		// 11oclock
		i = (x - 1);
		j = (y - 2); 
		if ((i >= 0) && (j >= 0))
			if ((board[i][j] == null) || (board[i][j].team != pc.team)){xlist.push(i);ylist.push(j);}
		break;
	}

	return [xlist, ylist];
}

// ***** highlights legal move squares based on legal move array
function showlegalmove(pc, gamestate)
{
	var moves = legalmove(pc, gamestate);
	var xlist = moves[0];
	var ylist = moves[1];

	// remove any moves that will put your own king in check
	var killMe = new Array();
	for(var i = 0; i < xlist.length; i++)
	{
		if (checkPossibleCheck(pc, xlist[i], ylist[i], gamestate))
			killMe.push(i);
	}
	for(var i = (killMe.length - 1); i >= 0; i--)
	{
		xlist.splice(killMe[i],1);
		ylist.splice(killMe[i],1);
	}

	// go through list of avail squares and enable them for piece dropping
	for (var i = 0; i < xlist.length; i++)
	{
		$("#square_" + xlist[i] + ylist[i]).addClass('legal');
		$("#square_" + xlist[i] + ylist[i]).droppable({disabled: false});
	}
}

// ***** on mouse up clear green circles
function clearlegalmove()
{
	$(".square").removeClass('legal');
	// delay the droppable-off property for a moment after mouseup so piece still drops
	setTimeout(function(){$(".square").droppable({disabled: true});},0);
}	

// ***** move a piece to a new square
function move(pc, sq, gamestate)
{
	// fail safe
	if (!pc.alive){console.log("FAILSAFE move"); return false;}

	// function can operate on imaginary boards to calculate possible check, etc.
	var board = gamestate.board;
	var pieces = gamestate.pieces;
	var jail0 = gamestate.jail0;
	var jail1 = gamestate.jail1;

	// all pieces count their own moves, why not. Especially for pawn, king, rook
	pc.moves++;

	// EN PASSANT - pawns know if they're vulnerable: 1st move, 4th rank, adjacent opponent pawn
	if (pc.type == 'p')
	{
		if (
			(pc.moves == 1) &&
			(sq.ypos == (pc.team + 3)) && 
			((
				(sq.xpos < 7) &&
				(board[(sq.xpos + 1)][sq.ypos] != null) && 
				(board[(sq.xpos + 1)][sq.ypos].team != sq.team) &&
				(board[(sq.xpos + 1)][sq.ypos].type == 'p')
			) || ( 
				(sq.xpos > 0) &&
				(board[(sq.xpos - 1)][sq.ypos] != null) &&
				(board[(sq.xpos - 1)][sq.ypos].team != sq.team) &&
				(board[(sq.xpos - 1)][sq.ypos].type == 'p')
			)) 
		)
			pc.enpassant = true;
		else
			pc.enpassant = false;
	}

	// check for CASTLE, king has moved 2 spaces. move appropriate rook
	var dist = (sq.xpos - pc.xpos);
	if ((pc.type == 'k') && (Math.abs(dist) > 1))
	{
			var castlerook = pc.i + ((dist > 0) ? 3 : -4);
			board[pieces[castlerook].xpos][pieces[castlerook].ypos] = null;
			pieces[castlerook].xpos += ((dist > 0) ? -2 : 3);
			pieces[castlerook].moves++;
			board[pieces[castlerook].xpos][pieces[castlerook].ypos] = pieces[castlerook];

			// move rook - GRAPHICS
			if (gamestate.master)
			{
				$("#" + pieces[castlerook].name).animate({
				'left' : (pieces[castlerook].xpos * squaresize),
				'top' : (pieces[castlerook].ypos * squaresize)}, 1000);
			}
	}
	
	// check for direct-landing capture
	if (board[sq.xpos][sq.ypos] != null)
		gotojail(board[sq.xpos][sq.ypos], gamestate);

	// check for EN PASSANT capture
	if ((pc.type == 'p') && (board[sq.xpos][(sq.ypos + (pc.team ? 1 : -1))] != null ) && (board[sq.xpos][(sq.ypos + (pc.team ? 1 : -1))].enpassant == true))
		gotojail(board[sq.xpos][(sq.ypos + (pc.team ? 1 : -1))], gamestate);

	// clear old board square
	board[pc.xpos][pc.ypos] = null;
	// update new board square and piece object
	pc.xpos = sq.xpos;
	pc.ypos = sq.ypos;
	board[sq.xpos][sq.ypos] = pc;

	// check for pawn promotion
	if ((pc.type == 'p') && (pc.ypos == (pc.team ? 0 : 7)))
		promote(pc, gamestate);

	// check if opponent has been put in check, real board only
	if ( (gamestate.master) && (checkforcheck(pc.team, gamestate)) )
	{
		$("#start").append("<br>"+ (pc.team ? "white" : "black") + " has put opponent in check");
	}
}

// ***** promote a pawn
function promote(pc, gamestate)
{
	// if this an imaginary board, just assume promotion is for queen and move on
	if (!gamestate.master)
	{
		pc.type = 'q';
		return false;
	}

	// function can operate on imaginary boards to calculate possible check, etc.
	var board = gamestate.board;
	var pieces = gamestate.pieces;
	var jail0 = gamestate.jail0;
	var jail1 = gamestate.jail1;

	var ppiece = ['q', 'b', 'r', 'n'];
	var ppicy = [-400, -300, -200, -100];
	var ppicx = [0, -100];

	// populate promotion window with correct button graphics
	for (var i = 0; i < 4; i++)
	{
		var divname = "#promo_" + i;
		$(divname).css({'background-position': ppicy[i] + "px " + ppicx[pc.team] + "px"});
		$(divname).data({'i': i});
		// reset button before re-using
		$(divname).unbind();
		$(divname).click(function(){
			pc.type = ppiece[$(this).data('i')];
			$("#" + pc.name).css({'background-position' : (piecepic[ppiece[$(this).data('i')]] * -1) + "px " + (pc.team * -1 * piecepic['y']) + "px"});

			// undo graphics stuff and go back to game
			$("#glass").css({'z-index': -1000});
			$("#square_" + pc.xpos + pc.ypos).removeClass('promote');
			$(".square").animate({'opacity': 1}, 1000);
			$(".piece:not(.dead)").animate({'opacity': 1}, 1000);
			$("#panelslider").animate({'top': '0px'}, 1000);
		});
	}

	// disable touching board, fade out board, slide up control panel
	$("#glass").css({'z-index': 1000});
	$("#square_" + pc.xpos + pc.ypos).addClass('promote');
	$(".square:not(.promote)").animate({'opacity': 0.4}, 1000);
	$(".piece:not(#" + pc.name + "):not(.dead)").animate({'opacity': 0.4}, 1000);
	$("#panelslider").animate({'top': '-644px'}, 1000);
}

// ***** capture a piece
function gotojail(dead, gamestate)
{
	// function can operate on imaginary boards to calculate possible check, etc.
	var board = gamestate.board;
	var pieces = gamestate.pieces;
	var jail0 = gamestate.jail0;
	var jail1 = gamestate.jail1;

	// remove from board and put in jail - DATA
	board[dead.xpos][dead.ypos] = null;
	eval('jail' + dead.team).push(dead);

	// the victim, update object data
	dead.alive = false;
	dead.xpos = null;
	dead.ypos = null;

	// remove from board and put in jail - GRAPHICS
	if (gamestate.master)
	{
		$("#" + dead.name).unbind();
		$("#" + dead.name).addClass('dead');
		$("#" + dead.name).css(transformMethod, 'scale(0.5)');
		var next = ((eval('jail' + dead.team).length - 1) * (squaresize / 2)) - 20;
		var side = dead.team ? ((squaresize * 8) + 50 - 60) : "-70px";
		$("#" + dead.name).animate({top: next, left: side}, 1000, function(){
			$("#" + dead.name).animate({opacity: 0.6}, 1000);
		});
	}
}

// ***** evaluates all legal moves to see if king is on threatened square
function checkforcheck(offteam, gamestate)
{
	// function can operate on imaginary boards to calculate possible check, etc.
	var board = gamestate.board;
	var pieces = gamestate.pieces;
	var jail0 = gamestate.jail0;
	var jail1 = gamestate.jail1;

	var allmovesX = new Array();
	var allmovesY = new Array();

	// collect mega-array of all available moves
	teammembers = (offteam ? [16, 31] : [0, 15]);

	for (var count = teammembers[0]; count <= teammembers[1]; count++)
	{
		if (pieces[count].alive)
		{
			var somemoves = legalmove(pieces[count], gamestate);
			allmovesX = allmovesX.concat(somemoves[0]);
			allmovesY = allmovesY.concat(somemoves[1]);
		}
	}

	// check if opponent king is on one of those squares
	var deadking = (offteam ? 4 : 28);
	for (var i = 0; i <= allmovesX.length; i++)
	{
		if ((allmovesX[i] == pieces[deadking].xpos) && (allmovesY[i] == pieces[deadking].ypos))
			return true;
	}
	return false;
}

// ***** test a potential move for putting your own king in check
function checkPossibleCheck(pc, x, y, gamestate)
{
	// copy gamestate into new temp object that won't affect board
	var testGame = new Game(JSON.stringify(gamestate.pieces));
	var destination = {xpos: x, ypos: y};

	// move imaginary piece in imaginary gamestate
	move(testGame.pieces[pc.i], destination, testGame);

	// test if you are now in check after imaginary move
	return (checkforcheck( (pc.team ? 0 : 1), testGame));
}

// ***** get this browsers transform method 
function getTransformMethod()
{
	var properties = ['transform', 'WebkitTransform', 'msTransform', 'MozTransform', 'OTransform'];
        var p;
        while (p = properties.shift())
        {
            if (typeof $("#mainc")[0].style[p] != 'undefined')
            {
                return p;
            }
        }
        
        // Default to transform also
        return 'transform';
}




// *** DEBUG ***
function pboard(gamestate)
{
	for (var i = 0; i <= (gamestate.board.length - 1); i++)
	{
		for (j = 0; j <= (gamestate.board[i].length - 1); j++)
			console.log(JSON.stringify(gamestate.board[j][i]));
	}

}
