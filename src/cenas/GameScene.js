import Player from '../classes/Player.js';
import Enemy from '../classes/Enemy.js';
import Coin from '../classes/Coin.js';

// Define a cena principal do jogo
export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');  // Nome da cena
  }

create() {
  // Cria os comandos do teclado (setas)
  this.cursors = this.input.keyboard.createCursorKeys();


  // Array com as 6 imagens de fundo (para transições entre fases)
  this.bgImages = [
    'forest-bg1',
    'forest-bg2',
    'forest-bg3',
    'forest-bg4',
    'forest-bg5',
    'forest-bg6'
  ];
  this.currentBgIndex = 0; // índice do fundo atual

  // Fundo atual
  this.bg = this.add.tileSprite(0, 0, this.sys.game.config.width, this.sys.game.config.height, this.bgImages[this.currentBgIndex])
    .setOrigin(0, 0)
    .setDepth(-2); // fica no fundo da cena

  // Segundo fundo (para fade-in)
  this.bgNext = this.add.tileSprite(0, 0, this.sys.game.config.width, this.sys.game.config.height, '')
    .setOrigin(0, 0)
    .setDepth(-1) // Sobre o fundo anterior
    .setAlpha(0); // Invisível inicialmente

  // Variáveis de controlo de transição de fundo
  this.bgFading = false;
  this.bgFadeElapsed = 0; 
  this.bgFadeDuration = 1000; // duração do fade em milissegundos

  this.nextBgScore = 15; // pontuação para trocar de fundo


  // Criação dos grupos de objetos físicos
  this.platforms = this.physics.add.staticGroup(); // plataformas fixas
  this.coins = this.physics.add.group();           // moedas dinâmicas
  this.enemies = this.physics.add.group();         // inimigos dinâmicos

  // Geração inicial de 10 plataformas com espaçamento aleatório
  this.lastPlatformX = 100;
  for (let i = 0; i < 10; i++) {
    this.addPlatform(this.lastPlatformX);
    this.lastPlatformX += Phaser.Math.Between(250, 400);
  }

  // Insatancia o jogador
  this.player = new Player(this, 100, 300);

  // Flag: começa falso, só trava o player no meio depois
  this.lockPlayerCenter = false;

  // Inicialização da pontuação
  this.score = 0;
  this.scoreText = this.add.text(16, 16, 'Pontuação: 0', {
    fontSize: '24px',
    fill: '#fff'
  });
  // Carrega o recorde guardado localmente (localStorage)
  const maxScore = localStorage.getItem('maxScore') || 0;
  this.maxScoreText = this.add.text(this.sys.game.config.width / 2, 16, 'Recorde: ' + maxScore, {
    fontSize: '24px',
    fill: '#ffff00'
  }).setOrigin(0.5, 0);

  // Tempo para gerar moedas aleatórias
  this.time.addEvent({
    delay: 2000, // a cada 2 segundos
    callback: this.spawnRandomCoin,
    callbackScope: this,
    loop: true
  });

   // Timer para inimigos a cada 5s
  this.time.addEvent({
    delay: 5000,
    callback: this.spawnEnemyFromSky,
    callbackScope: this,
    loop: true
  });


  // Colisões físicas e sobreposições
  this.physics.add.collider(this.player, this.platforms);
  this.physics.add.collider(this.enemies, this.platforms);
  this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
  this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);
  // Botão de pausa fixo no canto superior direito
  this.pauseButton = this.add.text(this.sys.game.config.width - 100, 16, 'Pausa', {
  fontSize: '24px',
  fill: '#fff',
  backgroundColor: '#000',
  padding: { x: 10, y: 5 }
})
.setInteractive()
.setScrollFactor(0)
.on('pointerdown', () => {
  this.scene.launch('PauseScene');  // Lança a cena de pausa por cima
  this.scene.pause();               // Pausa a GameScene, o jogo atual
});

}

update() {
  // Atualiza o movimento do jogador
  this.player.update(this.cursors);

  const playerVelocityX = this.player.body.velocity.x;

  // Quando o player chegar ao centro do ecrã, ativa o travamento
  if (!this.lockPlayerCenter && this.player.x >= this.sys.game.config.width / 2) {
    this.lockPlayerCenter = true;
  }

  if (this.lockPlayerCenter) {
    // Travar o player no centro do ecrã
    this.player.x = this.sys.game.config.width / 2;

    // Movimento do fundo proporcional à velocidade do player
    if (playerVelocityX !== 0) {
      const deslocamento = playerVelocityX * this.game.loop.delta / 1000;

      this.bg.tilePositionX += deslocamento;

      // Se estiver em transição, sincroniza movimento do bgNext
      if (this.bgFading) {
        this.bgNext.tilePositionX += deslocamento;
      }


      // Move plataformas e objetos ao contrário do movimento do player, para a esquerda
      this.platforms.children.iterate(platform => {
        platform.x -= deslocamento;
        platform.refreshBody();
      });

      this.coins.children.iterate(coin => {
        coin.x -= deslocamento;
        coin.body.updateFromGameObject(); // sincroniza corpo com sprite
      });
        this.enemies.children.iterate(enemy => enemy.x -= deslocamento);
    }
    // Transição de fundo (fade suave)
    if (this.bgFading) {
      this.bgFadeElapsed += this.game.loop.delta;
      const progress = Phaser.Math.Clamp(this.bgFadeElapsed / this.bgFadeDuration, 0, 1);
      this.bgNext.setAlpha(progress);

      if (progress >= 1) {
        // Finaliza transição: troca textura do bg principal
        this.bg.setTexture(this.bgImages[this.currentBgIndex]);
        this.bg.tilePositionX = this.bgNext.tilePositionX; // mantém scroll contínuo
        this.bgNext.setAlpha(0);
        this.bgFading = false;
      }
    }
  }

  // Adicionar novas plataformas conforme avança
  const rightmostPlatform = this.getRightmostPlatform();
  if (rightmostPlatform.x < this.sys.game.config.width) {
    this.addPlatform(rightmostPlatform.x + Phaser.Math.Between(250, 400));
  }

  // Perde se cair para fora do ecrã
  if (this.player.y > this.sys.game.config.height) {
    this.sound.play('stompSound');

  // Atualiza recorde se a pontuação atual for maior
  const maxScore = localStorage.getItem('maxScore') || 0;
  if (this.score > maxScore) {
    localStorage.setItem('maxScore', this.score);
  }

    // Vai para a cena de Game Over com a pontuação atual
    this.scene.start('GameOverScene', { score: this.score });
    return;
  }
  // Atualiza inimigos
  this.enemies.children.iterate(enemy => enemy.update());
  // Mudar background a cada 15 pontos
  if (this.score >= this.nextBgScore) {
    this.changeBackground();
    this.nextBgScore += 15;
  }

}

changeBackground() {
  // Troca o índice do fundo
  this.currentBgIndex = (this.currentBgIndex + 1) % this.bgImages.length;

  // Define o novo fundo para iniciar fade-in
  this.bgNext.setTexture(this.bgImages[this.currentBgIndex]);
  this.bgNext.setAlpha(0);
  this.bgFading = true;
  this.bgFadeElapsed = 0;

  // Aumentar a velocidade dos inimigos
  this.enemies.children.iterate(enemy => {
    if (enemy.body.velocity.y !== 0) {
      enemy.setVelocityY(enemy.body.velocity.y * 1.2); // Aumenta em 20%
    }
  });

  // Aumenta a quantidade de inimigos gerados a partir do 4º background
  if (this.currentBgIndex >= 3) {
    this.extraEnemyChance = 20; // Chance extra de inimigo (%)
  } else {
    this.extraEnemyChance = 0;
  }
}

// Retorna a plataforma mais próxima do jogador
getNearestPlatform() {
  let nearest = null;
  let minDistance = Infinity;

  this.platforms.children.iterate(platform => {
    const distance = Math.abs(platform.x - this.player.x);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = platform;
    }
  });

  return nearest;
}

// Verifica se o jogador está sobre algum vão
isOverGap() {
  let overPlatform = false;

  this.platforms.children.iterate(platform => {
    const platformLeft = platform.x - platform.displayWidth * 0.5;
    const platformRight = platform.x + platform.displayWidth * 0.5;

    if (this.player.x > platformLeft && this.player.x < platformRight) {
      overPlatform = true;
    }
  });

  return !overPlatform;
}

// Coleta de moedas
collectCoin(player, coin) {
  coin.destroy();
  this.sound.play('coinSound');
  this.score += 1;
  this.scoreText.setText('Pontuação: ' + this.score);
}
// Colisão com inimigo
hitEnemy() {
  // Atualiza recorde se a pontuação atual for maior
  const maxScore = localStorage.getItem('maxScore') || 0;
  if (this.score > maxScore) {
    localStorage.setItem('maxScore', this.score);
  }

  this.sound.play('stompSound');
  this.scene.start('GameOverScene', { score: this.score });
}

// Adiciona plataforma e objetos associados (moedas e inimigos)
addPlatform(x) {
  const y = Phaser.Math.Between(700, 850);
  const platform = this.platforms.create(x, y, 'chao');
  platform.setScale(0.5, 0.2);
  platform.refreshBody();
  this.lastPlatformX = x;

  const platformTop = y - (platform.displayHeight * 0.5);

  // Apenas UMA moeda possível por plataforma
  if (Phaser.Math.Between(0, 100) < 30) {
    const coin = new Coin(this, x, platformTop - 15);
    this.coins.add(coin);
  }

 // Inimigo normal
  if (Phaser.Math.Between(0, 100) < 30) {
    this.spawnEnemyOnPlatformOrSky(x, platformTop);
  }

  // Chance extra de inimigos a partir do 4º background
  if (this.extraEnemyChance && Phaser.Math.Between(0, 100) < this.extraEnemyChance) {
    this.spawnEnemyOnPlatformOrSky(x, platformTop);
  }

  // 20% chance de moeda flutuante (em altura bem acima)
  if (Phaser.Math.Between(0, 100) < 20) {
    this.addFloatingCoin(x);
  }
}

// Adiciona uma moeda flutuante (com verificação de proximidade)
addFloatingCoin(x) {
  const minHeight = 550;
  const maxHeight = 650;
  const y = Phaser.Math.Between(minHeight, maxHeight);

  if (!this.isCoinTooClose(x, y)) {
    const coin = new Coin(this, x, y);
    this.coins.add(coin);
  }
}

spawnFloatingCoin(x) {
  const minHeight = 550;
  const maxHeight = 650;
  const y = Phaser.Math.Between(minHeight, maxHeight);

  if (!this.isCoinTooClose(x, y)) {
    const coin = new Coin(this, x, y);
    this.coins.add(coin);
  }
}

// Spawna moeda aleatória
spawnRandomCoin() {
  // Posição X para spawnar moeda, fora da tela à direita
  const x = this.sys.game.config.width + Phaser.Math.Between(100, 300);

  // Decide aleatoriamente se a moeda vai em plataforma ou flutuando
  const spawnOnPlatform = Phaser.Math.Between(0, 1) === 0; // 50% chance

  if (spawnOnPlatform) {
    // Tenta encontrar a plataforma mais próxima do X escolhido
    let chosenPlatform = null;
    let minDistance = Infinity;

    this.platforms.children.iterate(platform => {
      const distance = Math.abs(platform.x - x);
      if (distance < minDistance) {
        minDistance = distance;
        chosenPlatform = platform;
      }
    });

    if (chosenPlatform && minDistance < 150) { // plataforma próxima suficiente
      const platformTop = chosenPlatform.y - (chosenPlatform.displayHeight * 0.5);
      const coin = new Coin(this, x, platformTop - 15);
      this.coins.add(coin);
    } else {
      // Se não tiver plataforma próxima, gera flutuando
      this.spawnFloatingCoin(x);
    }

  } else {
    // Spawn flutuante
    this.spawnFloatingCoin(x);
  }
}

// Verifica se há moedas próximas (para evitar sobreposição)
isCoinTooClose(x, y) {
  const minDistance = 50; // distância mínima em pixels

  let tooClose = false;

  this.coins.children.iterate(existingCoin => {
    const dx = existingCoin.x - x;
    const dy = existingCoin.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance) {
      tooClose = true;
    }
  });

  return tooClose;
}

// Encontra a plataforma mais à direita (para gerar a próxima)
getRightmostPlatform() {
  let rightmost = null;
  this.platforms.children.iterate(platform => {
    if (!rightmost || platform.x > rightmost.x) {
      rightmost = platform;
    }
  });
  return rightmost;
}

// Cria inimigo a cair do céu
spawnEnemyFromSky() {
  const x = this.sys.game.config.width + Phaser.Math.Between(100, 400);
  const y = Phaser.Math.Between(-250, -100);
  const enemy = new Enemy(this);
  enemy.setPosition(x, y);
  enemy.setVelocityY(Phaser.Math.Between(150, 300));
  enemy.setScale(0.2);
  this.enemies.add(enemy);
}

// Cria inimigos em plataformas ou a cair
spawnEnemyOnPlatformOrSky(x, platformTop) {
  const enemy = new Enemy(this);

  if (Phaser.Math.Between(0, 1) === 0) {
    enemy.setPosition(x, platformTop - 40);
    enemy.setVelocityY(0);
  } else {
    const skyY = Phaser.Math.Between(-200, -50);
    enemy.setPosition(x, skyY);
    enemy.setVelocityY(Phaser.Math.Between(100, 300));
  }

  enemy.setScale(0.2);
  this.enemies.add(enemy);
}


}
