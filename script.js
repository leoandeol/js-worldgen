//GLOBALS VAR
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
var heart_number = 3;
const WORLD_WIDTH = 65;
const COEFF_SCALE = 1.5;
const LENGTH = 3;
const WATER_RATIO = 0.3;
var T_DYN_WATER = 0;
const TILE_SIZE = 16;
const RENDER_SIZE = 10;
const NPC_NUMBER = 20;
var npc_tab = Array(NPC_NUMBER);
var heart_tab = Array(heart_number);
var intervNpc;
var intervScore;

const TileType = {
    WATER : 0,
    GRASS : 1,
    SAND : 2
};

//Fonction qui retourne un entier aléatoire entre deux bornes
function rand(low,high){
    return Math.floor((Math.random() * high) + low);
}

// fonction d'initialisation pour le joueur le terrain, les npcs, le bateau, et tout l'affichage
function init(){
    jeu = document.getElementById("jeu");
	infos = document.getElementById("infos");
	
	//On génère aléatoirement le monde
	gen();
	
	// initialisation du joueur et du bateau
    initPlayer();
    initBoat();
	
	//initialisation des coeurs
	initHearts(heart_number);
	for(var i = 0; i < heart_number; i++){
		jeu.appendChild(heart_tab[i].dom);
    }
	
	//initialisation des npcs
    initNPCS(NPC_NUMBER);
	for(var i = 0; i < NPC_NUMBER; i++){
	jeu.appendChild(npc_tab[i].npcDOM);
    }
	
    tiles = document.createElement("div");
    jeu.appendChild(tiles);
	
	//initialisation du score
	scoreDOM = document.createElement("div");
	bestScore = document.createElement("div");
	score=0;    
	scoreDOM.innerHTML = "<p> Score <p id=\"score\"> 0 </p></p>"
	bestScore.id = "bestScore";
	infos.appendChild(scoreDOM);
	infos.appendChild(bestScore);
	
	//Affichage du tout
	render(WORLD_WIDTH);
	
	// INTERVALS
	
	//toute les 10 millisecondes on lance la fonction MajBestScore qui utilise ajax pour mettre à jour le meilleur score
	intervScore = setInterval(MajBestScore,10);
	//toutes les secondes on fait bouger les npc
    intervNpc = setInterval(npcMoves,1000);
	//toutes les 10 millisecondes on check les lifepoints du personnage et on check aussi si tous les npc ont été tués, si c'est le cas on affiche VICTOIRE ! et on relance
	setInterval(function(){		
		checkLifePoints();
		if(npc_tab.length==0){
			alert("VICTOIRE !");
			relancer();
		}
	},10);
}
// on supprime tout et on réinitialise
function relancer(){
    while (jeu.firstChild) {
	jeu.removeChild(jeu.firstChild);
    }
	infos.removeChild(scoreDOM);
	infos.removeChild(bestScore);
	clearInterval(intervNpc);
	//clearInterval(intervScore);
    init();	
}

//Fonction qui permet vérifier les points de vie du joueur
function checkLifePoints(){
	var imgLP = document.getElementById("LPimg");
	var LPsrc = "res/spritesheets/link/hearts/";
	//S'il n'a plus de pv on affiche GAME OVER et on relance, sinon on change l'affichage de ses pv
	if(player.life == 0){
		imgLP.src = LPsrc+="0_hearts.png";
		alert("GAME OVER");
		relancer();
	}
	else if(player.life ==1){
		imgLP.src = LPsrc+="1_hearts.png";		
	}
	else if(player.life ==2){
		imgLP.src = LPsrc+="2_hearts.png";		
	}
	else if(player.life ==3){
		imgLP.src = LPsrc+="3_hearts.png";		
	}
	
}


//WORLDGEN

// on lance les differentes fonctions de génération du monde
function gen(){
    //Fillin
    world = diamondsquare(WORLD_WIDTH);
    world = convert(world, LENGTH,WORLD_WIDTH);
    world = calculateWaterLevel(world,LENGTH,WORLD_WIDTH);
    console.log(world);
}

// cette fonction reprend l'algorithme diamondsquare qui à coup de moyennes avec une touche d'aléatoire crée une heightmap propre et fluide
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

// On normalise les valeurs du tableaux pour correspondre à l'intervalle qu'on veut avoir
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

// on calcule le niveau de l'eau pour que l'on aie 2/3 de la map immergée
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
// on supprime tous les tiles affichés
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

// Constructeur de l'objet arme
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

// Constructeur de l'objet player
function playerConstructor(src,initI,initJ,pas,onBoat,DOM,IMG,dir,weapon){
    var player = this;   
	player.life = 3;
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
	// fonction qui permet de vérifier si, lorsque le joueur attaque, un npc se trouve dans la direction vers laquelle il attaque. Si c'est le cas on incrémente le score et on supprime le npc en question du jeu.
    player.killNpc = function(){
	for(var i = 0; i < npc_tab.length; i++){
	    if((npc_tab[i].npcI == player.posI && npc_tab[i].npcJ == this.posJ-1 && this.direction == "up") || (npc_tab[i].npcI == player.posI && npc_tab[i].npcJ == this.posJ+1 && this.direction == "down") ||
	       (npc_tab[i].npcI == player.posI-1 && npc_tab[i].npcJ == this.posJ && this.direction == "left") || (npc_tab[i].npcI == player.posI+1 && npc_tab[i].npcJ == this.posJ && this.direction == "right")){
		score++;
		jeu.removeChild(npc_tab[i].npcDOM);
		npc_tab.splice(i,1);
		scoreDOM.innerHTML = "<p id=\"score\">Score : </p>"+score;
	    }
	}
    }

	// fonction qui permet de faire l'animation d'un attaque au joueur
    player.attack = function(event){
		// si on appuie sur la touche d'attaque (ici la barre espace) on va ensuite check la direction du personnage et faire apparaitre l'épée en fonction de cette direction, on lance ensuite la fonction killNPC
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
			break;		
			}
			
		player.killNpc();
		player.sword.dom.style.visibility = "visible";
		setTimeout(function(){
		player.sword.dom.style.visibility = "hidden";
		},200)			
	}
    }    
    // PLAYER MOTION
	
	// fonction qui permet de faire bouger le personnage et le bateau s'il est dessus
    this.move = function(event,boat){
		
		// variable qui permet de savoir s'il peut se déplacer dans la direction voulue
		var canGo = true;
		var code = event.keyCode;
		if(code == 40 || code == 38 || code == 37 || code == 39){ // codes des touches des flèches
			if(code == 40){
				for(var i = 0; i < npc_tab.length; i++){ // Si un npc se trouve à la position sur laquelle il veut aller
					if(npc_tab[i].npcI == this.posI && npc_tab[i].npcJ == this.posJ+1){
						canGo = false; // il ne peut pas y aller
					}
				}
				player.direction = "down"; // changement de la direction du joueur
				if(canGo && ((player.posJ + 1) < (WORLD_WIDTH - 1))){ // test de collision avec les limites du terrain
					if(world[this.posI][this.posJ+1]!= TileType.WATER){ // test de collision avec le type de case sur laquelle il veut se rendre
					if(this.onBoat == true){ // s'il est sur la bateau et qu'il veut se déplacer sur autre chose que de l'eau
						this.onBoat = false; // alors il descend du bateau
					}
					this.posJ ++; // on incrémente sa position
					}
					else if(world[this.posI][this.posJ+1] == TileType.WATER){ // s'il veut se déplacer sur de l'eau
						if(this.posI == boat.posI && this.posJ+1 == boat.posJ && this.onBoat == false){ // s'il est sur de la terre actuellement et que le bateau se trouve sur la case 'eau' sur laquelle il veut se déplacer
							this.onBoat = true; // il monte sur le bateau
							this.posJ ++; // et on incrémente sa position
						}
						else if(this.onBoat == true){ // s'il est déjà sur le bateau (ce qui implique qu'il est déjà sur de l'eau)
							this.posJ ++; // on bouge le player
							boat.posJ ++; // et le bateau
						}
					}
				}
			} 
			
			//// IDEM QUE PRECEDEMENT POUR LES 3 AUTRES TOUCHES
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
	    }
		
		
		// Cette partie s'occupe de rafraichir l'image du joueur après un déplacement (ou une tentative de déplacement) en fonction de la direction du joueur
	    this.img.src = this.src;
		// par exemple si le joueur regarde vers le haut alors on change son image en 'link_back_0.png'
	    if(this.direction==="up"){
		this.img.src += "link_back_0.png";		
		//même logique pour le reste
	    } else if(this.direction==="left"){
		this.img.src += "link_left_1.png";
	    } else if(this.direction==="right"){
		this.img.src += "link_right_1.png";
	    } else if(this.direction==="down"){
		this.img.src += "link_front_0.png";
	    } else {
		console.error("undefined direction");
	    }
		
		//même logique pour le bateau
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
		
		// On vérifie lors d'un déplacement s'il se trouve sur la position d'un coeur, si c'est le cas et qu'il a moins de 3 PV alors il regagne un PV et on supprime le coeur du jeu
		for(var i = 0; i < heart_tab.length; i++){
			if(player.posI == heart_tab[i].posI && player.posJ == heart_tab[i].posJ && player.life < 3){
				player.life++;
				jeu.removeChild(heart_tab[i].dom);
				heart_tab.splice(i,1);
			}
		}
		
		
		// modification des coordonnées du joueur et du bateau
		boat.dom.style.top=(boat.posJ*TILE_SIZE)+"px";
		boat.dom.style.left=(boat.posI*TILE_SIZE)+"px";
		player.dom.style.top=(player.posJ*TILE_SIZE)+"px";
		player.dom.style.left=(player.posI*TILE_SIZE)+"px";
    }
}


// Initialisation du joueur
function initPlayer(){
    var placed = false;
    var playerSrc = "res/spritesheets/link/";
	divPlayer = document.createElement("div");
    divPlayer.id = "player";
    jeu.appendChild(divPlayer);
    var DOM = document.getElementById("player");
    var IMG = document.createElement("img");
	// l'épée du joueur
    var sword;
	
	//tant que le joueur n'a pas été placé
    while(placed==false){
		// on prend des indices aléatoire dans les limites du tableau du jeu
	var randomI = Math.floor((Math.random() * (WORLD_WIDTH -1)));
	var randomJ = Math.floor((Math.random() * (WORLD_WIDTH -1)));
	// et on vérifie si à ces coordonnées du jeu on peut placer le joueur (càd pas dans l'eau et ni en dehors des limites)
	if(((randomI+(RENDER_SIZE/2)+1) < WORLD_WIDTH) && ((randomJ+(RENDER_SIZE/2)+1) < WORLD_WIDTH) && ((randomI-(RENDER_SIZE/2)) >= 0) && ((randomJ-(RENDER_SIZE/2)) >= 0)){
	    if(world[randomI][randomJ] == TileType.GRASS || world[randomI][randomJ] == TileType.SAND){		
		sword = new weaponConstructor(randomI,randomJ);
		sword.init();
		player = new playerConstructor(playerSrc,randomI,randomJ,16,false,DOM,IMG,"up",sword);
		player.img.src = player.src+"link_front_0.png";
		player.dom.appendChild(player.img);
		player.dom.appendChild(sword.dom);		
		player.dom.style.zIndex = 3;
		placed = true;
	    }
	}
    }
	// on place ensuite le joueur
    replace();
}

function replace(){
    player.posI = player.initI;
    player.posJ = player.initJ;
    
    player.dom.style.top=(player.posJ*TILE_SIZE)+"px";
    player.dom.style.left=(player.posI*TILE_SIZE)+"px";
}

//////////////////////////////HEARTS//////////////////////////////


// constructeur d'un objet coeur
function heartConstructor(id,src,initI,initJ,DOM,IMG){
	this.id = id;
	this.src = src;
	this.posI = initI;
	this.posJ = initJ;
	this.dom = DOM;
	this.img = IMG;
}


// placement du coeur sur le jeu
function placeHeart(id,I,J){
	heart_tab[id].dom.style.left = I*TILE_SIZE+"px";
	heart_tab[id].dom.style.top = J*TILE_SIZE+"px";	
}

// initialisation des coeurs
function initHearts(heart_number){
		// compteur des coeurs placés
		var counter = 0;
		var heartSrc = "res/spritesheets/link/hearts/";
		while(counter < heart_number){
		var DOM = document.createElement("div");
		var IMG = document.createElement("img");
		var heart;
		var randomI = Math.floor((Math.random() * (WORLD_WIDTH -1)));
		var randomJ = Math.floor((Math.random() * (WORLD_WIDTH -1)));
		// Si le coeurs peut être placé dans ces coordonnées (càd ni sur l'eau ni hors des limites et ni sur le joueur)
		if(world[randomI][randomJ] != TileType.WATER && randomI-1 > 0 && randomJ -1 > 0 && randomI+1 < WORLD_WIDTH && randomJ+1 < WORLD_WIDTH){
			if(randomI != player.posI && randomJ != player.posJ){
				// alors on créé un nouveau coeur, qu'on place directement ensuite
				heart = new heartConstructor(counter,heartSrc,randomI,randomJ,DOM,IMG);
				heart.dom.id = "heart"+counter;
				heart.img.src = heartSrc + "heart.png";
				heart.dom.appendChild(heart.img);
				heart.dom.style.zIndex = 2;
				heart.dom.style.position = "absolute";
				heart_tab[counter] = heart;
				placeHeart(counter,randomI,randomJ);
				// Et on incrémente le compteur
				counter++;
			}
		}
	}
}

////////////////////////////// BOAT //////////////////////////////


// constructeur de l'objet bateau

function boatConstructor(src,initI,initJ,DOM,IMG){
    this.src = src;
    this.initI = initI;
    this.initJ = initJ;
    this.posI = initI;
    this.posJ = initJ;
    this.dom = DOM;
    this.img = IMG;
}


// initialisation du bateau
function initBoat(){
	// Si un bateau existe déjà on le supprime
    if(document.getElementById("boat")){
	jeu.removeChild(divBoat);
    }
	// tant que le bateau n'est pas placé
    var placed = false;
    divBoat = document.createElement("div");
    divBoat.id = "boat";
    jeu.appendChild(divBoat);
    var boatSrc = "res/spritesheets/boat/";
    var DOM = document.getElementById("boat");
    var IMG = document.createElement("img");
    
    while(placed==false){
		
	// on cherche des coordonnées où il pourra être placé
	var randomI = Math.floor((Math.random() * (WORLD_WIDTH -2))+1);
	var randomJ = Math.floor((Math.random() * (WORLD_WIDTH -2))+1);
	if(world[randomI][randomJ] == TileType.WATER){
		// càd un endroit où il ne sera pas encerclé par des cases de terres et où il sera dans l'eau
	    if((world[randomI-1][randomJ] == TileType.GRASS && world[randomI+1][randomJ] == TileType.WATER && world[randomI][randomJ-1] == TileType.WATER && world[randomI][randomJ+1] == TileType.WATER )||
	       (world[randomI+1][randomJ] == TileType.GRASS && world[randomI-1][randomJ] == TileType.WATER && world[randomI][randomJ-1] == TileType.WATER && world[randomI][randomJ+1] == TileType.WATER) ||
	       (world[randomI][randomJ-1] == TileType.GRASS && world[randomI][randomJ+1] == TileType.WATER && world[randomI-1][randomJ] == TileType.WATER && world[randomI+1][randomJ] == TileType.WATER) || 
	       (world[randomI][randomJ+1] == TileType.GRASS && world[randomI][randomJ-1] == TileType.WATER && world[randomI-1][randomJ] == TileType.WATER && world[randomI+1][randomJ] == TileType.WATER)){
		boat = new boatConstructor(boatSrc,randomI,randomJ,DOM,IMG);
		boat.img.src = boat.src + "boat_front.png";
		boat.dom.appendChild(boat.img);		
		boat.dom.style.zIndex = 4;
		placed = true;
		
		replaceBoat();
	    }
	}
    }
}
// fonction permettant de placer le bateau
function replaceBoat(){
    boat.dom.style.top = boat.initJ*TILE_SIZE + "px";
    boat.dom.style.left= boat.initI*TILE_SIZE + "px";
    boat.posI = boat.initI;
    boat.posJ = boat.initJ;
}

////////////////////////////// NPC //////////////////////////////

// constructeur de l'objet npc
function npcConstructor(id, src, I, J,DOM,IMG,pas){
    this.npcI  = I;
    this.npcJ  = J;
    this.npcId = id;
    this.src = src;
    this.pas = pas;
    this.npcDOM = DOM;
    this.npcImg = IMG;
    
	// fonction qui permet au npc de bouger
    this.move = function(){
		
		// comme pour le personnage une variable pour savoir s'il peut se déplacer dans la direction voulue
	var canGo = true;
	// on choisi un direction en fonction d'un nombre aléatoire choisi entre 0 et 1
	var randomDir = Math.random();
	
	// par exemple si le nombre obtenu est entre 0 et 0.25 alors la direction sera vers le haut
	if(randomDir < 0.25 && randomDir >= 0){
	    // "up"
		// de ce fait on change l'image du npc
		this.npcImg.src = this.src + "npc_back.png"
		// on vérifie si la position sur laquelle il veut se déplacer n'est pas déjà occupée par le joueur
		if(this.npcJ-1 == player.posJ && this.npcI == player.posI){
			// si c'est le cas on l'empêche d'y aller
			canGo = false;
			// mais on enlève les PV du joueur de 1
			player.life--;
	    }
		// sinon il peut se déplacer on modifie ses coordonnées
	    if(world[this.npcI][this.npcJ-1]!= TileType.WATER && this.npcJ-1 > 0 && canGo){
		this.npcJ --;
	    }
	}
	// MÊME LOGIQUE POUR LES AUTRES CAS
	else if(randomDir < 0.5 && randomDir >= 0.25){
	    // "down"		
		this.npcImg.src = this.src + "npc_front.png"
		if(this.npcJ+1==player.posJ && this.npcI == player.posI){
			canGo = false;
			player.life--;
		}
	    if(world[this.npcI][this.npcJ+1] != TileType.WATER && this.npcJ+1 < WORLD_WIDTH-1 && canGo){
			this.npcJ ++;
	    }
	}
	else if(randomDir < 0.75 && randomDir >= 0.5){
	    // "left"	
		this.npcImg.src = this.src + "npc_left.png"
		if(this.npcI-1 == player.posI && this.npcJ == player.posJ){
			canGo = false;
			player.life--;
	    }
	    if(world[this.npcI-1][this.npcJ] != TileType.WATER && this.npcI-1 > 0 && canGo){
		this.npcI --;
	    }
	}
	else if(randomDir <= 1 && randomDir >= 0.75){
	    // "right"
		this.npcImg.src = this.src + "npc_right.png"
		if(this.npcI+1 == player.posI && this.npcJ == player.posJ){
			canGo = false;
			player.life = player.life -1;
	    }
	    if(world[this.npcI+1][this.npcJ] != TileType.WATER && this.npcI+1 < WORLD_WIDTH-1 && canGo){
		this.npcI ++;
	    }
	}
	this.npcDOM.style.top = (this.npcJ * TILE_SIZE) +"px";
	this.npcDOM.style.left = (this.npcI * TILE_SIZE) +"px";
    }
}

// initialisation des NPC (même logique que pour les coeurs)

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


// on lance la fonction move pour chaque npc dans le tableau (cette fonction, comme vu au début, sera appelée tout les secondes grâce à setInterval)
function npcMoves(){
    for(var i = 0; i < npc_tab.length ; i++){
		npc_tab[i].move();
    }
}


////// AJAX

// On créé une fonction AJAX grâce à jQuery qui va permettre de récupérer de manière asynchrone le score stocké dans la bdd
function MajBestScore(){
	$.ajax({
		type	: "POST",
		// on passe en post le score actuel du joueur
		data	: "data="+score,
		// cet url contient un code php qui va récupérer le meilleur score dans la bdd, va le comparer avec celui passé en POST et si celui passé en POST est supérieur alors on modifie la BDD et on renvoie ce score.
		// sinon on renvoie celui de la BDD
		url		: "http://infolimon.iutmontp.univ-montp2.fr/~kizardjianl/js-worldgen/majScore.php",
		success	: function(res){
			// le resultat obtenu est donc le plus haut score
			var bScore = res;
			// on va donc modifier le contenu html de la balise "best score"
			bestScore.innerHTML = "Best Score : "+bScore;			
		},
		error 	: function(){
				console.log("erreur");
		}
	});
}



