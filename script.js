// Canvas setup and game constants
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const MAX_SCORE = 99999;
const DIAMOND_GENERATION_INTERVAL = 277;
const WALK_ANIMATION_INTERVAL = 200;
const PLAYER_MARGIN = 25;

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.score = 0;
        this.gameOver = false;
        this.sprites = this.loadSprites();
        this.bullets = [];
        this.diamonds = [];
        this.keysPressed = {
            ArrowLeft: false,
            ArrowRight: false,
            ArrowUp: false,
            ArrowDown: false
        };
        
        this.player = {
            x: CANVAS_WIDTH / 2 - 35,
            y: CANVAS_HEIGHT / 2 - 35,
            width: 70,
            height: 70,
            speed: 3,
            direction: 'down',
            isWalking: false,
            walkFrame: 0,
            collisionPoints: [
                { x: 36, y: 62 },
                { x: 36, y: 57 },
                { x: 35, y: 51 },
                { x: 35, y: 44 },
                { x: 35, y: 37 }
            ]
        };

        this.walkInterval = null;
        this.bindEvents();
        this.startGame();
    }

    loadSprites() {
        const directions = ['down', 'left', 'right', 'up'];
        const sprites = {};

        directions.forEach(direction => {
            sprites[direction] = new Image();
            sprites[`${direction}Walk`] = new Image();
            sprites[direction].src = `assets/Playersprite${direction}.png`;
            sprites[`${direction}Walk`].src = `assets/Playersprite${direction}walk.png`;
        });

        return sprites;
    }

    formatScore(score) {
        return score.toString().padStart(5, '0');
    }

    createBullet() {
        return {
            x: this.player.x + this.player.width / 2 - 2.5,
            y: this.player.y + this.player.height / 2 - 2.5,
            width: 5,
            height: 5,
            speed: 6,
            direction: this.player.direction
        };
    }

    generateDiamond() {
        const size = 20;
        const speed = Math.random() * 4 + 2;
        const position = this.calculateDiamondSpawnPosition();
        
        this.diamonds.push({
            x: position.x,
            y: position.y,
            size,
            speed,
            direction: position.direction
        });
    }

    calculateDiamondSpawnPosition() {
        const spawnPoint = Math.floor(Math.random() * 4);
        const positions = [
            { x: 0, y: Math.random() * CANVAS_HEIGHT, direction: 'right' },
            { x: CANVAS_WIDTH, y: Math.random() * CANVAS_HEIGHT, direction: 'left' },
            { x: Math.random() * CANVAS_WIDTH, y: 0, direction: 'down' },
            { x: Math.random() * CANVAS_WIDTH, y: CANVAS_HEIGHT, direction: 'up' }
        ];
        
        return positions[spawnPoint];
    }

    movePlayer() {
        if (this.keysPressed.ArrowLeft && this.player.x > -PLAYER_MARGIN) {
            this.player.x = Math.max(this.player.x - this.player.speed, -PLAYER_MARGIN);
            this.player.direction = 'left';
        } else if (this.keysPressed.ArrowRight && this.player.x + this.player.width < CANVAS_WIDTH + PLAYER_MARGIN) {
            this.player.x = Math.min(this.player.x + this.player.speed, CANVAS_WIDTH - this.player.width + PLAYER_MARGIN);
            this.player.direction = 'right';
        } else if (this.keysPressed.ArrowUp && this.player.y > -this.player.height / 2) {
            this.player.y = Math.max(this.player.y - this.player.speed, -this.player.height / 2);
            this.player.direction = 'up';
        } else if (this.keysPressed.ArrowDown && this.player.y + this.player.height < CANVAS_HEIGHT) {
            this.player.y = Math.min(this.player.y + this.player.speed, CANVAS_HEIGHT - this.player.height);
            this.player.direction = 'down';
        }
    }

    updateGameObjects() {
        this.updateBullets();
        this.updateDiamonds();
        if (this.player.isWalking) {
            this.movePlayer();
        }
    }

    updateBullets() {
        this.bullets = this.bullets.filter(bullet => {
            bullet[bullet.direction === 'left' || bullet.direction === 'right' ? 'x' : 'y'] += 
                bullet.speed * (bullet.direction === 'left' || bullet.direction === 'up' ? -1 : 1);
            
            return bullet.x >= 0 && bullet.x <= CANVAS_WIDTH && 
                   bullet.y >= 0 && bullet.y <= CANVAS_HEIGHT;
        });
    }

    updateDiamonds() {
        this.diamonds = this.diamonds.filter(diamond => {
            diamond[diamond.direction === 'left' || diamond.direction === 'right' ? 'x' : 'y'] += 
                diamond.speed * (diamond.direction === 'left' || diamond.direction === 'up' ? -1 : 1);
            
            return diamond.x >= 0 && diamond.x <= CANVAS_WIDTH && 
                   diamond.y >= 0 && diamond.y <= CANVAS_HEIGHT;
        });
    }

    render() {
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        this.renderPlayer();
        this.renderBullets();
        this.renderDiamonds();
    }

    renderPlayer() {
        const sprite = this.player.isWalking && this.player.walkFrame ? 
            this.sprites[`${this.player.direction}Walk`] : 
            this.sprites[this.player.direction];
        
        this.ctx.drawImage(sprite, this.player.x, this.player.y, this.player.width, this.player.height);
    }

    renderBullets() {
        this.ctx.fillStyle = 'white';
        this.bullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
    }

    renderDiamonds() {
        this.ctx.fillStyle = '#2DFDCB';
        this.diamonds.forEach(diamond => {
            this.ctx.beginPath();
            this.ctx.moveTo(diamond.x + diamond.size / 2, diamond.y);
            this.ctx.lineTo(diamond.x + diamond.size, diamond.y + diamond.size / 2);
            this.ctx.lineTo(diamond.x + diamond.size / 2, diamond.y + diamond.size);
            this.ctx.lineTo(diamond.x, diamond.y + diamond.size / 2);
            this.ctx.closePath();
            this.ctx.fill();
        });
    }

    checkCollisions() {
        this.checkBulletDiamondCollisions();
        this.checkPlayerDiamondCollisions();
    }

    checkBulletDiamondCollisions() {
        this.bullets = this.bullets.filter(bullet => {
            const hitDiamond = this.diamonds.findIndex(diamond => 
                bullet.x < diamond.x + diamond.size &&
                bullet.x + bullet.width > diamond.x &&
                bullet.y < diamond.y + diamond.size &&
                bullet.y + bullet.height > diamond.y
            );

            if (hitDiamond !== -1) {
                this.diamonds.splice(hitDiamond, 1);
                this.updateScore();
                return false;
            }
            return true;
        });
    }

    checkPlayerDiamondCollisions() {
        const playerCollisionPoints = this.player.collisionPoints.map(point => ({
            x: this.player.x + point.x,
            y: this.player.y + point.y
        }));

        this.diamonds.some(diamond => {
            if (playerCollisionPoints.some(point => 
                point.x >= diamond.x &&
                point.x <= diamond.x + diamond.size &&
                point.y >= diamond.y &&
                point.y <= diamond.y + diamond.size
            )) {
                this.endGame();
                return true;
            }
            return false;
        });
    }

    updateScore() {
        this.score += Math.floor(Math.random() * 1000) + 10;
        this.scoreElement.textContent = this.formatScore(Math.min(this.score, MAX_SCORE));
        
        if (this.score >= MAX_SCORE) {
            this.winGame();
        }
    }

    winGame() {
        alert("You won! :D");
        this.resetGame();
    }

    endGame() {
        this.gameOver = true;
        alert("Game Over!");
        this.resetGame();
    }

    resetGame() {
        this.score = 0;
        this.scoreElement.textContent = this.formatScore(this.score);
        location.reload();
    }

    bindEvents() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    handleKeyDown(e) {
        if (Object.keys(this.keysPressed).includes(e.key)) {
            this.keysPressed[e.key] = true;
            this.player.isWalking = true;
            
            if (!this.walkInterval) {
                this.walkInterval = setInterval(() => {
                    this.player.walkFrame = !this.player.walkFrame;
                }, WALK_ANIMATION_INTERVAL);
            }
        } else if (e.key === ' ') {
            this.bullets.push(this.createBullet());
        }
    }

    handleKeyUp(e) {
        if (Object.keys(this.keysPressed).includes(e.key)) {
            this.keysPressed[e.key] = false;
            
            if (!Object.values(this.keysPressed).includes(true)) {
                this.player.isWalking = false;
                this.player.walkFrame = 0;
                clearInterval(this.walkInterval);
                this.walkInterval = null;
            }
        }
    }

    gameLoop() {
        if (this.gameOver) return;
        
        this.updateGameObjects();
        this.checkCollisions();
        this.render();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    startGame() {
        this.scoreElement.textContent = this.formatScore(this.score);
        setInterval(() => this.generateDiamond(), DIAMOND_GENERATION_INTERVAL);
        this.gameLoop();
    }
}

// Initialize game
const game = new Game();