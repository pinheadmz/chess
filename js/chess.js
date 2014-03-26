/*
***************************************
*  designed by MATTHEW ZIPKIN 2012    *
* matthew(dot)zipkin(at)gmail(dot)com *
***************************************
*/

// initialize globals
var gameOn = true;
var bobby = false;
var bobbyteam = 0;
var g = null;
var squaresize = 80;
var startingPosition = 
[{ team: 0, type: "r", alive: true, xpos: 0, ypos: 0},
{ team: 0, type: "n", alive: true, xpos: 1, ypos: 0},
{ team: 0, type: "b", alive: true, xpos: 2, ypos: 0},
{ team: 0, type: "q", alive: true, xpos: 3, ypos: 0},
{ team: 0, type: "k", alive: true, xpos: 4, ypos: 0, check: false},
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
{ team: 1, type: "k", alive: true, xpos: 4, ypos: 7, check: false},
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
	
	// go from splash screen to menu 1
	$('#splashLoading').remove();
	$('#splash').bind('click touchstart', function(){
		$('#splash').slideUp();
		$('#inst').css({'display' : 'block'});
		// engage computer player?
		$('#instYES').bind('click touchstart',function(){
			bobby = true;
			$('#diff').slideDown();
		});
		
		$('#instNO').bind('click touchstart',function(){
			bobby = false;
			$('#inst').slideUp();
		});
		
		$('#diffEASY').bind('click touchstart',function(){
			iterationMAX = 0;
			$('#inst').slideUp();
		});
		
		$('#diffHARD').bind('click touchstart',function(){
			iterationMAX = 1;
			$('#inst').slideUp();
		});


		
	});
	
	drawboard();
	// global instance of gamestate object is the "actual" game board
	g = new Game(startingPosition, true);
	// initialize clickability and whos trun it is
	toggleGo();

	// clicking on a move in the sotryline takes you there
	$("#storylist li").live('click', function(){ showMove( $(this).attr('data-move')) });
});

// ***** object constructor for storing game data
function Game(config, master)
{
	// whos turn is it?
	this.gonext = 0;
	
	// list of moves
	this.story = [null];
	this.storyBoard = [null];
	
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

	// EN PASSANT one chance only per move!
	this.enpassant = false;

	// put pieces in their locations in the matrix
	for (var i = 0; i < this.pieces.length ; i++)
	{	
		// update board matrix for pieces in play
		if (this.pieces[i].alive)
			this.board[this.pieces[i].xpos][this.pieces[i].ypos] = this.pieces[i];

		// only master board interacts with GUI, and starts with initialized values
		if (master)
		{
			// create div for each piece
			var divname = "piece_" + i;
			var newdiv = "<div id=" + divname + " class='piece'></div>";
	
			// smart piece knows which object it is, and vice versa
			this.pieces[i].name = divname;
			this.pieces[i].moves = 0;
			this.pieces[i].i = i;

			$("#board").append(newdiv);
			$("#" + divname).data('iam', this.pieces[i]);

			// move to location and set background image offset
			$("#" + divname).css({
				'left' : (this.pieces[i].xpos * squaresize),
				'top' : (this.pieces[i].ypos * squaresize),
				'background-position' : (piecepic[this.pieces[i].type] * -1) + "px " + (this.pieces[i].team * -1 * piecepic['y']) + "px"
			});

			// tag it
			$("#" + divname).addClass("team_" + this.pieces[i].team);

			// draggable properties
			$("#" + divname).draggable({ containment: "#board", scroll: false});
			$("#" + divname).draggable({ snap: ".legal", snapMode: "inner"});
			$("#" + divname).draggable({ cursor: "pointer"});
			$("#" + divname).draggable({ revert: "invalid"});
	
			// trigger hints when piece is selected by sending piece object to function
			$("#" + divname).mousedown(function(){
				showlegalmove( $(this).data('iam'), g);
			}).mouseup(function(){
					// delay the droppable-off property for a moment after mouseup so piece still drops
					setTimeout(function(){$(".square").droppable({disabled: true});},5);
			});

			// initially whites move
			$(".team_0").css('pointer-events', 'auto');

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
			move(ui.draggable.data('iam'), $(this).data(), g);
	}});

	// clean up by touching blank square
	$(".square").mouseup(function(){clearlegalmove()});
}

// ***** returns array of legal moves for selected piece
function legalmove(pc, gamestate)
{
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
			(board[(x + 1)][y] != null) && ((board[(x + 1)][y].enpassant == true) && (gamestate.enpassant)) )
		){xlist.push(x + 1);ylist.push(y + dir);}
		if ((x > 0) && 
			( (board[(x - 1)][(y + dir)] != null) && (board[(x - 1)][(y + dir)].team != pc.team) ||
			(board[(x - 1)][y] != null) && ((board[(x - 1)][y].enpassant == true) && (gamestate.enpassant)) )
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
		// castle disabled in check
		if ((pc.moves === 0) && (pc.check === false))
		{	
			// CASTLE king side
			if ( (pieces[pc.i + 3].alive === true) && (pieces[pc.i + 3].moves === 0) && (board[x + 1][y] == null) && (board[x + 2][y] == null) )
				{xlist.push(x + 2);ylist.push(y);}
			// CASTLE queen side
			if ( (pieces[pc.i - 4].alive === true) && (pieces[pc.i - 4].moves === 0) && (board[x - 1][y] == null) && (board[x - 2][y] == null) && (board[x - 3][y] == null) )
				{xlist.push(x - 2);ylist.push(y);}
		}
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

// **** scrubs legal moves for check violations
function scrubMoves(pc, moves, gamestate){
	var xlist = moves[0];
	var ylist = moves[1];

	// check every possible move for putting self in check
	var killMe = new Array();
	for(var i = 0; i < xlist.length; i++)
	{
		if (checkPossibleCheck(pc, xlist[i], ylist[i], gamestate))
			killMe.push(i);
		else if ((pc.type == 'k') && (Math.abs(xlist[i] - pc.xpos) > 1))
		{		
			// king cannot castle 'through' check
			var through = xlist[i] + ( (xlist[i] > pc.xpos) ? -1 : 1);
			if (checkPossibleCheck(pc, through, ylist[i], gamestate))
				killMe.push(i);
		}
	}

	// remove any moves that will put your own king in check
	for(var i = (killMe.length - 1); i >= 0; i--)
	{
		xlist.splice(killMe[i],1);
		ylist.splice(killMe[i],1);
	}

	return [xlist, ylist];
}

// ***** highlights legal move squares based on legal move array
function showlegalmove(pc, gamestate, checktest)
{
	var moves = scrubMoves(pc, legalmove(pc, gamestate), gamestate);
	var xlist = moves[0];
	var ylist = moves[1];

	if (checktest == true)
		return xlist.length
	else
	{
		// highlight piece in its own green square
		$(".piece").removeClass('selected');
		$("#" + pc.name).addClass('selected');

		// unselect all squares before applying rules
		$(".square").removeClass('legal');
		$(".square").droppable({disabled: true});
		$(".square").unbind('mousedown');

		// make opposing pieces click-through to the squares they are on
		$(".team_" + (pc.team ? 0 : 1)).css('pointer-events', 'none');

		// go through list of avail squares and enable them for piece dropping and clicking
		for (var i = 0; i < xlist.length; i++)
		{
			// variable shorthand for current square
			var targetSq = "#square_" + xlist[i] + ylist[i];

			// drop a valid piece on valid square
			$(targetSq).addClass('legal');
			$(targetSq).droppable({disabled: false});

			// click a valid square, we move the piece for you 
			$(targetSq).mousedown(function(event){
				var goSq = $("#" + event.target.id).data();
				var goPiece = $(".selected");
				ghostMove(goPiece, goSq);
			});
		}
	}
}

// ***** animate moving piece for clicks or AI player
function ghostMove(goPiece, goSq){
	// move piece - DATA
	move( goPiece.data('iam'), goSq, g);	
	
	// move piece - GRAPHICS
	goPiece.transition({
		'left' : (goSq.xpos * squaresize),
		'top' : (goSq.ypos * squaresize)}, 1000, function(){



	});
}

// ***** clear green circles squares
function clearlegalmove()
{
	$(".square").removeClass('legal');
	$(".square").unbind('mousedown');
	$(".piece").removeClass('selected');
}	

// ***** move a piece to a new square
function move(pc, sq, gamestate)
{
	// function returns type of captured piece, if any
	var captured = false;

	// function can operate on imaginary boards to calculate possible check, etc.
	var board = gamestate.board;
	var pieces = gamestate.pieces;
	var jail0 = gamestate.jail0;
	var jail1 = gamestate.jail1;
	
	// for notation
	var extra = ['',''];

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
				(board[(sq.xpos + 1)][sq.ypos].team != pc.team) &&
				(board[(sq.xpos + 1)][sq.ypos].type == 'p')
			) || ( 
				(sq.xpos > 0) &&
				(board[(sq.xpos - 1)][sq.ypos] != null) &&
				(board[(sq.xpos - 1)][sq.ypos].team != pc.team) &&
				(board[(sq.xpos - 1)][sq.ypos].type == 'p')
			)) )
		{
			pc.enpassant = true;
			gamestate.enpassant = true;
		}
		else
		{
			pc.enpassant = false;
			gamestate.enpassant = false;
		}

	}
	else
		gamestate.enpassant = false;

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
			$("#" + pieces[castlerook].name).transition({
			'left' : (pieces[castlerook].xpos * squaresize),
			'top' : (pieces[castlerook].ypos * squaresize)}, 500);
		}
		
		// notation
		extra = [false, ((dist == 2)  ? '0-0' : '0-0-0')];
	}
	
	// check for direct-landing capture
	if (board[sq.xpos][sq.ypos] != null)
	{
		var deadPiece = board[sq.xpos][sq.ypos];
		captured = deadPiece.type;
		gotojail(deadPiece, gamestate);
		// pawns get special notation when they capture
		extra = [(pc.type != 'p' ? 'x' : String.fromCharCode(pc.xpos + 97) + 'x'), ''];
	}

	// check for EN PASSANT capture
	if ( (pc.type == 'p') &&
		(board[sq.xpos][(sq.ypos + (pc.team ? 1 : -1))] != null ) &&
		(board[sq.xpos][(sq.ypos + (pc.team ? 1 : -1))].team != pc.team ) &&
		(board[sq.xpos][(sq.ypos + (pc.team ? 1 : -1))].enpassant == true)
	)
	{
		var deadPiece = board[sq.xpos][(sq.ypos + (pc.team ? 1 : -1))];
		captured = deadPiece.type;
		gotojail(deadPiece, gamestate);
		// pawns get special notation when they capture
		extra = [(String.fromCharCode(pc.xpos + 97) + 'x'), 'e.p.'];
	}

	// clear old board square
	board[pc.xpos][pc.ypos] = null;
	// update new board square and piece object
	pc.xpos = sq.xpos;
	pc.ypos = sq.ypos;
	board[sq.xpos][sq.ypos] = pc;

	// check for pawn promotion
	if ((pc.type == 'p') && (pc.ypos == (pc.team ? 0 : 7))){
		// pawn promotion funciton needs to finish the move cycle on its own
		if(gamestate.master){tellStory(pc, sq, extra, gamestate);}
		promote(pc, gamestate);
		return captured;
	}

	// check if opponent has been put in or out of check, or if player has moved out of check
	if (gamestate.master)
		extra = [extra[0], extra[1] + checkAlert(pc, gamestate)];

	// next player goes
	if(gamestate.master)
	{
		clearlegalmove();
		tellStory(pc, sq, extra, gamestate);
		setTimeout(function(){toggleGo();},10);
	}

	return captured;
}

// **** alerts if someone is in or out of check
function checkAlert(pc, gamestate)
{
	// function can operate on imaginary boards to calculate possible check, etc.
	var board = gamestate.board;
	var pieces = gamestate.pieces;
	var jail0 = gamestate.jail0;
	var jail1 = gamestate.jail1;

	var msg = "";
	var notationCoda = "";
	if (checkforcheck(pc.team, gamestate))
	{
		pieces[(pc.team ? 4 : 28)].check = true;
		// check for checkmate 
		if (checkForCheckmate(pc.team, gamestate))
		{
			msg = (pc.team ? "white" : "black") + " has put opponent in checkmate!";
			notationCoda = "#";
			// stop all gameplay
			gameOn = false;
			clearlegalmove();
			$("#glass").css({'z-index': 1000});
		}
		else
		{
			msg = (pc.team ? "white" : "black") + " has put opponent in check";
			notationCoda = "+";
		}
	}
	else
	{
		pieces[(pc.team ? 4 : 28)].check = false;
		msg = "";
	}

	if (checkforcheck((pc.team ? 0 : 1), gamestate))
	{
		pieces[(pc.team ? 28 : 4)].check = false;
		msg = "";
	}

	// report check to user
	$("#message").html(msg);

	// update storyline game notation
	return notationCoda;
}

// **** switches which player turn is next
function toggleGo()
{
	if(!gameOn) {return false;}

	var whosTurn = (g.gonext ? 0 : 1);

	// toggle visual indicator
	$("#goc").transition({'left': (g.gonext ? -210 : 0) + 'px'});

	// toggle clickability of teams pieces GRAPHICS in 2-player mode only
	if (!bobby || (bobby && (bobbyteam != whosTurn))){$(".team_" + whosTurn).css('pointer-events', 'auto');}
	$(".team_" + g.gonext).css('pointer-events', 'none');
	
	// toggle gamestate DATA
	g.gonext = whosTurn;

	// engage AI for computer opponent
	if (bobby && (bobbyteam == g.gonext)){
		bobbyGo(g, bobbyteam);
	}
}

// ***** promote a pawn
function promote(pc, gamestate)
{
	// function can operate on imaginary boards to calculate possible check, etc.
	var board = gamestate.board;
	var pieces = gamestate.pieces;
	var jail0 = gamestate.jail0;
	var jail1 = gamestate.jail1;

	// if this an imaginary board, just assume promotion is for queen and move on
	if (!gamestate.master)
	{
		pc.type = 'q';
		// pick up new piece and put it right back down, to trigger check test
		board[pc.xpos][pc.ypos] = null;
		move(pc,{xpos: pc.xpos, ypos: pc.ypos},gamestate);
		return false;
	}

	// bobby always picks queens
	if (bobby && (bobbyteam == pc.team)){
		pc.type = 'q';
		$("#" + pc.name).css({'background-position' : (piecepic['q'] * -1) + "px " + (pc.team * -1 * piecepic['y']) + "px"});
		
		// update storyline game notation
		var notationCoda = "(Q)";
		$('#storylist li:last-child').append(notationCoda);
		gamestate.story[gamestate.story.length - 1] = $('#storylist li:last-child').html();

		// check if opponent has been put in or out of check, or if player has moved out of check
		if (gamestate.master)
			checkAlert(pc, gamestate);

		// next player goes
		if(gamestate.master)
		{
			clearlegalmove();
			toggleGo();
		}
	
		return false;
	}

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
			$(".square").transition({'opacity': 1}, 1000);
			$(".piece:not(.dead)").transition({'opacity': 1}, 1000);
			$("#panelslider").transition({'top': '0px'}, 1000);
			
			// update storyline game notation
			var notationCoda = "(" + pc.type.toUpperCase() + ")";
			$('#storylist li:last-child').append(notationCoda);
			gamestate.story[gamestate.story.length - 1] = $('#storylist li:last-child').html();

			// check if opponent has been put in or out of check, or if player has moved out of check
			if (gamestate.master)
				checkAlert(pc, gamestate);

			// next player goes
			if(gamestate.master)
			{
				clearlegalmove();
				toggleGo();
			}
		});
	}

	// disable touching board, fade out board, slide up control panel
	$("#glass").css({'z-index': 1000});
	$("#square_" + pc.xpos + pc.ypos).addClass('promote');
	$(".square:not(.promote)").transition({'opacity': 0.4}, 1000);
	$(".piece:not(#" + pc.name + "):not(.dead)").transition({'opacity': 0.4}, 1000);
	$("#panelslider").transition({'top': '-644px'}, 1000);
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
		$("#" + dead.name).transition({top: next, left: side}, 1000, function(){
			$("#" + dead.name).transition({opacity: 0.6}, 1000);
		});
	}
}

// ***** check if defending team has any moves left
function checkForCheckmate(offteam, gamestate)
{
	// function can operate on imaginary boards to calculate possible check, etc.
	var board = gamestate.board;
	var pieces = gamestate.pieces;
	var jail0 = gamestate.jail0;
	var jail1 = gamestate.jail1;

	var allmovesX = new Array();
	var allmovesY = new Array();

	// collect mega-array of all available moves of defending team
	var remaining = 0;
	var teammembers = (offteam ? [0, 15] : [16, 31]);
	for (var count = teammembers[0]; count <= teammembers[1]; count++)
	{
		if (pieces[count].alive)
		{
			// remove moves that still end in check and get number of available moves left
			remaining += showlegalmove(pieces[count], gamestate, true)
		}
	}

	if (remaining > 0)
		return false;
	else
		return true;
}

// ***** evaluates all legal moves to see if king is on threatened square
function checkforcheck(offteam, gamestate, countMoves)
{
	// function can operate on imaginary boards to calculate possible check, etc.
	var board = gamestate.board;
	var pieces = gamestate.pieces;
	var jail0 = gamestate.jail0;
	var jail1 = gamestate.jail1;

	var allmovesX = new Array();
	var allmovesY = new Array();

	// collect mega-array of all available moves
	var teammembers = (offteam ? [16, 31] : [0, 15]);

	for (var count = teammembers[0]; count <= teammembers[1]; count++)
	{
		if (pieces[count].alive)
		{
			var somemoves = legalmove(pieces[count], gamestate);
			allmovesX = allmovesX.concat(somemoves[0]);
			allmovesY = allmovesY.concat(somemoves[1]);
		}
	}
	
	var opponentInCheck = false;	

	// check if opponent king is on one of those squares
	var deadking = (offteam ? 4 : 28);
	for (var i = 0; i <= allmovesX.length; i++)
	{
		if ((allmovesX[i] == pieces[deadking].xpos) && (allmovesY[i] == pieces[deadking].ypos))
			opponentInCheck = true;
	}

	// function will return number of total team moves in addition to 'check' if countMoves is TRUE
	if (countMoves)
		return [opponentInCheck, allmovesX.length];
	else
		return opponentInCheck;
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

// ***** convert move into chess notation and add to list on screen
function tellStory(pc, sq, extra, gamestate)
{
	var movenumber = gamestate.story.length;
	var moveID = movenumber;
	var piecename = ((pc.type == 'p') ? "" : pc.type.toUpperCase());
	var rank = Math.abs(sq.ypos - 8);
	var file = String.fromCharCode(sq.xpos + 97);
	extra = (extra ? extra : ['','']);		
	var moveclass = "whiteMove";

	// only white moves get newline and number
	if (pc.team)
		movenumber = (Math.floor(movenumber / 2) + 1) + ". ";
	else{
		movenumber = "";
		moveclass = "blackMove";
	}

	// assemble and post
	var storyLine = movenumber + piecename + extra[0] + file + rank + extra[1];
	// castling notation trumps all
	if (extra[0] === false)
		storyLine = movenumber + extra[1];

	$("#storylist").append("<li class='" + moveclass + "' data-move='" + moveID + "' id='storyLine_" + moveID + "' onclick=''>" + storyLine + "</li>");
	// scroll down to show latest move
	$("#storyc").scrollTop(9999999);

	gamestate.story.push(storyLine);
	gamestate.storyBoard.push(JSON.stringify(gamestate.pieces));
}

// ***** go to a move that has already been played and see the board
function showMove(moveID){
	// load gamestate board into array
	var movePieces = eval(g.storyBoard[moveID]);

	// hide all real and fake pieces
	$(".piece").css('display','none');
	$(".fakePiece").remove();
	$("#storylist li").removeClass('select');
	$(".returnGame").remove();
	$("#board").css('opacity', '0.8');
	
	for (var i = 0 ; i <= (movePieces.length - 1) ; i++){
		if (movePieces[i].alive){
			// create div for each piece
			var divname = "fakePiece_" + i;
			var newdiv = "<div id=" + divname + " class='piece fakePiece'></div>";
			$("#board").append(newdiv);

			// move to location and set background image offset
			$("#" + divname).css({
				'left' : (movePieces[i].xpos * squaresize),
				'top' : (movePieces[i].ypos * squaresize),
				'background-position' : (piecepic[movePieces[i].type] * -1) + "px " + (movePieces[i].team * -1 * piecepic['y']) + "px"
			});
		}
	}
	
	// add cancel button to return to game play
	var returnGameX = "<div class='returnGame' onclick='returnGame()'> (X) </div>";
	var selectedMove = "#storyLine_" + moveID;
	$(selectedMove).append(returnGameX);
	$(selectedMove).addClass('select');
}


// ***** clear fake pieces, bring board back to life to continue game
function returnGame(){
	$("#storylist li").removeClass('select');
	$("#board").css('opacity', 1);
	$(".fakePiece").remove();
	$(".piece").css('display','inline-block');
	$(".returnGame").remove();
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
