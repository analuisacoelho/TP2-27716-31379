export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    // Inicializa o sprite do jogador com a textura 'player'
    super(scene, x, y, 'player');
    // Adiciona o jogador como GameObject visível e corpo físico na cena
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Garante que o jogador não possa sair dos limites do mundo (ecrã)
    this.setCollideWorldBounds(true);
    // Define a origem como centro inferior (útil para animações e colisões)
    this.setOrigin(0.5, 1); 
    // Aplica uma escala para reduzir visualmente o sprite
    this.setScale(0.35);

    // Ajusta o tamanho e posição da hitbox do corpo físico
    // Isso melhora a precisão da colisão em relação ao visual do sprite
    this.body.setSize(70, 180).setOffset(70, 250);

    // Cria a animação 'run' se ainda não existir (evita recriação repetida)
    if (!scene.anims.exists('run')) {
      scene.anims.create({
        key: 'run',
        frames: [
          { key: 'player', frame: 0 },
          { key: 'player', frame: 1 },
          { key: 'player', frame: 2 },
          { key: 'player', frame: 3 }
        ],
        frameRate: 10,
        repeat: -1 // loop infinito
      });
    }
    
    // Controlo de saltos múltiplos
    this.jumpCount = 0;     // número atual de saltos
    this.maxJumps = 2;      // número máximo permitido
    this.isJumping = false; // flag de estado
  }

  // Método chamado a cada frame pela cena para controlar o jogado
  update(cursors) {
    // Movimento lateral
    if (cursors.left.isDown) {
      // Move para a esquerda
      this.setVelocityX(-160);
      // Toca a animação de corrida se ainda não estiver a rodar
      if (!this.anims.isPlaying || this.anims.currentAnim.key !== 'run') {
        this.anims.play('run', true);
      }
      this.flipX = true; // vira o sprite horizontalmente
    } else if (cursors.right.isDown) {
      // Move para a direita
      this.setVelocityX(160);
      if (!this.anims.isPlaying || this.anims.currentAnim.key !== 'run') {
        this.anims.play('run', true);
      }
      this.flipX = false; // mantém o sprite na direção original
    } else {
      // Nenhuma tecla pressionada: para o movimento e mostra frame parado
      this.setVelocityX(0);
      this.anims.stop();
      this.setFrame(0); // exibe o primeiro frame
    }

    // Reset do número de saltos ao tocar no chão
    if (this.body.blocked.down) {
      this.jumpCount = 0;
      this.isJumping = false;
    }

    if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
      // Só permite salto se não excedeu o número máximo
      if (this.jumpCount < this.maxJumps) {
        this.setVelocityY(-400); // impulso vertical
        this.jumpCount++;        // impulso vertical
        this.isJumping = true;
      }
    }
  }
}
