//GLOBALS
var world;
var jeu;
const WORLD_WIDTH = 33;
const COEFF_SCALE = 1.5;
const LENGTH = 3;
const WATER_RATIO = 0.3;
var T_DYN_WATER = 0;
const TILE_SIZE = 16;

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
    gen();
    render(WORLD_WIDTH);
    //render(50);
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
    for(var i = 0; i < SIZE; i++)
    {
	for(var j = 0; j < SIZE; j++)
	{
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
	    t.style="width:"+(TILE_SIZE)+"px;height:"+(TILE_SIZE)+"+px;position:absolute;margin:0;top:"+(TILE_SIZE*j)+"px;left:"+(TILE_SIZE*i)+"px;";
	    jeu.appendChild(t);
	}
    }
}


////////////////////////////// PLAYER ////////////////////////////

// Var

var posI;
var posJ;
var initI;
var initJ;
var pas = 16;
var player = document.getElementById("player");
var playerImg = document.createElement("img");
var playerSrc = "res/spritesheets/link/";
playerImg.src = playerSrc;
playerImg.src += "link_front_0.png";
player.appendChild(playerImg);

function initPlace(){
    var placed = false;
    while(placed==false){
		var randomI = Math.floor((Math.random() * (WORLD_WIDTH -1)));
		var randomJ = Math.floor((Math.random() * (WORLD_WIDTH -1)));
		if(world[randomI][randomJ] == TileType.GRASS){
			initI = randomI;
			initJ = randomJ;
			placed = true;
		}
		else if(world[randomI][randomJ] == TileType.SAND){
			initI = randomI;
			initJ = randomJ;
			placed = true;
		}
    }
	replace();
}

function replace(){
    player.style.top = initJ*16 + "px";
    player.style.left= initI*16 + "px";
    posI = initI;
    posJ = initJ;
}

function move(event){
    var codeTouche = event.keyCode;
    var X = player.style.left;
    var Y = player.style.top;
    var nbX = X.slice(0,X.length-2);
    var nbY = Y.slice(0,Y.length-2);
    playerImg.src = playerSrc;
	
    if(codeTouche == 40 && ((Number(nbY)) + pas) < 513 && world[posI][posJ+1]!= TileType.WATER){
	player.style.top = (Number(nbY)) + pas + "px";
	posJ ++;
	playerImg.src += "link_front_0.png";
    }
    if(codeTouche == 38 && ((Number(nbY)) - pas) >= 0 && world[posI][posJ-1]!= TileType.WATER){
	player.style.top = (Number(nbY)) - pas + "px";
	posJ --;
	playerImg.src += "link_back_0.png";
    }
    if(codeTouche == 37 && ((Number(nbX)) - pas) >= 0 && world[posI-1][posJ]!= TileType.WATER){
	player.style.left = (Number(nbX)) - pas + "px";
	posI --;
	playerImg.src += "link_left_1.png";
    }
    if(codeTouche == 39 && ((Number(nbX)) + pas) < 513 && world[posI+1][posJ]!= TileType.WATER){
	player.style.left = (Number(nbX)) + pas + "px";
	posI ++;
	playerImg.src += "link_right_1.png";
    }
}
