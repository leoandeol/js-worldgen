//GLOBALS
var world;
var jeu;
var tiles;
var divPlayer;
var divBoat;
var weapon;
var boat;
var player;
var score;
var infos;
var scoreDOM;
var bestScore;
const WORLD_WIDTH = 65;
const COEFF_SCALE = 1.5;
const LENGTH = 3;
const WATER_RATIO = 0.3;
var T_DYN_WATER = 0;
const TILE_SIZE = 16;
const RENDER_SIZE = 10;
const NPC_NUMBER = 20;
var npc_tab = Array(NPC_NUMBER);
var interv;

const TileType = {
    WATER : 0,
    GRASS : 1,
    SAND : 2
};

//Random function between two ints
function rand(low,high){
    return Math.floor((Math.random() * high) + low);
}

//INIT
function init(){
    jeu = document.getElementById("jeu");
    tiles = document.createElement("div");
    jeu.appendChild(tiles);
    divPlayer = document.createElement("div");
    divPlayer.id = "player";
    score=0;
    gen();
    jeu.appendChild(divPlayer);
    initPlayer();
    initBoat();
    player.dom.style.zIndex = 1;
    boat.dom.style.zIndex = 2;
    initNPCS(NPC_NUMBER);
    for(var i = 0; i < NPC_NUMBER; i++){
		jeu.appendChild(npc_tab[i].npcDOM);
    }
	render(WORLD_WIDTH);
    interv = setInterval(npcMoves,1000);
	infos = document.getElementById("infos");
	scoreDOM = document.createElement("div");
	scoreDOM.innerHTML = "<p> Score <p id=\"score\"> 0 </p></p>"
	bestScore = document.createElement("div");
	bestScore.id = "bestScore";
	bestScore.innerHTML = "Best Score :";
	infos.appendChild(scoreDOM);
	infos.appendChild(bestScore);
}

function relancer(){
    while (jeu.firstChild) {
		jeu.removeChild(jeu.firstChild);
    }
	infos.removeChild(scoreDOM);
	infos.removeChild(bestScore);
	clearInterval(interv);
    init();	
}
//WORLDGEN
function gen(){
    //Fillin
    world = diamondsquare(WORLD_WIDTH);
    world = convert(world, LENGTH,WORLD_WIDTH);
    world = calculateWaterLevel(world,LENGTH,WORLD_WIDTH);
    console.log(world);
}

function diamondsquare(SIZE){
    var size = SIZE-1;
    var extent = size;
    var half = size / 2;
    var scale = half * COEFF_SCALE;

    var points = new Array(SIZE);
    for(var i = 0; i < SIZE; i++){
	points[i] = new Array(SIZE);
    }

    points[0][0]=0;
    points[0][size]=0;
    points[size][0]=0;
    points[size][size]=0;

    while(size > 1){
	// SQUARE
	for(var x = 0; x < extent; x+= size)
	{
	    for(var y = 0; y < extent; y+=size)
	    {
		var sq_avg = (points[x][y] + points[x+size][y] + points[x][y+size] + points[x+size][y+size])/4;
		points[x+half][y+half] = sq_avg + rand(-scale,scale*2);
	    }
	}
	//DIAMOND
	for(var x = 0; x < extent; x+= size)
	{
	    for(var y = 0; y < extent; y+=size)
	    {
		var avg;
		if(y > 0){
		    avg = (points[x][y]+ points[x+size][y] + points[x+half][y+half] + points[x+half][y-half]) / 4;
		}else{
		    avg = (points[x][y] + points[x+size][y] + points[x+half][y+half]) / 3;
		}
		points[x+half][y] = avg + rand(-scale, scale*2);
		
		if(y < extent - size){
		    avg = (points[x+size][y+size] + points[x+half][y+half] + points[x+size][y+size] + points[x+half][y+size+half]) / 4;
		}else{
		    avg = (points[x+size][y+size] + points[x+half][y+half] + points[x+size][y+size]) / 3;
		}
		points[x+half][y+size] = avg + rand(-scale, scale*2);
		
		if(x > 0){
		    avg = (points[x][y] + points[x+half][y+half] + points[x][y+size] + points[x-half][y+half]) / 4;
		}else{
		    avg = (points[x][y] + points[x+half][y+half] + points[x][y+size]) / 3;
		}
		points[x][y+half] = avg + rand(-scale, scale*2);
		
		if(x < extent - size){
		    avg = (points[x+size][y+size] + points[x+half][y+half] + points[x+size][y+size] + points[x+size+half][y+half]) / 4;
		}else{
		    avg = (points[x+size][y+size] + points[x+half][y+half] + points[x+size][y+size]) / 3;
		}
		points[x+size][y+half] = avg + rand(-scale, scale*2);
	    }
	}
	size /= 2;
	half /= 2;
	scale = half * COEFF_SCALE;
    }

    return points;
}

function convert(tab, length,SIZE)
{
    var min = 0, max = 0;
    
    for(var i = 0; i < SIZE; i++)
    {
	for(var j = 0; j < SIZE; j++)
	{
	    if(tab[i][j]>max){ max = tab[i][j]; }
	    if(tab[i][j]<min){ min = tab[i][j]; }
	}
    }
    
    for(var i = 0; i < SIZE; i++)
    {
	for(var j = 0; j < SIZE; j++)
	{
	    var k = tab[i][j];
	    k = k - min;
	    k = (k)/(max-min);
	    k = k * (length-1);
	    tab[i][j] = Math.floor(k);
	}
    }
    min = 0;
    max = 0;
    for(var i = 0; i < SIZE; i++)
    {
	for(var j = 0; j < SIZE; j++)
	{
	    if(tab[i][j]>max){ max = tab[i][j]; }
	    if(tab[i][j]<min){ min = tab[i][j]; }
	}
    }

    return tab;
}

function calculateWaterLevel(tab, length,SIZE)
{
    // let's find the value for which 2/3 of the values are lower
    var histo = new Array();

    // init the histogram
    for(var i = 0; i < length; i++)
    {
	histo[i]=0;
    }

    // fill the histogram
    for(var i = 0; i < SIZE; i++)
    {
	for(var j = 0; j < SIZE; j++)
	{
	    histo[tab[i][j]]++;
	}
    }
    
    var sum = 0;
    var cap = (SIZE*SIZE)*WATER_RATIO;
    for(var i = 0; i < length; i++)
    {
	sum+=histo[i];
	if(sum>cap)
	{
	    T_DYN_WATER=i;
	    break;
	}
    }

    return tab;
}

function clean_tiles(){
    while (tiles.firstChild) {
	tiles.removeChild(tiles.firstChild);
    }
}

function render(SIZE){
	
	for(var i = 0; i < WORLD_WIDTH; i++){
		for(var j = 0; j < WORLD_WIDTH; j++){
			var t = document.createElement("img");
			var src = "img/";
			switch(world[i][j]){
			case TileType.WATER:
			src+="water";
			break;
			case TileType.GRASS:
			src+="grass";
			break;
			case TileType.SAND:
			src+="sand";
			break;
			}
			src += ".png";
			t.src = src;
			t.id = i+'';
			t.id += j+'';
			t.style="width:"+(TILE_SIZE)+"px;height:"+(TILE_SIZE)+"+px;position:absolute;margin:0;top:"+(TILE_SIZE*j)+"px;left:"+(TILE_SIZE*i)+"px;";
			jeu.appendChild(t);
		}
	}
}


////////////////////////////// PLAYER //////////////////////////////

// ARME

function weaponConstructor(initI,initJ){
    this.src = "res/spritesheets/link/weapons/";
    this.posI = initI;
    this.posJ = initJ;
    this.dom;
    this.img;

    this.init = function(){
		this.dom = document.createElement("div");
		this.img = document.createElement("img");
		this.dom.style.zIndex = 3;
		this.dom.appendChild(this.img);
		this.dom.id = "weapon";
    }
}

function playerConstructor(src,initI,initJ,pas,onBoat,DOM,IMG,dir,weapon){
    var player = this;    
    player.src = src;
    player.initI = initI;
    player.initJ = initJ;
    player.posI = initI;
    player.posJ = initJ;
    player.pas = pas;
    player.onBoat = onBoat;
    player.dom = DOM;
    player.img = IMG;
    player.direction = dir;
    player.compteur = 0;
    player.sword = weapon;

    // PLAYER'S ATTACK

    player.killNpc = function(){
	for(var i = 0; i < npc_tab.length; i++){
	    if((npc_tab[i].npcI == player.posI && npc_tab[i].npcJ == this.posJ-1 && this.direction == "up") || (npc_tab[i].npcI == player.posI && npc_tab[i].npcJ == this.posJ+1 && this.direction == "down") ||
	      (npc_tab[i].npcI == player.posI-1 && npc_tab[i].npcJ == this.posJ && this.direction == "left") || (npc_tab[i].npcI == player.posI+1 && npc_tab[i].npcJ == this.posJ && this.direction == "right")){
		score++;
		jeu.removeChild(npc_tab[i].npcDOM);
		document.getElementById("score").innerHTML = score;
	    }
	}
    }

    player.attack = function(event){
		if(event.keyCode == 32){
			var weapSrc = "res/spritesheets/link/weapons/";
			switch(player.direction){
			case "up":
			player.sword.img.src = player.sword.src + "up.png";
			player.sword.posJ = player.posJ - 1;
			player.sword.posI = player.posI;
			
			player.sword.dom.style.top= -TILE_SIZE+"px";
			player.sword.dom.style.left= 0+"px";
			
			player.img.src = player.src + "up_atk.png";
			setTimeout(function(){
				player.img.src = player.src + "link_back_0.png";
			},200)
			player.killNpc();
			break;
			case "down":
			player.sword.img.src = player.sword.src + "down.png";
			player.sword.posJ = player.posJ + 1;
			player.sword.posI = player.posI;
					
			player.sword.dom.style.top= TILE_SIZE+"px";
			player.sword.dom.style.left= 0+"px";
			
			player.img.src = player.src + "down_atk.png";
			setTimeout(function(){
				player.img.src = player.src + "link_front_0.png";
			},200)	
			player.killNpc();
			break;
			case "left":
			player.sword.img.src = player.sword.src + "left.png";
			player.sword.posJ = player.posJ;
			player.sword.posI = player.posI - 1;
			
			player.sword.dom.style.top= 0 +"px";
			player.sword.dom.style.left=-TILE_SIZE+"px";
			
			player.img.src = player.src + "left_atk.png";
			setTimeout(function(){
				player.img.src = player.src + "link_left_1.png";
			},200)		
			player.killNpc();
			break;
			case "right":
			player.sword.img.src = player.sword.src + "right.png";
			player.sword.posJ = player.posJ;
			player.sword.posI = player.posI + 1;
			
			player.sword.dom.style.top= 0+"px";
			player.sword.dom.style.left=TILE_SIZE+"px";
			
			player.img.src = player.src + "right_atk.png";
			setTimeout(function(){
				player.img.src = player.src + "link_right_1.png";
			},200)
			player.killNpc();
			break;		
			}
			player.sword.dom.style.visibility = "visible";
			setTimeout(function(){
			player.sword.dom.style.visibility = "hidden";
			},200)
		}
    }    
    // PLAYER MOTION
    this.move = function(event,boat){
		
    var canGo = true;
	console.log("x="+player.posI+";y="+player.posJ);
	var code = event.keyCode;
		if(code == 40 || code == 38 || code == 37 || code == 39){
			if(code == 40){
				for(var i = 0; i < npc_tab.length; i++){
					if(npc_tab[i].npcI == this.posI && npc_tab[i].npcJ == this.posJ+1){
						canGo = false;
					}
				}
			player.direction = "down";
			if(canGo && ((player.posJ + 1) < (WORLD_WIDTH - 1))){
				if(world[this.posI][this.posJ+1]!= TileType.WATER){
				if(this.onBoat == true){
					this.onBoat = false;
				}
				this.posJ ++;
				}
				else if(world[this.posI][this.posJ+1] == TileType.WATER){
				if(this.posI == boat.posI && this.posJ+1 == boat.posJ && this.onBoat == false){
					this.onBoat = true;
					this.posJ ++;
				}
				else if(this.onBoat == true){
					this.posJ ++;
					boat.posJ ++;
				}
				}
			}
			}		
			if(code == 38){
				for(var i = 0; i < npc_tab.length; i++){
					if(npc_tab[i].npcI == this.posI && npc_tab[i].npcJ == this.posJ-1){
						canGo = false;
					}
				}
			player.direction = "up";
			if(canGo && (player.posJ - 1) > 0 ){
				if(world[this.posI][this.posJ-1]!= TileType.WATER){
				if(this.onBoat == true){
					this.onBoat = false;
				}
				this.posJ --;
				}
				else if(world[this.posI][this.posJ-1] == TileType.WATER){
				if(this.posI == boat.posI && this.posJ-1 == boat.posJ && this.onBoat == false){
					this.onBoat = true;
					this.posJ --;
				}
				else if(this.onBoat == true){
					this.posJ --;
					boat.posJ --;
				}	
				}		
			}
			}
			if(code == 37){
				for(var i = 0; i < npc_tab.length; i++){
					if(npc_tab[i].npcI == this.posI-1 && npc_tab[i].npcJ == this.posJ){
						canGo = false;
					}
				}
			player.direction = "left";
			if(canGo && (player.posI - 1) > 0 ){
				if(world[this.posI-1][this.posJ]!= TileType.WATER){
				if(this.onBoat == true){
					this.onBoat = false;
				}
				this.posI --;
				}
				else if(world[this.posI-1][this.posJ] == TileType.WATER){
				if(this.posI-1 == boat.posI && this.posJ == boat.posJ && this.onBoat == false){
					this.onBoat = true;
					this.posI --;
				}
				else if(this.onBoat == true){
					this.posI --;
					boat.posI --;
				}		
				}		
			}	
			}
			if(code == 39){
				for(var i = 0; i < npc_tab.length; i++){
					if(npc_tab[i].npcI == this.posI+1 && npc_tab[i].npcJ == this.posJ){
						canGo = false;
					}
				}
			player.direction = "right";
			if(canGo && (player.posI + 1) < (WORLD_WIDTH - 1)){
				if(world[this.posI+1][this.posJ]!= TileType.WATER){
				if(this.onBoat == true){
					this.onBoat = false;
				}
				this.posI ++;
				}
				else if(world[this.posI+1][this.posJ] == TileType.WATER){
				if(this.posI+1 == boat.posI && this.posJ == boat.posJ && this.onBoat == false){
					this.onBoat = true;
					this.posI ++;
				}
				else if(this.onBoat == true){
					this.posI ++;
					boat.posI ++;
				}
				}		
			}
			}
			this.img.src = this.src;
			if(this.direction==="up"){
			this.img.src += "link_back_0.png";
			} else if(this.direction==="left"){
			this.img.src += "link_left_1.png";
			} else if(this.direction==="right"){
			this.img.src += "link_right_1.png";
			} else if(this.direction==="down"){
			this.img.src += "link_front_0.png";
			} else {
			console.error("undefined direction");
			}
			if(this.onBoat){
				boat.img.src = boat.src
				if(this.direction==="up"){
					boat.img.src += "boat_back.png";
				} else if(this.direction==="left"){
					boat.img.src += "boat_left.png";
				} else if(this.direction==="right"){
					boat.img.src += "boat_right.png";
				} else if(this.direction==="down"){
					boat.img.src += "boat_front.png";
				} else {
					console.error("undefined direction");
				}
			}
		}			
		boat.dom.style.top=(boat.posJ*TILE_SIZE)+"px";
		boat.dom.style.left=(boat.posI*TILE_SIZE)+"px";
		player.dom.style.top=(player.posJ*TILE_SIZE)+"px";
		player.dom.style.left=(player.posI*TILE_SIZE)+"px";
    }
}

function initPlayer(){
    var placed = false;
    var playerSrc = "res/spritesheets/link/";
    var DOM = document.getElementById("player");
    var IMG = document.createElement("img");
    var sword;
    while(placed==false){
	var randomI = Math.floor((Math.random() * (WORLD_WIDTH -1)));
	var randomJ = Math.floor((Math.random() * (WORLD_WIDTH -1)));
	if(((randomI+(RENDER_SIZE/2)+1) < WORLD_WIDTH) && ((randomJ+(RENDER_SIZE/2)+1) < WORLD_WIDTH) && ((randomI-(RENDER_SIZE/2)) >= 0) && ((randomJ-(RENDER_SIZE/2)) >= 0)){
	    if(world[randomI][randomJ] == TileType.GRASS || world[randomI][randomJ] == TileType.SAND){		
		sword = new weaponConstructor(randomI,randomJ);
		sword.init();
		player = new playerConstructor(playerSrc,randomI,randomJ,16,false,DOM,IMG,"up",sword);
		player.img.src = player.src+"link_front_0.png";
		player.dom.appendChild(player.img);
		player.dom.appendChild(sword.dom);
		placed = true;
	    }
	}
    }
    replace();
}

function replace(){
    console.log(player.onBoat);
    player.posI = player.initI;
    player.posJ = player.initJ;
		
	player.dom.style.top=(player.posJ*TILE_SIZE)+"px";
	player.dom.style.left=(player.posI*TILE_SIZE)+"px";
}


////////////////////////////// BOAT //////////////////////////////


function boatConstructor(src,initI,initJ,DOM,IMG){
    this.src = src;
    this.initI = initI;
    this.initJ = initJ;
    this.posI = initI;
    this.posJ = initJ;
    this.dom = DOM;
    this.img = IMG;
}

function initBoat(){
	if(document.getElementById("boat")){
		jeu.removeChild(divBoat);
	}
    var placed = false;
	divBoat = document.createElement("div");
    divBoat.id = "boat";
	jeu.appendChild(divBoat);
    var boatSrc = "res/spritesheets/boat/";
    var DOM = document.getElementById("boat");
    var IMG = document.createElement("img");
	
    while(placed==false){
	var randomI = Math.floor((Math.random() * (WORLD_WIDTH -2))+1);
	var randomJ = Math.floor((Math.random() * (WORLD_WIDTH -2))+1);
	if(world[randomI][randomJ] == TileType.WATER){
	    if((world[randomI-1][randomJ] == TileType.GRASS && world[randomI+1][randomJ] == TileType.WATER && world[randomI][randomJ-1] == TileType.WATER && world[randomI][randomJ+1] == TileType.WATER )||
	       (world[randomI+1][randomJ] == TileType.GRASS && world[randomI-1][randomJ] == TileType.WATER && world[randomI][randomJ-1] == TileType.WATER && world[randomI][randomJ+1] == TileType.WATER) ||
	       (world[randomI][randomJ-1] == TileType.GRASS && world[randomI][randomJ+1] == TileType.WATER && world[randomI-1][randomJ] == TileType.WATER && world[randomI+1][randomJ] == TileType.WATER) || 
	       (world[randomI][randomJ+1] == TileType.GRASS && world[randomI][randomJ-1] == TileType.WATER && world[randomI-1][randomJ] == TileType.WATER && world[randomI+1][randomJ] == TileType.WATER)){
		boat = new boatConstructor(boatSrc,randomI,randomJ,DOM,IMG);
		boat.img.src = boat.src + "boat_front.png";
		boat.dom.appendChild(boat.img);
		placed = true;
		
		replaceBoat();
	    }
	}
    }
}

function replaceBoat(){
    boat.dom.style.top = boat.initJ*TILE_SIZE + "px";
    boat.dom.style.left= boat.initI*TILE_SIZE + "px";
    boat.posI = boat.initI;
    boat.posJ = boat.initJ;
}

////////////////////////////// NPC //////////////////////////////

function npcConstructor(id, src, I, J,DOM,IMG,pas){
    this.npcI  = I;
    this.npcJ  = J;
    this.npcId = id;
    this.src = src;
    this.pas = pas;
    this.npcDOM = DOM;
    this.npcImg = IMG;
    
    this.move = function(){
	var canGo = true;
	var X = this.npcDOM.style.left;
	var Y = this.npcDOM.style.top;
	var nbX = X.slice(0,X.length-2);
	var nbY = Y.slice(0,Y.length-2);
	var randomDir = Math.random();
	if(randomDir < 0.25 && randomDir >= 0){
	    // "up"
	    for(var i = 0; i < npc_tab.length ; i++){
		if(this.npcId != i){	
		    if(this.npcJ-1 == player.posJ && this.npcI == player.posI){
			canGo = false;
		    }
		}
	    }
	    if(world[this.npcI][this.npcJ-1]!= TileType.WATER && this.npcJ-1 > 0 && canGo){
		//this.npcDOM.style.top = this.npcJ - this.pas + "px";
		this.npcJ --;
		this.npcImg.src = this.src + "npc_back.png"
	    }
	}
	else if(randomDir < 0.5 && randomDir >= 0.25){
	    // "down"
	    for(var i = 0; i < npc_tab.length ; i++){
		if(this.npcId != i){	
		    if(this.npcJ+1==player.posJ && this.npcI == player.posI){
			canGo = false;
		    }
		}
	    }
	    if(world[this.npcI][this.npcJ+1] != TileType.WATER && this.npcJ+1 < WORLD_WIDTH-1 && canGo){
		//this.npcDOM.style.top = this.npcJ + this.pas + "px";
		this.npcJ ++;
		this.npcImg.src = this.src + "npc_front.png"
	    }
	}
	else if(randomDir < 0.75 && randomDir >= 0.5){
	    // "left"
	    for(var i = 0; i < npc_tab.length ; i++){
			if(this.npcId != i){					
				if(this.npcI-1 == player.posI && this.npcJ == player.posJ){
				canGo = false;
				}
			}
	    }
	    if(world[this.npcI-1][this.npcJ] != TileType.WATER && this.npcI-1 > 0 && canGo){
		//this.npcDOM.style.left = this.npcI - this.pas + "px";
		this.npcI --;
		this.npcImg.src = this.src + "npc_left.png"
	    }
	}
	else if(randomDir <= 1 && randomDir >= 0.75){
	    // "right"
	    for(var i = 0; i < npc_tab.length ; i++){
		if(this.npcId != i){
		    if(this.npcI+1 == player.posI && this.npcJ == player.posJ){
			canGo = false;
		    }
		}
	    }
	    if(world[this.npcI+1][this.npcJ] != TileType.WATER && this.npcI+1 < WORLD_WIDTH-1 && canGo){
		//this.npcDOM.style.left = this.npcI + this.pas + "px";
		this.npcI ++;
		this.npcImg.src = this.src + "npc_right.png"
	    }
	}
	this.npcDOM.style.top = (this.npcJ * TILE_SIZE) +"px";
	this.npcDOM.style.left = (this.npcI * TILE_SIZE) +"px";
    }
}

function initNPCS(npcNumber){
    var counter = 0;
    var npcSrc = "res/spritesheets/npc/";
    while(counter < npcNumber){
	var DOM = document.createElement("div");
	var IMG = document.createElement("img");
	var npc;
	var randomI = Math.floor((Math.random() * (WORLD_WIDTH -1)));
	var randomJ = Math.floor((Math.random() * (WORLD_WIDTH -1)));
	if(world[randomI][randomJ] != TileType.WATER && randomI-1 > 0 && randomJ -1 > 0 && randomI+1 < WORLD_WIDTH && randomJ+1 < WORLD_WIDTH){
	    if(randomI != player.posI && randomJ != player.posJ){
		npc = new npcConstructor(counter,npcSrc,randomI,randomJ,DOM,IMG,16);
		npc.npcDOM.id = "npc"+counter;
		npc.npcImg.src = npcSrc + "npc_front.png";
		npc.npcDOM.appendChild(npc.npcImg);
		npc.npcDOM.style.zIndex = 2;
		npc.npcDOM.style.position = "absolute";
		npc_tab[counter] = npc;
		placeNPC(counter,randomI,randomJ);
		counter++;
	    }
	}
    }
}

function placeNPC(id,i,j){
    npc_tab[id].npcDOM.style.top = j*TILE_SIZE + "px";
    npc_tab[id].npcDOM.style.left= i*TILE_SIZE + "px";
    npc_tab[id].npcI = i;
    npc_tab[id].npcJ = j;
}

function npcMoves(){
    for(var i = 0; i < npc_tab.length ; i++){
	npc_tab[i].move();
    }
}






