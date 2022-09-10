// Targeting canvas
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

canvas.width = innerWidth;
canvas.height= innerHeight;

// Targeting HTML elements
const bgm = document.getElementById('bgm');
const scoreEl = document.getElementById('scoreEl');
const instruction = document.getElementById('instruction');
const startGame = document.getElementById('startGame');
const scoreCard = document.getElementById('scoreCard');
const yourScore = document.getElementById('yourScore');
const highScore = document.getElementById('highScore');
const killCountEl = document.getElementById('killCountEl');
const gameOver = document.getElementById('gameOver');
const yourScoreUI = document.getElementById('yourScoreUI');
const enemyKilledContainer = document.getElementById('enemyKilledContainer');
const reset = document.getElementById('reset');

// Sound effects
let shootSound = new Audio('SoundEffects/gunShot.mp3');
let explosionSound;
let gameStartSound = new Audio('SoundEffects/gameStart.mp3');
let gameOverSound = new Audio('SoundEffects/gameOver.mp3');

// to start the background music when the window is loaded
window.onload = function() {
    bgm.muted = false;
}

// Player class
class Player{
    constructor(x,y,radius,color){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    // to draw the player
    draw(){
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

// Projectile class
class Projectile{
    constructor(x,y,radius,color,velocity){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    // to draw the projectile
    draw(){
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    // to update the position of projectile
    update(){
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

// Enemy class
class Enemy{
    constructor(x,y,radius,color,velocity){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    // to draw the enemy
    draw(){
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    // to update the position of enemy
    update(){
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

// Particle class
class Particle{
    constructor(x,y,radius,color,velocity){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.friction = 0.99;
        this.alpha = 1;
    }

    // to draw the enemy
    draw(){
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    // to update the position of enemy
    update(){
        this.draw();
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.01;
    }
}

// Creating a Player
const playerX = canvas.width/2;
const playerY = canvas.height/2;
let player;

// Defining group of projectiles
let projectiles;

// Defining group of enemies
let enemies;

// Defining group of particles
let particles;

// Animation ID
let animationId;

// Interval ID
let intervalId;

// musicTimeoutId
let musicTimeoutId;

// Defining score
let score;

// Defining highScore
let highScoreVal = localStorage.getItem('HighScore')?Number(localStorage.getItem('HighScore')):0;
highScore.innerHTML = highScoreVal;

// Defining kill count
let killCount;

// function for initialize all the variables
function init(){
    player = new Player(playerX,playerY,10,'white');
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    killCount = 0;
    scoreEl.innerHTML = score;
    scoreEl.innerHTML = score;
}

// function for calculating velocity
function getVelocity(sourceX,sourceY,destinationX,destinationY, velocityRatio=1){
    // to find angle
    const angle = Math.atan2(destinationY-sourceY,destinationX-sourceX);

    return {
        x: Math.cos(angle) * velocityRatio,
        y: Math.sin(angle) * velocityRatio
    }
}

// function for spawn enemies
function spawnEnemies(){
    intervalId = setInterval(()=>{
        const radius = 4 + Math.random()*(30-4);
        let x,y;
        if (Math.random()<0.5)
        {
            x = Math.random()<0.5?0-radius:canvas.width+radius;
            y = Math.random()*canvas.height;
        }
        else{
            x = Math.random()*canvas.width;
            y = Math.random()<0.5?0-radius:canvas.height+radius;
        }
        const color = `hsl(${Math.random()*360},50%,50%)`;

        // to define velocity of enemy
        const velocity = getVelocity(x,y,playerX,playerY,1+Math.random()*(1.5-1));

        enemies.push(new Enemy(x,y,radius,color,velocity));
    },1000);
}

// function for animation
function animate(){
    animationId = requestAnimationFrame(animate);
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    player.draw();

    particles.forEach((particle, ptIndex)=>{
        // When the alpha of a particle becomes less than or equal zero remove the particle from particles array
        if (particle.alpha <= 0){
            particles.splice(ptIndex,1);
        }else{
            particle.update();
        }
    });
    
    projectiles.forEach((projectile, prIndex)=>{
        projectile.update();

        // projectile, which is out of canvas, remove it from projectiles array
        if ((projectile.x + projectile.radius) < 0 || (projectile.x - projectile.radius) > canvas.width || (projectile.y + projectile.radius) < 0 || (projectile.y - projectile.radius) > canvas.height){
            setTimeout(()=>{
                projectiles.splice(prIndex,1);
            },0);
        }
    });

    enemies.forEach((enemy, eIndex)=>{
        enemy.update();

        // Detect collision in b/w an enemy and player
        const distance = Math.hypot(player.x-enemy.x,player.y-enemy.y);
        if (distance-player.radius-enemy.radius <= 0){
            // stop the game
            cancelAnimationFrame(animationId);
            // stop the generation of enemy in background
            clearInterval(intervalId);

            // to stop shootSound
            shootSound.pause();
            shootSound.currentTime = 0;

            // Gmae Over sound effect
            let isGOPlaying = gameOverSound.currentTime > 0 && !gameOverSound.paused && !gameOverSound.ended && gameOverSound.readyState > gameOverSound.HAVE_CURRENT_DATA;
            if (!isGOPlaying) {
                gameOverSound.play();
            }

            if (score > localStorage.getItem('HighScore')) localStorage.setItem('HighScore',String(score));
            yourScore.innerHTML = score;
            highScore.innerHTML = localStorage.getItem('HighScore');
            killCountEl.innerHTML = killCount;
            instruction.style.display = 'none';
            gameOver.style.display = 'block';
            yourScoreUI.style.display = 'block';
            enemyKilledContainer.style.display = 'block';
            scoreCard.style.display = 'flex';

            musicTimeoutId = setTimeout(()=>{
                let isBGMPlaying = bgm.currentTime > 0 && !bgm.paused && !bgm.ended && bgm.readyState > bgm.HAVE_CURRENT_DATA;
                if (!isBGMPlaying) {
                    bgm.play();
                }
            },2500);
        }

        // Detect collision in b/w an enemy with all projectiles
        projectiles.forEach((projectile, prIndex)=>{
            // Distance between the center of enemy and projectile
            const distance = Math.hypot(projectile.x-enemy.x,projectile.y-enemy.y);
            
            if (distance-projectile.radius-enemy.radius <= 0){
                // collision detected
                // Create explosion particles on collision
                for(let i=0;i<enemy.radius*2;i++){
                    particles.push(new Particle(projectile.x,projectile.y,Math.random()*2,enemy.color,{
                        x:(Math.random()-0.5)*(Math.random()*6),
                        y:(Math.random()-0.5)*(Math.random()*6)
                    }));
                }

                // Sound effect
                explosionSound = new Audio('SoundEffects/enemyExplosion.mp3');
                explosionSound.volume = ((enemy.radius<=26?enemy.radius+4:enemy.radius)-4)*(1/(30-4));
                let isExPlaying = explosionSound.currentTime > 0 && !explosionSound.paused && !explosionSound.ended && explosionSound.readyState > explosionSound.HAVE_CURRENT_DATA;
                if (!isExPlaying) {
                    explosionSound.play();
                }

                if (enemy.radius-10 > 5){
                    // update score for shrinking enemy
                    score += 5;
                    scoreEl.innerHTML = score;

                    // shrink the enemy radius
                    gsap.to(enemy,{
                        radius: enemy.radius-10
                    });
                    setTimeout(()=>{
                        projectiles.splice(prIndex,1);
                    },0);
                }
                else{
                    // update score for killing enemy
                    score += 10;
                    scoreEl.innerHTML = score;

                    // updating killCount
                    killCount++;

                    // remove the enemy from enemies array
                    setTimeout(()=>{
                        enemies.splice(eIndex,1);
                        projectiles.splice(prIndex,1);
                    },0);
                }
            }
        });
    });
}


// to shoot projectiles in the direction where we clicked
addEventListener('click',(event)=>{
    if (scoreCard.style.display === 'none'){
        // to define velocity of projectile
        const velocity = getVelocity(playerX,playerY,event.clientX,event.clientY,6);
    
        // Sound effects
        shootSound.pause();
        shootSound.currentTime = 0;
        let isSSPlaying = shootSound.currentTime > 0 && !shootSound.paused && !shootSound.ended && shootSound.readyState > shootSound.HAVE_CURRENT_DATA;
        if (!isSSPlaying) {
            shootSound.play();
        }
    
        // Creating projectile on every click and push it on projectiles array
        projectiles.push(new Projectile(
            playerX,playerY,5,'white',velocity
        ));
    }
});

startGame.addEventListener('click',(event)=>{
    // to stop ovelaping click event
    event.stopPropagation();
    // to initialize every variable when we start game
    init();
    // game start sound effect
    gameStartSound.play();
    // for animation
    animate();
    // for spawn enemies
    spawnEnemies();
    // remove start game UI
    scoreCard.style.display = 'none';
    // to stop background music
    if (musicTimeoutId) clearTimeout(musicTimeoutId);
    bgm.pause();
});

reset.addEventListener('click',()=>{
    localStorage.removeItem('HighScore');
    highScore.innerHTML = 0;
});