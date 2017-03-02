//GLOBALS
var world;
var jeu;
var body;
var divPlayer;
var divBoat;
var weapon;
const WORLD_WIDTH = 65;
const COEFF_SCALE = 1.5;
const LENGTH = 3;
const WATER_RATIO = 0.3;
var T_DYN_WATER = 0;
const TILE_SIZE = 16;
const RENDER_SIZE = 10;
const NPC_NUMBER = 1;
var npc_tab = Array(NPC_NUMBER);

const TileType = {
    WATER : 0,
    GRASS : 1,
    SAND : 2
};

// Fonction sleep
function sleep (time) {
  return new Promise(

(resolve) => setTimeout(resolve, time));
}

//Random function between two ints
function rand(low,high){
    return Math.floor((Math.random() * high) + low);
}

//INIT
function init(){
    jeu = document.getElementById("jeu");
    body = document.getElementsByTagName("body")[0];
    weapon = document.createElement("div");
    weaponImg = document.createElement("img");
    weapon.appendChild(weaponImg);
    weapon.id = "weapon";
    jeu.appendChild(weapon);
    divPlayer = document.createElement("div");
    divPlayer.id = "player";
    divBoat = document.createElement("div");
    divBoat.id = "boat";
    gen();
    body.appendChild(divPlayer);
    body.appendChild(divBoat);
    initPlayer();
    initBoat();
    player.playerDOM.style.zIndex = 1;
    boat.boatDOM.style.zIndex = 2;
    initNPCS(NPC_NUMBER);
    for(var i = 0; i < NPC_NUMBER; i++){
	jeu.appendChild(npc_tab[i].npcDOM);
    }
    render(WORLD_WIDTH);
    //render(RENDER_SIZE);
    setInterval(npcMoves,1000);
}

function relancer(){
    body.removeChild(divPlayer);
    body.removeChild(divBoat);
    for(var i = 0; i < NPC_NUMBER; i++){
	jeu.removeChild(npc_tab[i].npcDOM);
    }
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

function render(SIZE){
    for(var i = 0/*(player.posI-(SIZE/2))*/; i < SIZE/*(player.posI+(SIZE/2)+1)*/; i++){
	for(var j = 0 /*(player.posJ-(SIZE/2))*/; j < SIZE /*(player.posJ+(SIZE/2)+1)*/; j++){
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

var player;

function playerConstructor(src,initI,initJ,pas,onBoat,DOM,IMG,dir){
var player = this;    
player.src = src;
    player.initI = initI;
    player.initJ = initJ;
    player.posI = initI;
    player.posJ = initJ;
    player.pas = pas;
    player.onBoat = onBoat;
    player.playerDOM = DOM;
    player.playerImg = IMG;
    player.direction = dir;
    player.compteur = 0;
    player.canEraseSword = false;
    
    // PLAYER'S ATTACK
    player.attack = function(event){
	if(event.keyCode == 32){
	    var weapSrc = "res/spritesheets/link/weapons/";
	    var atkLength = 4*TILE_SIZE;
	    switch(player.direction){
	    case "up":
		weaponImg.src = weapSrc + "sword_up.png";
		weapon.style.top =player.posJ*TILE_SIZE - TILE_SIZE + "px";
		weapon.style.left=player.posI*TILE_SIZE + "px";
		weapon.style.visibility = "visible";
		var X = weapon.style.left;
		var Y = weapon.style.top;
		var nbX = X.slice(0,X.length-2);
		var nbY = Y.slice(0,Y.length-2);
		setInterval(function(){
		    if(player.compteur<atkLength+1){
			weapon.style.top = (Number(nbY)) - 8 + "px";
			player.compteur+=8;
		    }
		}, 500);		
		break;
	    case "down":
		divAtk.style.top = player.posJ*TILE_SIZE + TILE_SIZE + "px";
		divAtk.style.left=player.posI*TILE_SIZE + "px";
		break;
	    case "left":
		divAtk.style.top = player.posJ*TILE_SIZE + "px";
		divAtk.style.left=player.posI*TILE_SIZE - TILE_SIZE + "px";
		break;
	    case "right":
		divAtk.style.top = player.posJ*TILE_SIZE + "px";
		divAtk.style.left=player.posI*TILE_SIZE + TILE_SIZE + "px";
		break;
	    }
	    //weapon.visibility = "hidden";
	    clearInterval();
	}
    }    
    // PLAYER MOTION
    this.move = function(event,boat){
	var codeTouche = event.keyCode;
	if(codeTouche == 40 || codeTouche == 38 || codeTouche == 37 || codeTouche == 39){
	    
	    var X = this.playerDOM.style.left;
	    var Y = this.playerDOM.style.top;
	    var nbX = X.slice(0,X.length-2);
	    var nbY = Y.slice(0,Y.length-2);
	    var canGo = true;
	    this.playerImg.src = src;
	    
	    if(codeTouche == 40){
		player.direction = "down";
		for(var i = 0; i < npc_tab.length ; i++){
		    if(this.posJ+1 == npc_tab[i].npcJ && this.posI == npc_tab[i].npcI){
			canGo = false;
		    }
		}
		if(canGo && ((Number(nbY)) + this.pas) < (WORLD_WIDTH*TILE_SIZE)){
		    if(world[this.posI][this.posJ+1]!= TileType.WATER){
			/*if((((this.posJ+(RENDER_SIZE/2))+1) < WORLD_WIDTH) && (((this.posJ-(RENDER_SIZE/2))+1) > 0)){
			  moveCam(1,RENDER_SIZE);
			  }*/
			if(this.onBoat == true){
			    this.onBoat = false;
			    boat.boatImg.src = boat.src + "boat_front.png";
			}
			this.playerDOM.style.top = (Number(nbY)) + this.pas + "px";
			this.posJ ++;
		    }
		    else if(world[this.posI][this.posJ+1] == TileType.WATER){
			if(this.posI == boat.posI && this.posJ+1 == boat.posJ && this.onBoat == false){
			    /*if((((this.posJ+(RENDER_SIZE/2))+1) < WORLD_WIDTH) && (((this.posJ-(RENDER_SIZE/2))+1) > 0)){
			      moveCam(1,RENDER_SIZE);
			      }*/
			    this.onBoat = true;
			    this.playerDOM.style.top = (Number(nbY)) + this.pas + "px";
			    this.posJ ++;
			}
			else if(this.onBoat == true){
			    /*if((((this.posJ+(RENDER_SIZE/2))+1) < WORLD_WIDTH) && (((this.posJ-(RENDER_SIZE/2))+1) > 0)){
			      moveCam(1,RENDER_SIZE);
			      }*/
			    this.playerDOM.style.top = (Number(nbY)) + this.pas + "px";
			    boat.boatDOM.style.top = (Number(nbY)) + this.pas + "px";
			    this.posJ ++;
			    boat.posJ ++;						
			    boat.boatImg.src = boat.src + "boat_front.png";
			}
		    }
		}
		this.playerImg.src += "link_front_0.png";
	    }		
	    if(codeTouche == 38){
		player.direction = "up";
		for(var i = 0; i < npc_tab.length ; i++){
		    if(this.posJ-1 == npc_tab[i].npcJ && this.posI == npc_tab[i].npcI){
			canGo = false;
		    }
		}
		if(canGo && ((Number(nbY)) - this.pas) >= 0 ){
		    if(world[this.posI][this.posJ-1]!= TileType.WATER){
			/*if((((this.posJ-(RENDER_SIZE/2))-1) >= 0) && (((this.posJ+(RENDER_SIZE/2))-1) < WORLD_WIDTH-1)){
			  moveCam(2,RENDER_SIZE);
			  }*/
			if(this.onBoat == true){
			    this.onBoat = false;
			    boat.boatImg.src = boat.src + "boat_front.png";
			}
			this.playerDOM.style.top = (Number(nbY)) - this.pas + "px";
			this.posJ --;
			this.playerImg.src += "link_back_0.png";
		    }
		    else if(world[this.posI][this.posJ-1] == TileType.WATER){
			if(this.posI == boat.posI && this.posJ-1 == boat.posJ && this.onBoat == false){
			    /*if((((this.posJ-(RENDER_SIZE/2))-1) >= 0) && (((this.posJ+(RENDER_SIZE/2))-1) < WORLD_WIDTH-1)){
			      moveCam(2,RENDER_SIZE);
			      }*/
			    this.onBoat = true;
			    this.playerDOM.style.top = (Number(nbY)) - this.pas + "px";
			    this.posJ --;
			    this.playerImg.src += "link_front_0.png";
			}
			else if(this.onBoat == true){
			    /*if((((this.posJ-(RENDER_SIZE/2))-1) >= 0) && (((this.posJ+(RENDER_SIZE/2))-1) < WORLD_WIDTH-1)){
			      moveCam(2,RENDER_SIZE);
			      }*/
			    this.playerDOM.style.top = (Number(nbY)) - this.pas + "px";
			    boat.boatDOM.style.top = (Number(nbY)) - this.pas + "px";
			    this.posJ --;
			    boat.posJ --;
			    this.playerImg.src += "link_back_0.png";
			    boat.boatImg.src = boat.src + "boat_back.png";
			}
			else{
			    this.playerImg.src += "link_back_0.png";
			}	
		    }	
		    else{
			this.playerImg.src += "link_back_0.png";
		    }		
		}
		else{
		    this.playerImg.src += "link_back_0.png";
		}
	    }
	    if(codeTouche == 37){
		player.direction = "left";
		for(var i = 0; i < npc_tab.length ; i++){
		    if(this.posJ == npc_tab[i].npcJ && this.posI-1 == npc_tab[i].npcI){
			canGo = false;
		    }
		}
		if(canGo && ((Number(nbX)) - this.pas) >= 0 ){
		    if(world[this.posI-1][this.posJ]!= TileType.WATER){
			/*if((((this.posI-(RENDER_SIZE/2))-1) >= 0) && (((this.posI+(RENDER_SIZE/2))-1) < WORLD_WIDTH-1) && (this.posJ+1+(RENDER_SIZE/2) <= WORLD_WIDTH) && (this.posJ-(RENDER_SIZE/2) >= -1)){
			  moveCam(4,RENDER_SIZE);
			  }*/
			if(this.onBoat == true){
			    this.onBoat = false;
			    boat.boatImg.src = boat.src + "boat_front.png";
			}
			this.playerDOM.style.left = (Number(nbX)) - this.pas + "px";
			this.posI --;
			this.playerImg.src += "link_left_1.png";
		    }
		    else if(world[this.posI-1][this.posJ] == TileType.WATER){
			if(this.posI-1 == boat.posI && this.posJ == boat.posJ && this.onBoat == false){
			    /*if((((this.posI-(RENDER_SIZE/2))-1) >= 0) && (((this.posI+(RENDER_SIZE/2))-1) < WORLD_WIDTH-1) && (this.posJ+1+(RENDER_SIZE/2) <= WORLD_WIDTH) && (this.posJ-(RENDER_SIZE/2) >= -1)){
			      moveCam(4,RENDER_SIZE);
			      }*/
			    this.onBoat = true;
			    this.playerDOM.style.left = (Number(nbX)) - this.pas + "px";
			    this.posI --;
			    this.playerImg.src += "link_front_0.png";
			}
			else if(this.onBoat == true){
			    /*if((((this.posI-(RENDER_SIZE/2))-1) >= 0) && (((this.posI+(RENDER_SIZE/2))-1) < WORLD_WIDTH-1) && (this.posJ+1+(RENDER_SIZE/2) <= WORLD_WIDTH) && (this.posJ-(RENDER_SIZE/2) >= -1)){
			      moveCam(4,RENDER_SIZE);
			      }*/
			    this.playerDOM.style.left = (Number(nbX)) - this.pas + "px";
			    boat.boatDOM.style.left = (Number(nbX)) - this.pas + "px";
			    this.posI --;
			    boat.posI --;
			    this.playerImg.src += "link_left_1.png";
			    boat.boatImg.src = boat.src + "boat_left.png";
			}
			else{
			    this.playerImg.src += "link_left_1.png";
			}		
		    }	
		    else{
			this.playerImg.src += "link_left_1.png";
		    }		
		}
		else{
		    this.playerImg.src += "link_left_1.png";
		}	
	    }
	    if(codeTouche == 39){
		player.direction = "right";
		for(var i = 0; i < npc_tab.length ; i++){
		    if(this.posJ == npc_tab[i].npcJ && this.posI+1 == npc_tab[i].npcI){
			canGo = false;
		    }
		}
		if(canGo && ((Number(nbX)) + this.pas) < (WORLD_WIDTH*TILE_SIZE)){
		    if(world[this.posI+1][this.posJ]!= TileType.WATER){
			/*if((((this.posI+(RENDER_SIZE/2))+1) >= 0) && (((this.posI-(RENDER_SIZE/2))+1) < WORLD_WIDTH-1) && (this.posJ+1+(RENDER_SIZE/2) <= WORLD_WIDTH) && (this.posJ-(RENDER_SIZE/2) >= -1)){
			  moveCam(3,RENDER_SIZE);
			  }*/
			if(this.onBoat == true){
			    this.onBoat = false;
			    boat.boatImg.src = boat.src + "boat_front.png";
			}
			this.playerDOM.style.left = (Number(nbX)) + this.pas + "px";
			this.posI ++;
			this.playerImg.src += "link_right_1.png";
		    }
		    else if(world[this.posI+1][this.posJ] == TileType.WATER){
			if(this.posI+1 == boat.posI && this.posJ == boat.posJ && this.onBoat == false){
			    /*if((((posI+(RENDER_SIZE/2))+1) < WORLD_WIDTH) && (((posI-(RENDER_SIZE/2))+1) > 0)){
			      moveCam(3,RENDER_SIZE);
			      }*/
			    /*if((((this.posI+(RENDER_SIZE/2))+1) >= 0) && (((this.posI-(RENDER_SIZE/2))+1) < WORLD_WIDTH-1) && (this.posJ+1+(RENDER_SIZE/2) <= WORLD_WIDTH) && (this.posJ-(RENDER_SIZE/2) >= -1)){
			      moveCam(3,RENDER_SIZE);
			      }*/
			    this.onBoat = true;
			    this.playerDOM.style.left = (Number(nbX)) + this.pas + "px";
			    this.posI ++;
			    this.playerImg.src += "link_front_0.png";
			}
			else if(this.onBoat == true){
			    /*if((((this.posI+(RENDER_SIZE/2))+1) >= 0) && (((this.posI-(RENDER_SIZE/2))+1) < WORLD_WIDTH-1) && (this.posJ+1+(RENDER_SIZE/2) <= WORLD_WIDTH) && (this.posJ-(RENDER_SIZE/2) >= -1)){
			      moveCam(3,RENDER_SIZE);
			      }*/
			    this.playerDOM.style.left = (Number(nbX)) + this.pas + "px";
			    boat.boatDOM.style.left = (Number(nbX)) + this.pas + "px";
			    this.posI ++;
			    boat.posI ++;
			    this.playerImg.src += "link_right_1.png";
			    boat.boatImg.src = boat.src + "boat_right.png";
			}
			else{
			    this.playerImg.src += "link_right_1.png";
			}
		    }
		    else{
			this.playerImg.src += "link_right_1.png";
		    }		
		}
		else{
		    this.playerImg.src += "link_right_1.png";
		}
	    }
	}
    }
}

function initPlayer(){
    var placed = false;
    var playerSrc = "res/spritesheets/link/";
    var DOM = document.getElementById("player");
    var IMG = document.createElement("img");
    while(placed==false){
	var randomI = Math.floor((Math.random() * (WORLD_WIDTH -1)));
	var randomJ = Math.floor((Math.random() * (WORLD_WIDTH -1)));
	if(((randomI+(RENDER_SIZE/2)+1) < WORLD_WIDTH) && ((randomJ+(RENDER_SIZE/2)+1) < WORLD_WIDTH) && ((randomI-(RENDER_SIZE/2)) >= 0) && ((randomJ-(RENDER_SIZE/2)) >= 0)){
	    if(world[randomI][randomJ] == TileType.GRASS){
		player = new playerConstructor(playerSrc,randomI,randomJ,16,false,DOM,IMG,"up");
		player.playerImg.src = player.src+"link_front_0.png";
		player.playerDOM.appendChild(player.playerImg);
		placed = true;
	    }
	    else if(world[randomI][randomJ] == TileType.SAND){
		player = new playerConstructor(playerSrc,randomI,randomJ,16,false,DOM,IMG,"up");
		player.playerImg.src = player.src+"link_front_0.png";
		player.playerDOM.appendChild(player.playerImg);
		placed = true;
	    }
	}
    }
    replace();
}

function replace(){
    console.log(player.onBoat);
    player.playerDOM.style.top = player.initJ*TILE_SIZE + "px";
    player.playerDOM.style.left= player.initI*TILE_SIZE + "px";
    player.posI = player.initI;
    player.posJ = player.initJ;
}

function moveCam(dir,SIZE){
    switch(dir){
    case 1:
	var i = (player.posJ-(SIZE/2));
	var k = (player.posJ+(SIZE/2)+1);
	for(var j = (player.posI-(SIZE/2)); j < (player.posI+(SIZE/2)+1) ; j++){
	    var idOldChild = j+''+i;
	    var oldChild = document.getElementById(idOldChild);
	    jeu.removeChild(oldChild);
	    
	    var idNewChild = j+''+k;			
	    var newChild  = document.createElement("img");
	    var src = "img/";
	    switch(world[j][k]){
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
	    newChild.src = src;
	    newChild.id += idNewChild;
	    newChild.style="width:"+(TILE_SIZE)+"px;height:"+(TILE_SIZE)+"+px;position:absolute;margin:0;top:"+(TILE_SIZE*k)+"px;left:"+(TILE_SIZE*j)+"px;";
	    jeu.appendChild(newChild);
	}
	break;
    case 2:
	var i = (player.posJ-(SIZE/2));
	var k = (player.posJ+(SIZE/2)+1);
	for(var j = (player.posI-(SIZE/2)); j < (player.posI+(SIZE/2)+1) ; j++){
	    var idOldChild = j+''+(k-1);
	    var oldChild = document.getElementById(idOldChild);
	    jeu.removeChild(oldChild);
	    
	    var idNewChild = j+''+(i-1);			
	    var newChild  = document.createElement("img");
	    var src = "img/";
	    switch(world[j][i-1]){
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
	    newChild.src = src;
	    newChild.id += idNewChild;
	    newChild.style="width:"+(TILE_SIZE)+"px;height:"+(TILE_SIZE)+"+px;position:absolute;margin:0;top:"+(TILE_SIZE*(i-1))+"px;left:"+(TILE_SIZE*j)+"px;";
	    jeu.appendChild(newChild);
	}	
	break;
    case 3:
	var i = (player.posI-(SIZE/2));
	var k = (player.posI+(SIZE/2)+1);
	for(var j = (player.posJ-(SIZE/2)); j < (player.posJ+(SIZE/2)+1) ; j++){
	    var idOldChild = i+''+j;
	    var oldChild = document.getElementById(idOldChild);
	    jeu.removeChild(oldChild);
	    
	    var idNewChild = k+''+j;			
	    var newChild  = document.createElement("img");
	    var src = "img/";
	    switch(world[k][j]){
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
	    newChild.src = src;
	    newChild.id += idNewChild;
	    newChild.style="width:"+(TILE_SIZE)+"px;height:"+(TILE_SIZE)+"+px;position:absolute;margin:0;top:"+(TILE_SIZE*j)+"px;left:"+(TILE_SIZE*k)+"px;";
	    jeu.appendChild(newChild);
	}
	break;
    case 4:
	var i = (player.posI-(SIZE/2));
	var k = (player.posI+(SIZE/2)+1);
	for(var j = (player.posJ-(SIZE/2)); j < (player.posJ+(SIZE/2)+1) ; j++){
	    var idOldChild = (k-1)+''+j;
	    var oldChild = document.getElementById(idOldChild);
	    jeu.removeChild(oldChild);
	    
	    var idNewChild = (i-1)+''+j;			
	    var newChild  = document.createElement("img");
	    var src = "img/";
	    switch(world[i-1][j]){
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
	    newChild.src = src;
	    newChild.id += idNewChild;
	    newChild.style="width:"+(TILE_SIZE)+"px;height:"+(TILE_SIZE)+"+px;position:absolute;margin:0;top:"+(TILE_SIZE*j)+"px;left:"+(TILE_SIZE*(i-1))+"px;";
	    jeu.appendChild(newChild);
	}	
	break;
    }	
}



////////////////////////////// BOAT //////////////////////////////

// Var

var boat;

function boatConstructor(src,initI,initJ,DOM,IMG){
    this.src = src;
    this.initI = initI;
    this.initJ = initJ;
    this.posI = initI;
    this.posJ = initJ;
    this.boatDOM = DOM;
    this.boatImg = IMG;
}

function initBoat(){
    var placed = false;
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
		boat.boatImg.src = boat.src + "boat_front.png";
		boat.boatDOM.appendChild(boat.boatImg);
		placed = true;
	    }
	}
    }
    replaceBoat();
}

function replaceBoat(){
    boat.boatDOM.style.top = boat.initJ*TILE_SIZE + "px";
    boat.boatDOM.style.left= boat.initI*TILE_SIZE + "px";
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
		    if((this.npcJ-1 == player.posJ && this.npcI == player.posI) || (this.npcJ-1 == npc_tab[i].npcJ+1 && this.npcI == npc_tab[i].npcI) || 
		       (this.npcJ-1 == npc_tab[i].npcI+1 && this.npcI == npc_tab[i].npcJ) ||
		       (this.npcJ-1 == npc_tab[i].npcI-1 && this.npcI == npc_tab[i].npcJ)){
			canGo = false;
		    }
		}
	    }
	    if(world[this.npcI][this.npcJ-1]!= TileType.WATER && this.npcJ-1 > 0 && canGo){
		this.npcDOM.style.top = (Number(nbY)) - this.pas + "px";
		this.npcJ --;
	    }
	}
	else if(randomDir < 0.5 && randomDir >= 0.25){
	    // "down"
	    for(var i = 0; i < npc_tab.length ; i++){
		if(this.npcId != i){	
		    if((this.npcJ+1==player.posJ && this.npcI == player.posI) || (this.npcJ+1 == npc_tab[i].npcJ-1 && this.npcI == npc_tab[i].npcI) ||
		       (this.npcJ+1 == npc_tab[i].npcI+1 && this.npcI == npc_tab[i].npcJ) || 
		       (this.npcJ+1 == npc_tab[i].npcI-1 && this.npcI == npc_tab[i].npcJ)){
			canGo = false;
		    }
		}
	    }
	    if(world[this.npcI][this.npcJ+1] != TileType.WATER && this.npcJ+1 < WORLD_WIDTH-1 && canGo){
		this.npcDOM.style.top = (Number(nbY)) + this.pas + "px";
		this.npcJ ++;
	    }
	}
	else if(randomDir < 0.75 && randomDir >= 0.5){
	    // "left"
	    for(var i = 0; i < npc_tab.length ; i++){
		if(this.npcId != i){					
		    if((this.npcI-1 == player.posI && this.npcJ == player.posJ) || (this.npcI-1 == npc_tab[i].npcI+1 && this.npcJ == npc_tab[i].npcJ) ||
		       (this.npcI-1 == npc_tab[i].npcJ+1 && this.npcJ == npc_tab[i].npcI) || 
		       (this.npcI-1 == npc_tab[i].npcJ-1 && this.npcJ == npc_tab[i].npcI)){
			canGo = false;
		    }
		}
	    }
	    if(world[this.npcI-1][this.npcJ] != TileType.WATER && this.npcI-1 > 0 && canGo){
		this.npcDOM.style.left = (Number(nbX)) - this.pas + "px";
		this.npcI --;
	    }
	}
	else if(randomDir <= 1 && randomDir >= 0.75){
	    // "right"
	    for(var i = 0; i < npc_tab.length ; i++){
		if(this.npcId != i){
		    if((this.npcI+1 == player.posI && this.npcJ == player.posJ) || (this.npcI-1 == npc_tab[i].npcI+1 && this.npcJ == npc_tab[i].npcJ) ||
		       (this.npcI-1 == npc_tab[i].npcJ+1 && this.npcJ == npc_tab[i].npcI) ||
		       (this.npcI-1 == npc_tab[i].npcJ-1 && this.npcJ == npc_tab[i].npcI)){
			canGo = false;
		    }
		}
	    }
	    if(world[this.npcI+1][this.npcJ] != TileType.WATER && this.npcI+1 < WORLD_WIDTH && canGo){
		this.npcDOM.style.left = (Number(nbX)) + this.pas + "px";
		this.npcI ++;
	    }
	}
    }
}

function initNPCS(npcNumber){
    var counter = 0;
    var npcSrc = "res/spritesheets/";
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
		npc.npcImg.src = npcSrc + "skull_front.png";
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






